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
  try { return tryParse(raw); } catch { /* */ }
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return tryParse(m[0]); } catch {} }
  const lines = raw
    .split(/\n+/)
    .map((l) => l.replace(/^[\s\-\*\d\.\)"]+/, "").replace(/"$/, "").trim())
    .filter((l) => l.length > 5)
    .slice(0, 3);
  return lines;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { side, thought, trigger, existing, emotion, distortion } = await req.json();
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

    const systemPrompt = `Sos RESMA, psicólogo CBT argentino (voseo rioplatense).
Tu tarea: evaluar si el PENSAMIENTO AUTOMÁTICO se sostiene dado el EVENTO OBJETIVO, y proponer 3 evidencias ${lado} CONCRETAS y específicas a este caso.
Reglas estrictas:
- Cada evidencia es un hecho observable, NO una opinión ni una emoción.
- Tiene que referirse directamente al evento y al pensamiento dados, no a generalidades.
- Empezá con un dato observable o un verbo en pasado.
- Máx 22 palabras por evidencia.
- No repitas las que ya cargó el paciente.
Devolvé SOLO un JSON: {"suggestions":["...","...","..."]}`;

    const userPrompt = `Evento objetivo: ${trigger || "(no especificado)"}
Pensamiento automático: "${thought}"
Emoción asociada: ${emotion || "-"}
Distorsión cognitiva detectada: ${distortion || "(ninguna)"}
Lado solicitado: ${lado} del pensamiento
Ya cargó:
${Array.isArray(existing) && existing.length ? existing.map((e: string) => `- ${e}`).join("\n") : "(ninguna)"}`;

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
      console.log("suggest-evidence upstream", res.status, t.slice(0, 300));
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
