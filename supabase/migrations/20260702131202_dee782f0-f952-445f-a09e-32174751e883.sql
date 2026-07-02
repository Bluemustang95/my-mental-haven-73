CREATE TABLE public.diary_inspire_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  tag text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.diary_inspire_prompts TO authenticated;
GRANT ALL ON public.diary_inspire_prompts TO service_role;

ALTER TABLE public.diary_inspire_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read prompts"
  ON public.diary_inspire_prompts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "admins manage prompts"
  ON public.diary_inspire_prompts FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_diary_inspire_prompts_updated
  BEFORE UPDATE ON public.diary_inspire_prompts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.diary_inspire_prompts (text, tag, sort_order) VALUES
  ('¿Qué parte de lo que te preocupa hoy está 100% bajo tu control y qué parte no?', 'DICOTOMÍA DE CONTROL', 1),
  ('Si eso que tanto temés ocurriera, ¿con qué herramientas internas contás para afrontarlo?', 'VISUALIZACIÓN STOIC', 2),
  ('Describí con detalle físico o sensorial algo de hoy que te haya hecho sentir a salvo.', 'GRATITUD SOMÁTICA', 3);