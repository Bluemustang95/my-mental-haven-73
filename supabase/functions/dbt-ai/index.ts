import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { loadFeatureConfig } from "../_shared/ai-feature-config.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROMPTS: Record<string, (p: Record<string, string>) => string> = {
  "separate-facts": (p) => `Sos una asistente clínica DBT experta en la Ficha 8 de Marsha Linehan. Reescribí el siguiente texto separando HECHOS OBSERVABLES (lo que cualquier cámara registraría, en blanco y negro) de JUICIOS, SUPOSICIONES E INTERPRETACIONES. Devolvé dos secciones en español rioplatense (voseo):\n\n**Hechos observables:**\n(bullets)\n\n**Juicios e interpretaciones:**\n(bullets)\n\nTexto del usuario:\n"""${p.text || ""}"""`,
  "evaluate-fit": (p) => `Sos una asistente clínica DBT experta en la Ficha 8A de Marsha Linehan. Analizá si la emoción del usuario se AJUSTA A LOS HECHOS de la realidad. Usá voseo argentino, tono empático y profesional.\n\nEmoción: ${p.emotion}\nEvento: ${p.event}\nInterpretaciones: ${p.interpretations}\nAmenaza percibida: ${p.threat}\nPeor catástrofe: ${p.catastrophe}\n\nRespondé en máximo 3 párrafos cortos:\n1. Tu veredicto: SÍ se ajusta / NO se ajusta / Parcialmente.\n2. Argumentación clínica breve basada en los criterios de la Ficha 8A.\n3. Una sugerencia práctica de qué hacer ahora.\n\nIncluí siempre el recordatorio final: "Esto es orientación, no reemplaza tu terapia."`,
  "evaluate-effectiveness": (p) => `Sos una asistente clínica DBT (Ficha 9). Evaluá si actuar bajo el impulso emocional del usuario es EFECTIVO según los criterios DBT (acerca a objetivos a largo plazo, no daña relaciones importantes, no se perjudica a uno mismo, no empeora la situación). Voseo argentino.\n\nEmoción: ${p.emotion}\nEvento: ${p.event}\nImpulso a evaluar: ${p.threat}\n\nRespondé en máximo 3 párrafos:\n1. Veredicto: SÍ es efectivo / NO es efectivo.\n2. Por qué (relación con metas, vínculos, autoestima, consecuencias).\n3. Sugerencia DBT inmediata.\n\nCerrá con: "Esto es orientación, no reemplaza tu terapia."`,
  "suggest-solutions": (p) => `Sos una asistente clínica DBT (Ficha 12 — Resolución de Problemas). Generá 3 soluciones concretas, viables, asertivas y alineadas con DBT para la siguiente situación. Voseo argentino. Formato:\n\n**Opción 1:** ...\n**Opción 2:** ...\n**Opción 3:** ...\n\nEmoción: ${p.emotion}\nEvento: ${p.event}\nObjetivo: ${p.goal}`,
  "body-plan": (p) => `Sos una asistente clínica DBT (Ficha 13). Diseñá un PLAN DE ACCIÓN CORPORAL detallado de "acción opuesta" para la emoción indicada. Voseo argentino. Incluí: postura, expresión facial (media sonrisa, cejas), gestos (Manos Dispuestas), tono y volumen de voz, respiración, y ritmo de movimiento. 6-8 bullets concretos.\n\nEmoción: ${p.emotion}\nImpulso típico del usuario: ${p.impulses || "no especificado"}`,
  "highlight-judgments": (p) => `Sos una asistente clínica DBT (Ficha 8). Analizá el siguiente texto y devolvé EXCLUSIVAMENTE JSON válido (sin markdown, sin texto extra) con esta forma exacta:\n{"judgments":["frase 1","frase 2"],"reformulated":"texto reescrito solo con hechos observables, en voseo argentino"}\n\nLos "judgments" son fragmentos EXACTOS del texto que son juicios, suposiciones, interpretaciones o etiquetas (no hechos observables). Máximo 6. "reformulated" debe ser una reescritura breve y factual.\n\nTexto:\n"""${p.text || ""}"""`,
  "socratic": (p) => `Sos una guía clínica DBT en voseo argentino. Tu rol es hacer preguntas socráticas breves (1-2 oraciones, máximo 1 pregunta por turno) que ayuden al usuario a reflexionar sobre el paso actual de su sesión de Cambio de Respuestas Emocionales. NO des consejos largos. NO repitas lo que dijo. Escuchá y devolvé una pregunta o una reflexión muy breve que invite a profundizar.\n\nContexto del paso actual:\n${p.context || "—"}\n\nÚltimo mensaje del usuario:\n"${p.user_message || ""}"\n\nRespondé en máximo 2 oraciones, en voseo argentino, tono cálido y profesional.`,
  "bienestar-goals": (p) => `Sos una asistente clínica DBT en voseo argentino. La persona eligió estos valores prioritarios:\n${p.values || "(sin especificar)"}\n\nProponé 3 metas de bienestar REALISTAS, ASERTIVAS y ACOTADAS (a 1-2 semanas) que la persona pueda trabajar HOY. Cada meta en UNA sola línea, formato lista numerada (1. ... 2. ... 3. ...), máximo 14 palabras cada una, en voseo. No agregues encabezados ni explicaciones extra.`,
  "bienestar-activities": (p) => `Sos una asistente clínica DBT en voseo argentino. Valores prioritarios de la persona:\n${p.values || "(sin especificar)"}\n\nMeta de hoy: ${p.goal || "(sin especificar)"}\n\nProponé 5 actividades placenteras y concretas, alineadas con esos valores y esa meta, que la persona pueda agendar en su semana. Cada actividad en UNA sola línea, formato lista numerada (1. ... 2. ... 3. ... 4. ... 5. ...), máximo 10 palabras cada una, en voseo. Sin encabezados, sin explicaciones.`,
};


serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Auth check
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const task = String(body?.task || "");
    const payload = (body?.payload || {}) as Record<string, string>;

    if (!PROMPTS[task]) {
      return new Response(JSON.stringify({ error: "Tarea inválida" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY no configurada");

    const prompt = PROMPTS[task](payload);
    const cfg = await loadFeatureConfig("dbt_ai", {
      model: "google/gemini-3-flash-preview",
      temperature: 0.6,
      system_prompt: "Sos una asistente clínica DBT en español rioplatense (voseo). Tono empático, claro, breve. Siempre recordá que esto es orientación, no reemplaza terapia profesional.",
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: cfg.model,
        temperature: cfg.temperature,
        messages: [
          { role: "system", content: cfg.system_prompt ?? "" },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      const status = response.status;
      if (status === 429) {
        return new Response(JSON.stringify({ error: "Demasiadas consultas. Probá en unos minutos." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA agotados." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("dbt-ai gateway error", status, t);
      return new Response(JSON.stringify({ error: "Error del servicio de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const result = data?.choices?.[0]?.message?.content ?? "";

    return new Response(JSON.stringify({ result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("dbt-ai error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Error desconocido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
