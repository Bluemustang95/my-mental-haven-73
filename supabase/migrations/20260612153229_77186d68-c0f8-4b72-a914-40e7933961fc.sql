
ALTER TABLE public.ba_content
  ADD COLUMN IF NOT EXISTS vlq_domains jsonb NOT NULL DEFAULT '[]'::jsonb;

UPDATE public.ba_content
SET vlq_domains = '[
  {"key":"familia","emoji":"👨‍👩‍👧","title":"Familia","subtitle":"Vínculos con familia de origen (padres, hermanos, hijos no propios)"},
  {"key":"pareja","emoji":"💞","title":"Pareja","subtitle":"Relaciones de pareja, matrimonio, vida íntima"},
  {"key":"crianza","emoji":"🧸","title":"Crianza","subtitle":"Ser madre / padre, cuidar y educar a tus hijos"},
  {"key":"amistades","emoji":"🤝","title":"Amistades","subtitle":"Amigos cercanos y vida social"},
  {"key":"trabajo","emoji":"💼","title":"Trabajo","subtitle":"Tu carrera profesional, ocupación o emprendimiento"},
  {"key":"educacion","emoji":"📚","title":"Educación","subtitle":"Aprender, estudiar, formarte"},
  {"key":"recreacion","emoji":"🎨","title":"Recreación","subtitle":"Hobbies, ocio, deporte, tiempo libre"},
  {"key":"espiritualidad","emoji":"🕊️","title":"Espiritualidad","subtitle":"Sentido de vida, religión, conexión trascendente"},
  {"key":"ciudadania","emoji":"🌎","title":"Ciudadanía","subtitle":"Compromiso con tu comunidad, barrio, causas"},
  {"key":"salud","emoji":"🧘","title":"Salud física","subtitle":"Cuidar tu cuerpo: alimentación, descanso, ejercicio"}
]'::jsonb
WHERE vlq_domains = '[]'::jsonb OR jsonb_array_length(vlq_domains) = 0;

ALTER TABLE public.ba_programs
  ADD COLUMN IF NOT EXISTS vlq_importance jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vlq_consistency jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS vlq_top_domains jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS vlq_completed_at timestamptz;

CREATE TABLE IF NOT EXISTS public.vlq_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid REFERENCES public.ba_programs(id) ON DELETE CASCADE,
  domain_key text NOT NULL,
  importance int NOT NULL,
  consistency int NOT NULL,
  gap int GENERATED ALWAYS AS (importance - consistency) STORED,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.vlq_responses TO authenticated;
GRANT ALL ON public.vlq_responses TO service_role;

ALTER TABLE public.vlq_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their VLQ responses"
  ON public.vlq_responses
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS vlq_responses_user_idx ON public.vlq_responses(user_id, created_at DESC);
