import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { side, thought, trigger, existing } = await req.json();
    if (!thought || typeof thought !== "string" || (side !== "for" && side !== "against")) {
      return new Response(JSON.stringify({ error: "Parámetros inválidos" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const lado = side === "for" ? "A FAVOR" : "EN CONTRA";

    const systemPrompt = `Sos RESMA, psicólogo CBT argentino que habla en voseo rioplatense.
Tu tarea: sugerir 3 posibles evidencias FÁCTICAS y OBSERVABLES ${lado} del pensamiento automático del paciente.
Reglas:
- Cada evidencia debe ser un hecho concreto, no una opinión ni una emoción.
- Empieza cada una con un verbo en pasado o un dato observable (ej: "En el último mes…", "Mi jefa dijo…", "Aprobé 7 de 10 entregas").
- Máx 20 palabras por evidencia.
- No repitas las que ya cargó el paciente.
- Devolvé SOLO un JSON con la forma {"suggestions": ["...", "...", "..."]}.`;

    const userPrompt = `Disparador: ${trigger || "(no especificado)"}
Pensamiento automático: "${thought}"
Lado solicitado: ${lado}
Ya cargó: ${Array.isArray(existing) && existing.length ? existing.map((e: string) => `- ${e}`).join("\n") : "(ninguna)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
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
      return new Response(JSON.stringify({ error: "Fallo en IA", detail: t }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.suggestions)) {
        suggestions = parsed.suggestions
          .filter((s: unknown) => typeof s === "string")
          .map((s: string) => s.trim())
          .filter(Boolean)
          .slice(0, 3);
      }
    } catch {
      // ignore
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
