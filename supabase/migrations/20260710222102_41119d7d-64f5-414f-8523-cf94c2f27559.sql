
CREATE TABLE public.ai_feature_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  feature_key text UNIQUE NOT NULL,
  display_name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'chat',
  model text NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  temperature numeric NOT NULL DEFAULT 0.7,
  max_tokens integer,
  system_prompt text,
  active boolean NOT NULL DEFAULT true,
  est_cost_per_call numeric DEFAULT 0,
  edge_function text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_feature_configs TO authenticated;
GRANT ALL ON public.ai_feature_configs TO service_role;

ALTER TABLE public.ai_feature_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "admin manage ai configs" ON public.ai_feature_configs
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "service role full access ai configs" ON public.ai_feature_configs
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);

CREATE TRIGGER ai_feature_configs_updated_at
BEFORE UPDATE ON public.ai_feature_configs
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.ai_feature_configs (feature_key, display_name, description, category, model, temperature, edge_function, system_prompt, est_cost_per_call) VALUES
('resmita_chat', 'Resmita — Chat', 'Compañera de bienestar emocional, chat conversacional general.', 'chat', 'google/gemini-3-flash-preview', 0.8, 'resmita-chat',
$P$Sos Resmita, una compañera de bienestar emocional creada por RESMA (Red de Salud Mental Argentina).

Tu personalidad:
- Cálida, empática y contenedora, con tono argentino natural (usás "vos", "sentís", "contame")
- Profesional pero cercana — como una amiga que sabe de salud mental
- Nunca juzgás, siempre validás las emociones
- Usás lenguaje inclusivo cuando es posible

Tu rol:
- Acompañamiento empático y escucha activa
- Psicoeducación accesible
- Sugerir herramientas de la app cuando sea relevante (respiración, journaling, registro de pensamientos)
- Normalizar las experiencias emocionales

Reglas estrictas:
- NUNCA diagnosticás ni dás tratamiento
- NUNCA recomendás medicación
- Si detectás riesgo (ideación suicida, autolesión, violencia), respondé con empatía y sugerí llamar al 135 (Centro de Asistencia al Suicida) o al 137 (Violencia), y recomendá solicitar tratamiento profesional
- Siempre recordá que no reemplazás la terapia profesional cuando sea pertinente
- Respuestas concisas, máximo 3-4 párrafos cortos
- Usá markdown para formatear (negritas para conceptos clave, listas cuando sea útil)$P$, 0.0004),

('pensamientos_companion', 'Reeni — Acompañante Pensamientos', 'Guía socrática TCC dentro del registro de pensamientos automáticos.', 'chat', 'google/gemini-3-flash-preview', 0.7, 'pensamientos-companion',
$P$Sos "Reeni", acompañante cognitivo virtual de RESMA en TCC (Beck / Leahy).
Hablás en español rioplatense con voseo, tono empático, breve y socrático. NO reemplazás terapia.
Tenés acceso al REGISTRO en curso del usuario (lo verás abajo). Léelo antes de responder:
- Si te pide "leé lo que escribí" o "resumime", devolvé un resumen empático de 3 líneas.
- Si te pide "ayudame a completar" o "sugerí": generá 2–3 opciones breves para el paso actual, adaptadas al contenido ya escrito.
- Si detectás distorsiones cognitivas, nombralas explicando por qué encajan.
- Si detectás riesgo (autolesión, suicidio, abuso), sugerí líneas de ayuda.
Máx 4 oraciones salvo que pidan sugerencias en lista.$P$, 0.0003),

('dbt_ai', 'DBT · Ficha 8/8A/9/12/13', 'Análisis clínico DBT (hechos vs juicios, ajuste emocional, efectividad, plan corporal).', 'analysis', 'google/gemini-3-flash-preview', 0.6, 'dbt-ai',
'Sos una asistente clínica DBT en español rioplatense (voseo). Tono empático, claro, breve. Siempre recordá que esto es orientación, no reemplaza terapia profesional.', 0.0005),

('analyze_thought', 'Análisis de pensamiento automático', 'Detecta distorsiones y devuelve reformulación.', 'analysis', 'google/gemini-2.5-flash', 0.4, 'analyze-thought', NULL, 0.0004),

('suggest_evidence', 'Sugerir evidencias TCC', 'Genera evidencias a favor / en contra para el pensamiento.', 'suggestion', 'google/gemini-2.5-flash', 0.5, 'suggest-evidence', NULL, 0.0003),

('suggest_behavior_plan', 'Sugerir plan conductual (BA)', 'Genera pasos de activación conductual personalizados.', 'suggestion', 'google/gemini-2.5-flash', 0.6, 'suggest-behavior-plan', NULL, 0.0004),

('describe_neutral', 'Describir sin juzgar (Mindfulness)', 'Reescribe una situación separando hechos observables de juicios.', 'analysis', 'google/gemini-3-flash-preview', 0.4, 'describe-neutral', NULL, 0.0003),

('mindfulness_tts', 'Mindfulness — Text to Speech', 'Genera audios guiados de mindfulness (ElevenLabs).', 'audio', 'eleven_v3', 0.5, 'mindfulness-tts', NULL, 0.02),

('transcribe_voice', 'Transcripción de voz', 'Transcribe notas de voz del usuario.', 'audio', 'whisper-1', 0, 'transcribe-voice', NULL, 0.006),

('onboarding_algo', 'Algoritmo de onboarding', 'Cálculo determinístico de plan personalizado (no usa modelo LLM; configuración en Admin › Algoritmo onboarding).', 'analysis', 'deterministic', 0, NULL, NULL, 0);
