CREATE TABLE public.mindfulness_scripts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  sub_key text,
  duration_min int,
  script text NOT NULL DEFAULT '',
  markers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (category, sub_key, duration_min)
);

GRANT SELECT ON public.mindfulness_scripts TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mindfulness_scripts TO authenticated;
GRANT ALL ON public.mindfulness_scripts TO service_role;

ALTER TABLE public.mindfulness_scripts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read mindfulness scripts"
  ON public.mindfulness_scripts FOR SELECT
  USING (true);

CREATE POLICY "Admins insert mindfulness scripts"
  ON public.mindfulness_scripts FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update mindfulness scripts"
  ON public.mindfulness_scripts FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins delete mindfulness scripts"
  ON public.mindfulness_scripts FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_mindfulness_scripts_updated_at
  BEFORE UPDATE ON public.mindfulness_scripts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_mindfulness_scripts_lookup ON public.mindfulness_scripts (category, sub_key, duration_min);

-- Ambient sound library settings (admin-curated catalog enablement + defaults)
CREATE TABLE public.mindfulness_sound_settings (
  id int PRIMARY KEY DEFAULT 1,
  enabled_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  defaults jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)
);

GRANT SELECT ON public.mindfulness_sound_settings TO anon;
GRANT SELECT, INSERT, UPDATE ON public.mindfulness_sound_settings TO authenticated;
GRANT ALL ON public.mindfulness_sound_settings TO service_role;

ALTER TABLE public.mindfulness_sound_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read sound settings"
  ON public.mindfulness_sound_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins write sound settings"
  ON public.mindfulness_sound_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.mindfulness_sound_settings (id) VALUES (1) ON CONFLICT DO NOTHING;