
ALTER TABLE public.psychology_news
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS author text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS auto_generated boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS source_url_hash text;

CREATE UNIQUE INDEX IF NOT EXISTS psychology_news_source_url_hash_key
  ON public.psychology_news (source_url_hash) WHERE source_url_hash IS NOT NULL;

CREATE INDEX IF NOT EXISTS psychology_news_pub_idx
  ON public.psychology_news (active, featured DESC, published_at DESC);

-- Config table for the auto-fetch job (single row).
CREATE TABLE IF NOT EXISTS public.research_feed_config (
  id integer PRIMARY KEY DEFAULT 1,
  enabled boolean NOT NULL DEFAULT false,
  queries text[] NOT NULL DEFAULT ARRAY['salud mental investigacion','psicologia clinica estudio','mindfulness research','DBT terapia dialectica'],
  language text NOT NULL DEFAULT 'es',
  country text NOT NULL DEFAULT 'AR',
  max_per_run integer NOT NULL DEFAULT 6,
  auto_publish boolean NOT NULL DEFAULT false,
  last_run_at timestamptz,
  last_run_summary jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT research_feed_config_singleton CHECK (id = 1)
);

GRANT SELECT ON public.research_feed_config TO authenticated;
GRANT ALL ON public.research_feed_config TO service_role;

ALTER TABLE public.research_feed_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read research config"
  ON public.research_feed_config FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can upsert research config"
  ON public.research_feed_config FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update research config"
  ON public.research_feed_config FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.research_feed_config (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
