CREATE TABLE IF NOT EXISTS public.values_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  life_area text NOT NULL,
  person_intention text,
  weekly_action text,
  coherence_score integer NOT NULL DEFAULT 5,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT values_reflections_life_area_check CHECK (life_area IN ('Relaciones','Crecimiento Personal / Educación','Trabajo / Vocación','Salud y Bienestar','Ocio y Recreación')),
  CONSTRAINT values_reflections_coherence_score_check CHECK (coherence_score BETWEEN 1 AND 10)
);

ALTER TABLE public.values_reflections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own values reflections" ON public.values_reflections;
CREATE POLICY "Users can view own values reflections"
ON public.values_reflections
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own values reflections" ON public.values_reflections;
CREATE POLICY "Users can insert own values reflections"
ON public.values_reflections
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own values reflections" ON public.values_reflections;
CREATE POLICY "Users can update own values reflections"
ON public.values_reflections
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own values reflections" ON public.values_reflections;
CREATE POLICY "Users can delete own values reflections"
ON public.values_reflections
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all values reflections" ON public.values_reflections;
CREATE POLICY "Admins can view all values reflections"
ON public.values_reflections
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_values_reflections_user_date
ON public.values_reflections (user_id, entry_date DESC);

CREATE TRIGGER update_values_reflections_updated_at
BEFORE UPDATE ON public.values_reflections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();