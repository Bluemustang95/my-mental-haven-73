import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const cfg = await loadFeatureConfig("resmita_chat", {
      model: "google/gemini-3-flash-preview",
      temperature: 0.8,
      system_prompt: FALLBACK_PROMPT,
    });

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
          ...(context?.screenTitle
            ? [{
                role: "system",
                content: `Contexto de pantalla: el usuario está actualmente en "${context.screenTitle}". ${context.screenPurpose ?? ""} Priorizá respuestas relevantes a este contexto y sugerí acciones concretas dentro de esa pantalla cuando aplique.`,
              }]
            : []),
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas consultas. Intentá de nuevo en unos minutos." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos agotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("resmita-chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
