import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

function tryParseJSON(raw: string): unknown {
  try { return JSON.parse(raw); } catch {}
  const m = raw.match(/\{[\s\S]*\}/);
  if (m) { try { return JSON.parse(m[0]); } catch {} }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { thought, trigger, evidenceFor, brainstorm, distortion } = await req.json();

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Sos RESMA, psicólogo CBT argentino (voseo rioplatense), cálido y concreto.
El paciente confirmó que el problema es real y necesita un plan de acción.
Devolvé EXACTAMENTE un JSON con esta forma:
{"actions":[{"what":"...","when":"...","why":"..."}, ... 3 items ...]}
Reglas:
- "what": acción concreta, observable, factible esta semana. Empieza con verbo en infinitivo. Máx 18 palabras.
- "when": momento específico ("mañana 18hs", "este sábado a la mañana", "lunes después del trabajo").
- "why": una línea de por qué ayuda con el problema (máx 18 palabras).
- Tomá en cuenta la lluvia de ideas del paciente y conectá las acciones con su contenido cuando sea posible.
- Sin moralejas ni disclaimers. Sin texto fuera del JSON.`;

    const userPrompt = `Evento: ${trigger || "(no especificado)"}
Pensamiento: ${thought || "(no especificado)"}
Distorsión cognitiva: ${distortion || "(ninguna)"}
Evidencias a favor (problema real):
${(evidenceFor ?? []).map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") || "(ninguna)"}

Lluvia de ideas previa:
${brainstorm || "(vacío)"}`;

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

    if (res.status === 429)
      return new Response(JSON.stringify({ error: "Demasiadas consultas. Probá en unos minutos." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (res.status === 402)
      return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!res.ok) {
      const t = await res.text();
      console.log("suggest-behavior-plan upstream", res.status, t.slice(0, 300));
      return new Response(JSON.stringify({ error: "Fallo en IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await res.json();
    const raw = (data?.choices?.[0]?.message?.content ?? "").toString();
    console.log("suggest-behavior-plan raw", raw.slice(0, 250));
    const parsed = (tryParseJSON(raw) ?? {}) as Record<string, unknown>;
    const rawActions = Array.isArray(parsed.actions) ? parsed.actions : [];
    const actions = rawActions
      .filter((a: unknown): a is Record<string, unknown> => !!a && typeof a === "object")
      .map((a) => ({
        what: String(a.what ?? "").slice(0, 200),
        when: String(a.when ?? "").slice(0, 80),
        why: a.why ? String(a.why).slice(0, 200) : undefined,
      }))
      .filter((a) => a.what && a.when)
      .slice(0, 3);

    return new Response(JSON.stringify({ actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
