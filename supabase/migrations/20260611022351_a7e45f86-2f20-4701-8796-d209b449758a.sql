ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS sub_mode text,
  ADD COLUMN IF NOT EXISTS music_track text,
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS pattern text;