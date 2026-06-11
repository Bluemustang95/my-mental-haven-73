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
SECURITY INVOKER
SET search_path = public
AS $$
  WITH recent AS (
    SELECT ua.option_id
    FROM public.algo_user_answers ua
    WHERE ua.user_id = auth.uid()
      AND ua.user_id = _user_id
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
GRANT EXECUTE ON FUNCTION public.get_daily_recommendations(uuid, int) TO service_role;