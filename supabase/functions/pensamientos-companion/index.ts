import { streamLovableChat } from "../_shared/ai-gateway.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type ChatMessage = { role: "user" | "assistant"; content: string };

type DraftCtx = {
  step?: number;
  triggerEvent?: string;
  automaticThought?: string;
  emotion?: string;
  subEmotions?: string[];
  intensityInitial?: number;
  intensityFinal?: number;
  behavior?: string;
  bodySensations?: string[];
  evidenceFor?: string[];
  evidenceAgainst?: string[];
  distortions?: { label: string }[];
  alternativeThought?: string;
  resolutionPlan?: string;
};

const STEP_LABELS = [
  "Situación",
  "Pensamiento automático",
  "Emociones",
  "Conducta",
  "Sensaciones corporales",
  "Balanza de evidencias",
  "Distorsiones cognitivas",
  "Resolución",
];

const DEFAULT_PROMPT = `Sos "Reeni", acompañante cognitivo virtual de RESMA en TCC (Beck / Leahy).
Hablás en español rioplatense con voseo, tono empático, breve y socrático. NO reemplazás terapia.
Tenés acceso al REGISTRO en curso del usuario (lo verás abajo). Léelo antes de responder:
- Si te pide "leé lo que escribí" o "resumime", devolvé un resumen empático de 3 líneas.
- Si te pide "ayudame a completar" o "sugerí": generá 2–3 opciones breves para el paso actual, adaptadas al contenido ya escrito.
- Si detectás distorsiones cognitivas, nombralas explicando por qué encajan.
- Si detectás riesgo (autolesión, suicidio, abuso), sugerí líneas de ayuda.
Máx 4 oraciones salvo que pidan sugerencias en lista.`;

function describeDraft(ctx: DraftCtx): string {
  const l: string[] = [];
  const stepLabel = ctx.step ? `${ctx.step}/8 · ${STEP_LABELS[(ctx.step ?? 1) - 1]}` : "—";
  l.push(`\n===== REGISTRO EN CURSO (paso ${stepLabel}) =====`);
  l.push(`• Situación: ${ctx.triggerEvent || "(vacío)"}`);
  l.push(`• Pensamiento automático: ${ctx.automaticThought || "(vacío)"}`);
  l.push(
    `• Emoción: ${ctx.emotion || "(vacío)"}${ctx.intensityInitial != null ? ` · SUDS inicial ${ctx.intensityInitial}` : ""}${ctx.subEmotions?.length ? ` · subemociones: ${ctx.subEmotions.join(", ")}` : ""}`
  );
  l.push(`• Conducta: ${ctx.behavior || "(vacío)"}`);
  l.push(`• Sensaciones: ${ctx.bodySensations?.length ? ctx.bodySensations.join(", ") : "(vacío)"}`);
  l.push(`• Evidencias a favor: ${ctx.evidenceFor?.length ? ctx.evidenceFor.join(" | ") : "(vacío)"}`);
  l.push(`• Evidencias en contra: ${ctx.evidenceAgainst?.length ? ctx.evidenceAgainst.join(" | ") : "(vacío)"}`);
  l.push(`• Distorsiones: ${ctx.distortions?.length ? ctx.distortions.map((d) => d.label).join(", ") : "(vacío)"}`);
  l.push(`• Pensamiento alternativo: ${ctx.alternativeThought || "(vacío)"}`);
  l.push(`• Plan de abordaje: ${ctx.resolutionPlan || "(vacío)"}`);
  if (ctx.intensityFinal != null) l.push(`• SUDS final: ${ctx.intensityFinal}`);
  return l.join("\n");
}

async function loadAiConfig(): Promise<{ prompt: string; model: string }> {
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return { prompt: DEFAULT_PROMPT, model: "google/gemini-3-flash-preview" };
    const sb = createClient(url, key);
    const { data } = await sb
      .from("admin_settings")
      .select("value")
      .eq("key", "pensamientos_ai")
      .maybeSingle();
    const v: any = data?.value ?? {};
    return {
      prompt: (v.prompt as string) || DEFAULT_PROMPT,
      model: (v.model as string) || "google/gemini-3-flash-preview",
    };
  } catch {
    return { prompt: DEFAULT_PROMPT, model: "google/gemini-3-flash-preview" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, draft } = (await req.json()) as {
      messages: ChatMessage[];
      draft?: DraftCtx;
    };

    if (!Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "messages required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cfg = await loadAiConfig();
    const system = `${cfg.prompt}\n${describeDraft(draft ?? {})}`;

    const upstream = await streamLovableChat({
      model: cfg.model,
      system,
      messages: messages.slice(-12),
    });

    if (upstream.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas consultas. Probá en un momento." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (upstream.status === 402) {
      return new Response(JSON.stringify({ error: "Sin créditos de IA disponibles." }), {
        status: 402,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!upstream.ok || !upstream.body) {
      const txt = await upstream.text();
      return new Response(JSON.stringify({ error: `AI error: ${txt}` }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(upstream.body, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
