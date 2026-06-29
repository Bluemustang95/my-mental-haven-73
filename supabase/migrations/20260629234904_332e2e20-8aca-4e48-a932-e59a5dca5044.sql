
CREATE TABLE public.therapy_satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_treatment BOOLEAN,
  contacted_in_24h BOOLEAN,
  sessions_count TEXT,
  bond_rating SMALLINT,
  modality_match TEXT,
  nps_score SMALLINT,
  not_started_reasons TEXT[],
  other_reason TEXT,
  final_nps SMALLINT,
  comment TEXT,
  triggered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.therapy_satisfaction_surveys TO authenticated;
GRANT ALL ON public.therapy_satisfaction_surveys TO service_role;

ALTER TABLE public.therapy_satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own surveys"
  ON public.therapy_satisfaction_surveys FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins read all surveys"
  ON public.therapy_satisfaction_surveys FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_satisfaction_updated_at
  BEFORE UPDATE ON public.therapy_satisfaction_surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS bridge_assigned_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS satisfaction_survey_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS satisfaction_survey_dismissed_at TIMESTAMPTZ;
