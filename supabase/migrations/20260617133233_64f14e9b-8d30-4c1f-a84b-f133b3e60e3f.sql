ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS sleep_quality text,
  ADD COLUMN IF NOT EXISTS learning_format text,
  ADD COLUMN IF NOT EXISTS priority_module text,
  ADD COLUMN IF NOT EXISTS module_scores jsonb;