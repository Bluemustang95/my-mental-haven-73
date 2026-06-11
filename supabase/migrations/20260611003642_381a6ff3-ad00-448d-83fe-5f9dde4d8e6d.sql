
-- ============ Sub-recursos =================
CREATE TABLE public.algo_sub_resources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_category_id uuid REFERENCES public.resource_categories(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES public.algo_sub_resources(id) ON DELETE CASCADE,
  slug text NOT NULL,
  name text NOT NULL,
  route text,
  sort int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX algo_sub_resources_slug_uniq ON public.algo_sub_resources(slug);
GRANT SELECT ON public.algo_sub_resources TO authenticated;
GRANT ALL ON public.algo_sub_resources TO service_role;
ALTER TABLE public.algo_sub_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sub_resources read" ON public.algo_sub_resources FOR SELECT TO authenticated USING (true);
CREATE POLICY "sub_resources admin write" ON public.algo_sub_resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at_algo_sub_resources BEFORE UPDATE ON public.algo_sub_resources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Preguntas =================
CREATE TABLE public.algo_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  prompt text NOT NULL,
  kind text NOT NULL DEFAULT 'symptom' CHECK (kind IN ('symptom','personality','onboarding')),
  sort int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.algo_questions TO authenticated;
GRANT ALL ON public.algo_questions TO service_role;
ALTER TABLE public.algo_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions read" ON public.algo_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "questions admin write" ON public.algo_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER set_updated_at_algo_questions BEFORE UPDATE ON public.algo_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============ Opciones =================
CREATE TABLE public.algo_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.algo_questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  score int NOT NULL DEFAULT 1,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX algo_options_question_idx ON public.algo_options(question_id);
GRANT SELECT ON public.algo_options TO authenticated;
GRANT ALL ON public.algo_options TO service_role;
ALTER TABLE public.algo_options ENABLE ROW LEVEL SECURITY;
CREATE POLICY "options read" ON public.algo_options FOR SELECT TO authenticated USING (true);
CREATE POLICY "options admin write" ON public.algo_options FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ Vinculo respuesta -> sub-recurso =================
CREATE TABLE public.algo_option_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  option_id uuid NOT NULL REFERENCES public.algo_options(id) ON DELETE CASCADE,
  sub_resource_id uuid NOT NULL REFERENCES public.algo_sub_resources(id) ON DELETE CASCADE,
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(option_id, sub_resource_id)
);
GRANT SELECT ON public.algo_option_links TO authenticated;
GRANT ALL ON public.algo_option_links TO service_role;
ALTER TABLE public.algo_option_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "option_links read" ON public.algo_option_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "option_links admin write" ON public.algo_option_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ Respuestas del usuario =================
CREATE TABLE public.algo_user_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.algo_questions(id) ON DELETE CASCADE,
  option_id uuid NOT NULL REFERENCES public.algo_options(id) ON DELETE CASCADE,
  answered_week date NOT NULL DEFAULT date_trunc('week', now())::date,
  answered_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id, answered_week)
);
CREATE INDEX algo_user_answers_user_idx ON public.algo_user_answers(user_id, answered_week DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.algo_user_answers TO authenticated;
GRANT ALL ON public.algo_user_answers TO service_role;
ALTER TABLE public.algo_user_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_answers own" ON public.algo_user_answers FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ============ Vinculo sub-recurso -> psicoeducacion =================
CREATE TABLE public.algo_psycho_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sub_resource_id uuid NOT NULL REFERENCES public.algo_sub_resources(id) ON DELETE CASCADE,
  psycho_id uuid NOT NULL REFERENCES public.psychoeducation_content(id) ON DELETE CASCADE,
  weight int NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sub_resource_id, psycho_id)
);
GRANT SELECT ON public.algo_psycho_links TO authenticated;
GRANT ALL ON public.algo_psycho_links TO service_role;
ALTER TABLE public.algo_psycho_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "psycho_links read" ON public.algo_psycho_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "psycho_links admin write" ON public.algo_psycho_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============ Función de recomendaciones diarias =================
CREATE OR REPLACE FUNCTION public.get_daily_recommendations(_user_id uuid, _limit int DEFAULT 3)
RETURNS TABLE (
  sub_resource_id uuid,
  sub_resource_slug text,
  sub_resource_name text,
  sub_resource_route text,
  resource_category_id uuid,
  total_score numeric
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH recent AS (
    SELECT ua.option_id
    FROM public.algo_user_answers ua
    WHERE ua.user_id = _user_id
      AND ua.answered_at >= now() - interval '14 days'
  ),
  scored AS (
    SELECT sr.id, sr.slug, sr.name, sr.route, sr.resource_category_id,
           SUM(o.score * l.weight)::numeric
             + (extract(doy from now())::int % 7) * 0.01 AS total
    FROM recent r
    JOIN public.algo_options o ON o.id = r.option_id
    JOIN public.algo_option_links l ON l.option_id = o.id
    JOIN public.algo_sub_resources sr ON sr.id = l.sub_resource_id AND sr.active = true
    GROUP BY sr.id, sr.slug, sr.name, sr.route, sr.resource_category_id
  )
  SELECT id, slug, name, route, resource_category_id, total
  FROM scored
  ORDER BY total DESC
  LIMIT _limit
$$;
GRANT EXECUTE ON FUNCTION public.get_daily_recommendations(uuid, int) TO authenticated;
