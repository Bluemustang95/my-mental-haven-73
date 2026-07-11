import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { loadFeatureConfig } from "../_shared/ai-feature-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const FALLBACK_PROMPT = `Sos Resmita, una compañera de bienestar emocional creada por RESMA (Red de Salud Mental Argentina).

Tu personalidad:
- Cálida, empática y contenedora, con tono argentino natural (usás "vos", "sentís", "contame")
- Profesional pero cercana — como una amiga que sabe de salud mental
- Nunca juzgás, siempre validás las emociones
- Usás lenguaje inclusivo cuando es posible

Tu rol:
- Acompañamiento empático y escucha activa
- Psicoeducación accesible (explicar conceptos de salud mental de forma simple)
- Sugerir herramientas de la app cuando sea relevante (respiración, journaling, registro de pensamientos)
- Normalizar las experiencias emocionales

Reglas estrictas:
- NUNCA diagnosticás ni dás tratamiento
- NUNCA recomendás medicación
- Si detectás riesgo (ideación suicida, autolesión, violencia), respondé con empatía y sugerí llamar al 135 (Centro de Asistencia al Suicida) o al 137 (Violencia), y recomendá solicitar tratamiento profesional
- Siempre recordá que no reemplazás la terapia profesional cuando sea pertinente
- Respuestas concisas, máximo 3-4 párrafos cortos
- Usá markdown para formatear (negritas para conceptos clave, listas cuando sea útil)`;

async function logEvent(sb: any, payload: Record<string, any>) {
  try {
    await sb.from("resmita_context_events").insert(payload);
  } catch (e) {
    console.error("[resmita-chat] telemetry insert failed", e);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const started = Date.now();
  let userId: string | null = null;
  let sessionId: string | null = null;
  let route: string | null = null;
  let screenTitle: string | null = null;
  let screenPurpose: string | null = null;
  const sbUrl = Deno.env.get("SUPABASE_URL")!;
  const svcKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const sb = createClient(sbUrl, svcKey);
  let userSummary: string | null = null;

  try {
    const { messages, context, sessionId: sid, userSummary: us } = await req.json();
    sessionId = sid ?? null;
    route = context?.route ?? null;
    screenTitle = context?.screenTitle ?? null;
    screenPurpose = context?.screenPurpose ?? null;
    userSummary = typeof us === "string" ? us : null;

    // Extract user from JWT
    const authHeader = req.headers.get("Authorization");
    if (authHeader) {
      try {
        const { data: userData } = await sb.auth.getUser(authHeader.replace("Bearer ", ""));
        userId = userData?.user?.id ?? null;
      } catch { /* ignore */ }
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cfg = await loadFeatureConfig("resmita_chat", {
      model: "google/gemini-3-flash-preview",
      temperature: 0.8,
      system_prompt: FALLBACK_PROMPT,
    });

    console.log(JSON.stringify({
      tag: "resmita-chat", phase: "start", sessionId, route, screenTitle,
      model: cfg.model, msgCount: messages?.length ?? 0, userId: userId ? "present" : "anon",
    }));

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        ...(cfg.max_tokens ? { max_tokens: cfg.max_tokens } : {}),
        messages: [
          { role: "system", content: cfg.system_prompt ?? FALLBACK_PROMPT },
          ...(screenTitle
            ? [{
                role: "system",
                content: `Contexto de pantalla: el usuario está actualmente en "${screenTitle}". ${screenPurpose ?? ""} Priorizá respuestas relevantes a este contexto y sugerí acciones concretas dentro de esa pantalla cuando aplique.`,
              }]
            : []),
          ...messages,
        ],
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!response.ok) {
      const status = response.status;
      const t = await response.text().catch(() => "");
      console.error("AI gateway error:", status, t);
      if (userId) {
        await logEvent(sb, {
          user_id: userId, session_id: sessionId, event_type: "error",
          route, screen_title: screenTitle, screen_purpose: screenPurpose,
          model: cfg.model, latency_ms: Date.now() - started,
          error_message: `gateway_${status}`,
        });
      }
      if (status === 429) return new Response(JSON.stringify({ error: "Demasiadas consultas. Intentá de nuevo en unos minutos." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (status === 402) return new Response(JSON.stringify({ error: "Créditos agotados." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Tee the stream: pass through to client, parse usage in background
    const [clientStream, telemetryStream] = response.body!.tee();

    (async () => {
      let promptTokens: number | null = null;
      let completionTokens: number | null = null;
      try {
        const reader = telemetryStream.getReader();
        const decoder = new TextDecoder();
        let buf = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          let nl: number;
          while ((nl = buf.indexOf("\n")) !== -1) {
            const line = buf.slice(0, nl).trim();
            buf = buf.slice(nl + 1);
            if (!line.startsWith("data: ")) continue;
            const js = line.slice(6).trim();
            if (js === "[DONE]") continue;
            try {
              const p = JSON.parse(js);
              if (p.usage) {
                promptTokens = p.usage.prompt_tokens ?? promptTokens;
                completionTokens = p.usage.completion_tokens ?? completionTokens;
              }
            } catch { /* ignore parse errors */ }
          }
        }
      } catch (e) {
        console.warn("[resmita-chat] telemetry tee failed", e);
      }

      // Cost estimate (rough — gemini-flash ~$0.075/M in, $0.30/M out)
      let cost: number | null = null;
      if (promptTokens != null && completionTokens != null) {
        const isPro = cfg.model.includes("pro");
        const inRate = isPro ? 1.25 / 1_000_000 : 0.075 / 1_000_000;
        const outRate = isPro ? 5.0 / 1_000_000 : 0.30 / 1_000_000;
        cost = promptTokens * inRate + completionTokens * outRate;
      }

      console.log(JSON.stringify({
        tag: "resmita-chat", phase: "end", sessionId, route,
        model: cfg.model, promptTokens, completionTokens,
        latency_ms: Date.now() - started, cost_usd: cost,
      }));

      if (userId) {
        await logEvent(sb, {
          user_id: userId, session_id: sessionId, event_type: "send_message",
          route, screen_title: screenTitle, screen_purpose: screenPurpose,
          model: cfg.model,
          prompt_tokens: promptTokens, completion_tokens: completionTokens,
          latency_ms: Date.now() - started, cost_usd: cost,
        });
      }
    })();

    return new Response(clientStream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("resmita-chat error:", e);
    if (userId) {
      await logEvent(sb, {
        user_id: userId, session_id: sessionId, event_type: "error",
        route, screen_title: screenTitle, screen_purpose: screenPurpose,
        latency_ms: Date.now() - started,
        error_message: e instanceof Error ? e.message : "unknown",
      });
    }
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
