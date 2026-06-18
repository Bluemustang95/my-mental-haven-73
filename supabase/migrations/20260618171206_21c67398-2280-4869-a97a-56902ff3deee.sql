
ALTER TABLE public.thought_records
  ADD COLUMN IF NOT EXISTS emotion_other text,
  ADD COLUMN IF NOT EXISTS evidence_for_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS evidence_against_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS distortion_key text,
  ADD COLUMN IF NOT EXISTS distortion_label text,
  ADD COLUMN IF NOT EXISTS is_real_problem boolean,
  ADD COLUMN IF NOT EXISTS brainstorm text,
  ADD COLUMN IF NOT EXISTS action_plan jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trainer_score int,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;
