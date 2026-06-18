import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function parseSuggestions(raw: string): string[] {
  const tryParse = (s: string): string[] => {
    const parsed = JSON.parse(s);
    if (Array.isArray(parsed?.suggestions)) {
      return parsed.suggestions
        .filter((x: unknown) => typeof x === "string")
        .map((s: string) => s.trim())
        .filter(Boolean)
        .slice(0, 3);
    }
    return [];
  };
  try { return tryParse(raw); } catch { /* ignore */ }
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) {
    try { return tryParse(match[0]); } catch { /* ignore */ }
  }
  // fallback: split by lines starting with "- " or numbered
  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-\*\d\.\)]+/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, 3);
  return lines;
}

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
Sugerí 3 posibles evidencias FÁCTICAS y OBSERVABLES ${lado} del pensamiento automático.
Reglas:
- Cada evidencia es un hecho concreto, no una opinión ni una emoción.
- Empezá cada una con un dato observable o un verbo en pasado.
- Máx 20 palabras por evidencia.
- No repitas las que ya cargó el paciente.
Devolvé SOLO un JSON con la forma:
{"suggestions":["...","...","..."]}`;

    const userPrompt = `Disparador: ${trigger || "(no especificado)"}
Pensamiento automático: "${thought}"
Lado solicitado: ${lado}
Ya cargó: ${Array.isArray(existing) && existing.length ? existing.map((e: string) => `- ${e}`).join("\n") : "(ninguna)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Lovable-API-Key": key },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        temperature: 0.5,
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
      console.log("suggest-evidence upstream error", res.status, t.slice(0, 300));
      return new Response(JSON.stringify({ error: "Fallo en IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = (data?.choices?.[0]?.message?.content ?? "").toString();
    console.log("suggest-evidence raw", raw.slice(0, 200));
    const suggestions = parseSuggestions(raw);

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
