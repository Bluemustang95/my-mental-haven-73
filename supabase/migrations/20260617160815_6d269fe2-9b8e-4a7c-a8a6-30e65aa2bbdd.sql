DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'redsaludmentalarg@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_uid, 'admin') ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.admin_stats_overview()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'total_users', (SELECT count(*) FROM public.patient_app_profiles),
    'onboarding_completed', (SELECT count(*) FROM public.patient_app_profiles WHERE onboarding_completed = true),
    'onboarding_in_progress', (SELECT count(*) FROM public.patient_app_profiles WHERE onboarding_completed = false OR onboarding_completed IS NULL),
    'active_7d', (SELECT count(DISTINCT user_id) FROM public.daily_checkins WHERE created_at >= now() - interval '7 days'),
    'active_30d', (SELECT count(DISTINCT user_id) FROM public.daily_checkins WHERE created_at >= now() - interval '30 days'),
    'premium_users', (SELECT count(*) FROM public.patient_app_profiles WHERE plan = 'premium'),
    'free_users', (SELECT count(*) FROM public.patient_app_profiles WHERE plan = 'free' OR plan IS NULL),
    'by_country', (SELECT COALESCE(jsonb_agg(jsonb_build_object('country', country, 'count', c) ORDER BY c DESC), '[]'::jsonb)
                     FROM (SELECT COALESCE(country, 'Sin especificar') AS country, count(*) AS c
                           FROM public.patient_app_profiles GROUP BY country) s),
    'signups_30d', (SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'count', c) ORDER BY d), '[]'::jsonb)
                      FROM (SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS d, count(*) AS c
                            FROM public.patient_app_profiles
                            WHERE created_at >= now() - interval '30 days'
                            GROUP BY 1) s),
    'top_modules', (SELECT COALESCE(jsonb_agg(jsonb_build_object('module', m, 'count', c) ORDER BY c DESC), '[]'::jsonb)
                      FROM (
                        SELECT 'Diario' AS m, count(*) AS c FROM public.journal_entries WHERE created_at >= now() - interval '30 days'
                        UNION ALL SELECT 'Check-ins', count(*) FROM public.daily_checkins WHERE created_at >= now() - interval '30 days'
                        UNION ALL SELECT 'Pensamientos', count(*) FROM public.thought_records WHERE created_at >= now() - interval '30 days'
                        UNION ALL SELECT 'Sueño', count(*) FROM public.sleep_log WHERE created_at >= now() - interval '30 days'
                        UNION ALL SELECT 'Medicación', count(*) FROM public.medication_logs WHERE created_at >= now() - interval '30 days'
                        UNION ALL SELECT 'Tests', count(*) FROM public.test_results WHERE created_at >= now() - interval '30 days'
                        UNION ALL SELECT 'Ejercicios', count(*) FROM public.exercise_sessions WHERE created_at >= now() - interval '30 days'
                      ) s),
    'retention', jsonb_build_object(
      'd1', (SELECT count(DISTINCT p.user_id)::float / NULLIF(count(DISTINCT p2.user_id), 0)
             FROM public.patient_app_profiles p2
             LEFT JOIN public.daily_checkins p ON p.user_id = p2.user_id AND p.created_at::date = (p2.created_at + interval '1 day')::date
             WHERE p2.created_at >= now() - interval '30 days'),
      'd7', (SELECT count(DISTINCT p.user_id)::float / NULLIF(count(DISTINCT p2.user_id), 0)
             FROM public.patient_app_profiles p2
             LEFT JOIN public.daily_checkins p ON p.user_id = p2.user_id AND p.created_at >= p2.created_at + interval '7 days' AND p.created_at < p2.created_at + interval '8 days'
             WHERE p2.created_at >= now() - interval '60 days' AND p2.created_at <= now() - interval '7 days')
    )
  ) INTO result;

  RETURN result;
END;
$$;