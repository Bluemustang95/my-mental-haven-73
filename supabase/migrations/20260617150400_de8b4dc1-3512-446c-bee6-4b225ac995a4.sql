
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS plan text NOT NULL DEFAULT 'free',
  ADD COLUMN IF NOT EXISTS plan_started_at timestamptz,
  ADD COLUMN IF NOT EXISTS linked_last_name text,
  ADD COLUMN IF NOT EXISTS linked_phone text;
