-- 1) Add country_code to mindfulness scripts and enforce uniqueness per country
ALTER TABLE public.mindfulness_scripts_v2
  ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'default';

-- Drop old unique if any and recreate
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'mindfulness_scripts_v2_exercise_minutes_version_key'
  ) THEN
    ALTER TABLE public.mindfulness_scripts_v2 DROP CONSTRAINT mindfulness_scripts_v2_exercise_minutes_version_key;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS mindfulness_scripts_v2_unique_bucket
  ON public.mindfulness_scripts_v2 (exercise_id, minutes, version, country_code);

-- 2) Voice library custom (admin-managed extra voice_ids)
CREATE TABLE IF NOT EXISTS public.voice_library_custom (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  voice_id TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female','male')),
  accent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID
);

GRANT SELECT ON public.voice_library_custom TO authenticated;
GRANT ALL ON public.voice_library_custom TO service_role;

ALTER TABLE public.voice_library_custom ENABLE ROW LEVEL SECURITY;

CREATE POLICY "voice_library_custom_admin_all"
  ON public.voice_library_custom FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "voice_library_custom_authenticated_read"
  ON public.voice_library_custom FOR SELECT
  USING (auth.uid() IS NOT NULL);