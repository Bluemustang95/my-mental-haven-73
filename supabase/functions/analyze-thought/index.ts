import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function tryParseJSON(raw: string): unknown {
  try { return JSON.parse(raw); } catch { /* try block */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

async function callGateway(key: string, system: string, user: string) {
  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      temperature: 0.5,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  return res;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = await req.json();
    const mode: "identify" | "refine" | "alternatives" = body.mode ?? "refine";

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userPrompt = "";

    if (mode === "identify") {
      const { trigger, emotion, intensity } = body;
      systemPrompt = `Sos RESMA, psicólogo cognitivo-conductual argentino. Voseo rioplatense, cálido y concreto.
El paciente sintió una emoción pero no logra identificar el pensamiento automático que la disparó.
Devolvé SOLO un JSON con esta forma exacta:
{"tips":["...","...","..."],"candidates":["...","..."]}
- "tips": 3 preguntas/pistas breves (máx 15 palabras) para ayudarlo a identificar el pensamiento (ej: "¿Qué imagen apareció en tu mente?", "¿Qué te dijiste a vos mismo?").
- "candidates": 2 hipótesis verosímiles del pensamiento automático, en primera persona, dado el evento y la emoción. Cortas (máx 20 palabras), entre comillas internas no.
Sin markdown ni texto fuera del JSON.`;
      userPrompt = `Emoción: ${emotion || "(no especificada)"} (intensidad ${intensity ?? "-"}%)
Evento objetivo: ${trigger || "(no especificado)"}`;
    } else if (mode === "alternatives") {
      const { thought, trigger, emotion, distortion, evidenceAgainst } = body;
      systemPrompt = `Sos RESMA, psicólogo CBT argentino (voseo rioplatense).
Generá 3 pensamientos alternativos racionales y balanceados que reemplacen el pensamiento automático.
Reglas:
- Cada alternativa es en primera persona, observable, sin negar la dificultad pero sin catastrofizar.
- Tomá en cuenta las evidencias EN CONTRA del pensamiento original.
- Si hay una distorsión cognitiva, contrarrestala con la lógica adecuada.
- Máx 30 palabras cada una. Naturales, no robóticas.
Devolvé SOLO un JSON: {"alternatives":["...","...","..."]}`;
      userPrompt = `Evento: ${trigger || "(no especificado)"}
Emoción: ${emotion || "-"}
Pensamiento automático: "${thought}"
Distorsión cognitiva: ${distortion || "(no detectada)"}
Evidencias en contra:
${Array.isArray(evidenceAgainst) && evidenceAgainst.length ? evidenceAgainst.map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") : "(ninguna)"}`;
    } else {
      // refine
      const { thought, trigger } = body;
      if (!thought || typeof thought !== "string") {
        return new Response(JSON.stringify({ error: "Pensamiento inválido" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      systemPrompt = `Sos RESMA, psicólogo cognitivo-conductual argentino (voseo rioplatense), cálido y sin diagnóstico.
A partir del pensamiento automático del paciente y del evento OBJETIVO, devolvé SOLO un JSON:
{"factual":"...","questions":["...","..."]}
- "factual": reescritura del pensamiento en versión observable basada en el evento real, en primera persona, sin juicios ni predicciones (máx 35 palabras).
- "questions": 2 preguntas socráticas breves (máx 18 palabras cada una) específicas a este evento y pensamiento, no genéricas.
Sin markdown ni texto fuera del JSON.`;
      userPrompt = `Evento objetivo: ${trigger || "(no especificado)"}
Pensamiento automático: "${thought}"`;
    }

    const res = await callGateway(key, systemPrompt, userPrompt);

    if (res.status === 429) {
      return new Response(JSON.stringify({ error: "Demasiadas consultas. Probá en unos minutos." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (res.status === 402) {
      return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      console.log("analyze-thought upstream error", res.status, t.slice(0, 300));
      return new Response(JSON.stringify({ error: "Fallo en IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = (data?.choices?.[0]?.message?.content ?? "").toString();
    console.log(`analyze-thought ${mode} raw`, raw.slice(0, 250));
    const parsed = (tryParseJSON(raw) ?? {}) as Record<string, unknown>;

    if (mode === "identify") {
      const tips = Array.isArray(parsed.tips) ? (parsed.tips as unknown[]).filter((x) => typeof x === "string").slice(0, 3) : [];
      const candidates = Array.isArray(parsed.candidates) ? (parsed.candidates as unknown[]).filter((x) => typeof x === "string").slice(0, 3) : [];
      return new Response(JSON.stringify({ tips, candidates }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (mode === "alternatives") {
      const alternatives = Array.isArray(parsed.alternatives) ? (parsed.alternatives as unknown[]).filter((x) => typeof x === "string").slice(0, 3) : [];
      return new Response(JSON.stringify({ alternatives }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const factual = typeof parsed.factual === "string" ? parsed.factual : "";
    const questions = Array.isArray(parsed.questions) ? (parsed.questions as unknown[]).filter((x) => typeof x === "string").slice(0, 3) : [];
    return new Response(JSON.stringify({ factual, questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
