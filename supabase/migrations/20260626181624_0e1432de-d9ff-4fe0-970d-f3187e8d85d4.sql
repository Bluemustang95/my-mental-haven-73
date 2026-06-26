
ALTER TABLE public.thought_records
  ADD COLUMN IF NOT EXISTS sub_emotions text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS behavior text,
  ADD COLUMN IF NOT EXISTS body_sensations text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS distortions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS resolution_mode text,
  ADD COLUMN IF NOT EXISTS resolution_plan text;
