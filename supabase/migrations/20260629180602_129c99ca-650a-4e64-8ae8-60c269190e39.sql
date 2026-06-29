-- Extend admin_stats_overview with module retention (7d & 30d unique users per module)
CREATE OR REPLACE FUNCTION public.admin_stats_overview()
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    'module_retention', (SELECT COALESCE(jsonb_agg(jsonb_build_object('module', m, 'u7d', u7, 'u30d', u30) ORDER BY u30 DESC), '[]'::jsonb)
                          FROM (
                            SELECT 'Diario' AS m,
                              (SELECT count(DISTINCT user_id) FROM public.journal_entries WHERE created_at >= now() - interval '7 days') AS u7,
                              (SELECT count(DISTINCT user_id) FROM public.journal_entries WHERE created_at >= now() - interval '30 days') AS u30
                            UNION ALL SELECT 'Pensamientos',
                              (SELECT count(DISTINCT user_id) FROM public.thought_records WHERE created_at >= now() - interval '7 days'),
                              (SELECT count(DISTINCT user_id) FROM public.thought_records WHERE created_at >= now() - interval '30 days')
                            UNION ALL SELECT 'DBT',
                              (SELECT count(DISTINCT user_id) FROM public.dbt_emotion_sessions WHERE created_at >= now() - interval '7 days'),
                              (SELECT count(DISTINCT user_id) FROM public.dbt_emotion_sessions WHERE created_at >= now() - interval '30 days')
                            UNION ALL SELECT 'Hábitos',
                              (SELECT count(DISTINCT user_id) FROM public.habit_completions WHERE created_at >= now() - interval '7 days'),
                              (SELECT count(DISTINCT user_id) FROM public.habit_completions WHERE created_at >= now() - interval '30 days')
                            UNION ALL SELECT 'Sueño',
                              (SELECT count(DISTINCT user_id) FROM public.sleep_log WHERE created_at >= now() - interval '7 days'),
                              (SELECT count(DISTINCT user_id) FROM public.sleep_log WHERE created_at >= now() - interval '30 days')
                            UNION ALL SELECT 'Mindfulness',
                              (SELECT count(DISTINCT user_id) FROM public.exercise_sessions WHERE created_at >= now() - interval '7 days'),
                              (SELECT count(DISTINCT user_id) FROM public.exercise_sessions WHERE created_at >= now() - interval '30 days')
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
$function$;

-- Bulk plan change with audit per user
CREATE OR REPLACE FUNCTION public.admin_bulk_set_plan(
  _user_ids uuid[],
  _plan text,
  _expires_at timestamptz,
  _reason text DEFAULT NULL
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _u uuid;
  _old text;
  _count integer := 0;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  FOREACH _u IN ARRAY _user_ids LOOP
    SELECT plan INTO _old FROM public.patient_app_profiles WHERE user_id = _u;

    UPDATE public.patient_app_profiles
    SET plan = _plan,
        plan_started_at = CASE WHEN _plan = 'premium' THEN COALESCE(plan_started_at, now()) ELSE NULL END,
        plan_expires_at = _expires_at,
        updated_at = now()
    WHERE user_id = _u;

    INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, reason, payload)
    VALUES (
      auth.uid(),
      'bulk_set_plan',
      _u,
      _reason,
      jsonb_build_object('from', _old, 'to', _plan, 'expires_at', _expires_at)
    );

    _count := _count + 1;
  END LOOP;

  RETURN _count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_bulk_set_plan(uuid[], text, timestamptz, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_bulk_set_plan(uuid[], text, timestamptz, text) TO authenticated;