import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

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

    const systemPrompt = `Sos RESMA, un psicólogo clínico cognitivo-conductual (CBT) argentino.
Hablás en voseo rioplatense, cálido, sin diagnóstico. Tu rol acá es entrenar al paciente a distinguir HECHOS (observables, verificables) de PENSAMIENTOS (interpretaciones).
Para cada pensamiento que recibís devolvés un texto breve (máx 120 palabras) con exactamente este formato en dos párrafos cortos:
1) "Por qué es una interpretación:" — explicá brevemente qué partes del enunciado son juicio, predicción o lectura de mente.
2) "Cómo redactarlo como hecho fáctico:" — ofrecé una reescritura observable y verificable, en primera persona.
Nada de listas con viñetas, nada de markdown, nada de disclaimers genéricos.`;

    const userPrompt = `Disparador (opcional): ${trigger || "(no especificado)"}\nPensamiento automático: "${thought}"`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
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
      return new Response(JSON.stringify({ error: "Créditos de IA agotados. Avisale al admin." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (!res.ok) {
      const t = await res.text();
      return new Response(JSON.stringify({ error: "Fallo en IA", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const analysis = data?.choices?.[0]?.message?.content ?? "";
    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
