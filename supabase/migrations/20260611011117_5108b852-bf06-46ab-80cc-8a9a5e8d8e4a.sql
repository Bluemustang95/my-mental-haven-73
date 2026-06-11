
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS mode text DEFAULT 'morning',
  ADD COLUMN IF NOT EXISTS sleep_score int,
  ADD COLUMN IF NOT EXISTS dawn_score text,
  ADD COLUMN IF NOT EXISTS emotions text[],
  ADD COLUMN IF NOT EXISTS dream_note text,
  ADD COLUMN IF NOT EXISTS thought_note text,
  ADD COLUMN IF NOT EXISTS day_goal text,
  ADD COLUMN IF NOT EXISTS balance_highlight text,
  ADD COLUMN IF NOT EXISTS balance_improve text;

ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS in_therapy boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS prefers_dark boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS notifications_on boolean DEFAULT true;
