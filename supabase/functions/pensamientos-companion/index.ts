import { streamLovableChat } from "../_shared/ai-gateway.ts";

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
  behavior?: string;
  bodySensations?: string[];
  distortions?: { label: string }[];
};

function buildSystem(ctx: DraftCtx): string {
  const parts: string[] = [
    "Sos un acompañante cognitivo virtual de RESMA, una app argentina de bienestar mental.",
    "Tu rol es guiar al usuario en un registro de pensamientos basado en Terapia Cognitivo-Conductual (TCC).",
    "Hablás en español rioplatense con voseo argentino, tono empático, cálido y respetuoso.",
    "Sos un guía cognitivo, NO sos terapeuta. Si detectás riesgo (autolesión, suicidio, abuso), sugerí contactar profesional o líneas de ayuda.",
    "Respuestas breves (máx 4 oraciones), preguntas socráticas para ayudar a explorar, sin diagnosticar.",
    "Aclaración obligatoria al inicio de la conversación: esto no reemplaza terapia profesional.",
  ];

  if (ctx.step) parts.push(`\nPaso actual del registro: ${ctx.step} de 8.`);
  if (ctx.triggerEvent) parts.push(`Situación: "${ctx.triggerEvent}"`);
  if (ctx.automaticThought) parts.push(`Pensamiento automático: "${ctx.automaticThought}"`);
  if (ctx.emotion) parts.push(`Emoción: ${ctx.emotion}${ctx.subEmotions?.length ? ` (${ctx.subEmotions.join(", ")})` : ""}`);
  if (ctx.behavior) parts.push(`Conducta: "${ctx.behavior}"`);
  if (ctx.distortions?.length) parts.push(`Distorsiones detectadas: ${ctx.distortions.map((d) => d.label).join(", ")}`);

  return parts.join("\n");
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

    const upstream = await streamLovableChat({
      system: buildSystem(draft ?? {}),
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

    // Stream SSE through to the client
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
