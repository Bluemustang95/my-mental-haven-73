
ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS morning_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS night_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS habits_relapse_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tests_due_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS reengagement_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS resmita_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS therapist_enabled boolean NOT NULL DEFAULT true;
