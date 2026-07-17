ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS session_day_notification_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_day_notification_hour smallint NOT NULL DEFAULT 9;