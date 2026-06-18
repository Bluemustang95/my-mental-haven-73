import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function parseJsonLoose(raw: string): { factual: string; questions: string[] } {
  let factual = "";
  let questions: string[] = [];
  try {
    const parsed = JSON.parse(raw);
    factual = typeof parsed.factual === "string" ? parsed.factual : "";
    questions = Array.isArray(parsed.questions)
      ? parsed.questions.filter((q: unknown) => typeof q === "string").slice(0, 3)
      : [];
    return { factual, questions };
  } catch {
    // try to extract a {...} block
    const match = raw.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        const parsed = JSON.parse(match[0]);
        factual = typeof parsed.factual === "string" ? parsed.factual : "";
        questions = Array.isArray(parsed.questions)
          ? parsed.questions.filter((q: unknown) => typeof q === "string").slice(0, 3)
          : [];
        return { factual, questions };
      } catch { /* fall through */ }
    }
    return { factual: raw.trim(), questions: [] };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { thought, trigger } = await req.json();
    if (!thought || typeof thought !== "string") {
      return new Response(JSON.stringify({ error: "Pensamiento inválido" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Sos RESMA, psicólogo cognitivo-conductual argentino. Hablás en voseo rioplatense, cálido, sin diagnóstico.
A partir del pensamiento automático del paciente devolvé SOLO un objeto JSON con esta forma exacta:
{"factual":"...","questions":["...","..."]}
- "factual": reescritura del pensamiento en versión observable, en primera persona, sin juicios ni predicciones (máx 40 palabras).
- "questions": 2 preguntas socráticas breves (máx 18 palabras cada una) que ayuden a desafiar el pensamiento.
No incluyas markdown, ni texto fuera del JSON.`;

    const userPrompt = `Disparador (opcional): ${trigger || "(no especificado)"}\nPensamiento automático: "${thought}"`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.4,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

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
    console.log("analyze-thought raw", raw.slice(0, 200));
    const { factual, questions } = parseJsonLoose(raw);

    return new Response(JSON.stringify({ factual, questions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
