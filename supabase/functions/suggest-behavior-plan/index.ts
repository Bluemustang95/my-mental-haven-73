import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { thought, trigger, evidenceFor, brainstorm } = await req.json();

    const key = Deno.env.get("LOVABLE_API_KEY");
    if (!key) {
      return new Response(JSON.stringify({ error: "AI no configurada" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = `Sos RESMA, un psicólogo CBT argentino. Voseo rioplatense, tono cálido y concreto.
El paciente confirmó que el problema es real (Form 3.12 — Modificación de Conducta).
Devolvés EXACTAMENTE un JSON con esta forma: {"suggestions": ["acción 1", "acción 2", "acción 3"]}
Cada acción debe ser: una conducta puntual, observable, medible y realizable esta semana. Empieza con un verbo en infinitivo y especifica con qué frecuencia o cuándo. Máx 25 palabras por acción. Sin moralejas ni disclaimers.`;

    const userPrompt = `Disparador: ${trigger || "(no especificado)"}
Pensamiento: ${thought || "(no especificado)"}
Evidencias a favor (problema real):
${(evidenceFor ?? []).map((e: string, i: number) => `${i + 1}. ${e}`).join("\n") || "(ninguna)"}

Lluvia de ideas previa del paciente:
${brainstorm || "(vacío)"}`;

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": key,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        response_format: { type: "json_object" },
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
      return new Response(JSON.stringify({ error: "Créditos de IA agotados. Avisale al admin." }), {
        status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    if (!res.ok)
      return new Response(JSON.stringify({ error: "Fallo en IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    const data = await res.json();
    const raw = data?.choices?.[0]?.message?.content ?? "{}";
    let suggestions: string[] = [];
    try {
      const parsed = JSON.parse(raw);
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [];
    } catch {
      suggestions = [];
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
