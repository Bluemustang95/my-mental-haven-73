
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS plan_category text,
  ADD COLUMN IF NOT EXISTS top3_tools jsonb,
  ADD COLUMN IF NOT EXISTS algo_version integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS home_seeded boolean NOT NULL DEFAULT false;
