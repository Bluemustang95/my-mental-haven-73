CREATE TABLE public.dbt_emotion_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  emotion TEXT NOT NULL,
  event_description TEXT,
  interpretations TEXT,
  threat TEXT,
  catastrophe_coping TEXT,
  fits_facts BOOLEAN,
  is_effective BOOLEAN,
  path TEXT CHECK (path IN ('problem','opposite')),
  problem_payload JSONB,
  opposite_payload JSONB,
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.dbt_emotion_sessions TO authenticated;
GRANT ALL ON public.dbt_emotion_sessions TO service_role;

ALTER TABLE public.dbt_emotion_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own dbt sessions" ON public.dbt_emotion_sessions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins view all dbt sessions" ON public.dbt_emotion_sessions
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_dbt_emotion_sessions_updated_at
  BEFORE UPDATE ON public.dbt_emotion_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_dbt_emotion_sessions_user_created ON public.dbt_emotion_sessions(user_id, created_at DESC);