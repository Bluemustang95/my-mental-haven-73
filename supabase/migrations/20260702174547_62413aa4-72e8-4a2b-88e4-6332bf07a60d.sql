
-- 1) mindfulness_scripts_v2: one row per (exercise, minutes, version)
CREATE TABLE public.mindfulness_scripts_v2 (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exercise_id TEXT NOT NULL,
  minutes INTEGER NOT NULL CHECK (minutes IN (1,5,10,15,20)),
  version INTEGER NOT NULL DEFAULT 1,
  title TEXT NOT NULL DEFAULT '',
  script_text TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (exercise_id, minutes, version)
);
GRANT SELECT ON public.mindfulness_scripts_v2 TO authenticated, anon;
GRANT ALL ON public.mindfulness_scripts_v2 TO service_role;
ALTER TABLE public.mindfulness_scripts_v2 ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read active scripts" ON public.mindfulness_scripts_v2 FOR SELECT USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin manage scripts" ON public.mindfulness_scripts_v2 FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_mindfulness_scripts_v2_updated BEFORE UPDATE ON public.mindfulness_scripts_v2 FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) mindfulness_audio_cache: pregenerated audio pointers
CREATE TABLE public.mindfulness_audio_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL REFERENCES public.mindfulness_scripts_v2(id) ON DELETE CASCADE,
  voice_id TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  duration_sec INTEGER,
  chars_used INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (script_id, voice_id)
);
GRANT SELECT ON public.mindfulness_audio_cache TO authenticated, anon;
GRANT ALL ON public.mindfulness_audio_cache TO service_role;
ALTER TABLE public.mindfulness_audio_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read audio cache" ON public.mindfulness_audio_cache FOR SELECT USING (true);
CREATE POLICY "admin write audio cache" ON public.mindfulness_audio_cache FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3) voice_settings: por país y género
CREATE TABLE public.voice_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('female','male')),
  voice_id TEXT NOT NULL,
  label TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (country_code, gender)
);
GRANT SELECT ON public.voice_settings TO authenticated, anon;
GRANT ALL ON public.voice_settings TO service_role;
ALTER TABLE public.voice_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read voice settings" ON public.voice_settings FOR SELECT USING (true);
CREATE POLICY "admin manage voice settings" ON public.voice_settings FOR ALL USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4) ai_usage_log: gasto de IA
CREATE TABLE public.ai_usage_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider TEXT NOT NULL,
  model TEXT NOT NULL,
  feature TEXT NOT NULL,
  user_id UUID,
  tokens_in INTEGER DEFAULT 0,
  tokens_out INTEGER DEFAULT 0,
  chars INTEGER DEFAULT 0,
  cost_usd NUMERIC(10,6) DEFAULT 0,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ai_usage_log_created_idx ON public.ai_usage_log (created_at DESC);
CREATE INDEX ai_usage_log_feature_idx ON public.ai_usage_log (feature);
GRANT SELECT ON public.ai_usage_log TO authenticated;
GRANT ALL ON public.ai_usage_log TO service_role;
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin read ai usage" ON public.ai_usage_log FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- 5) voice preference on profile
ALTER TABLE public.patient_app_profiles ADD COLUMN IF NOT EXISTS voice_gender_preference TEXT CHECK (voice_gender_preference IN ('female','male'));
