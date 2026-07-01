
-- daily_quotes
CREATE TABLE public.daily_quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  text text NOT NULL,
  author text,
  active boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.daily_quotes TO authenticated;
GRANT ALL ON public.daily_quotes TO service_role;
ALTER TABLE public.daily_quotes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quotes readable by authenticated" ON public.daily_quotes FOR SELECT TO authenticated USING (true);
CREATE POLICY "quotes admin insert" ON public.daily_quotes FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "quotes admin update" ON public.daily_quotes FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "quotes admin delete" ON public.daily_quotes FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_daily_quotes_updated BEFORE UPDATE ON public.daily_quotes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- psychology_news
CREATE TABLE public.psychology_news (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  summary text,
  url text,
  image_url text,
  published_at timestamptz NOT NULL DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.psychology_news TO authenticated;
GRANT ALL ON public.psychology_news TO service_role;
ALTER TABLE public.psychology_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "news readable by authenticated" ON public.psychology_news FOR SELECT TO authenticated USING (true);
CREATE POLICY "news admin insert" ON public.psychology_news FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "news admin update" ON public.psychology_news FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "news admin delete" ON public.psychology_news FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_psychology_news_updated BEFORE UPDATE ON public.psychology_news FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Deterministic daily quote
CREATE OR REPLACE FUNCTION public.get_daily_quote()
RETURNS TABLE(id uuid, text text, author text)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT id, text, author
  FROM public.daily_quotes
  WHERE active = true
  ORDER BY hashtext(to_char(now() AT TIME ZONE 'America/Argentina/Buenos_Aires','YYYY-MM-DD') || id::text)
  LIMIT 1;
$$;
