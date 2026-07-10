
CREATE OR REPLACE FUNCTION public.admin_wellbeing_stats(_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _user_id IS NULL THEN
    -- Global
    SELECT jsonb_build_object(
      'total_users', (SELECT count(*) FROM public.patient_app_profiles),
      'active_7d', (SELECT count(DISTINCT user_id) FROM public.daily_checkins WHERE created_at >= now() - interval '7 days'),
      'active_30d', (SELECT count(DISTINCT user_id) FROM public.daily_checkins WHERE created_at >= now() - interval '30 days'),
      'avg_mood_30d', (SELECT ROUND(AVG(mood_score)::numeric, 2) FROM public.daily_checkins WHERE created_at >= now() - interval '30 days' AND mood_score > 0),
      'avg_sleep_30d', (SELECT ROUND(AVG(sleep_score)::numeric, 2) FROM public.daily_checkins WHERE created_at >= now() - interval '30 days' AND sleep_score > 0),
      'wellbeing_distribution', (
        SELECT jsonb_build_object(
          'bajo', count(*) FILTER (WHERE avg_score < 45),
          'medio', count(*) FILTER (WHERE avg_score >= 45 AND avg_score < 70),
          'alto', count(*) FILTER (WHERE avg_score >= 70)
        )
        FROM (
          SELECT user_id, AVG(mood_score) * 20 AS avg_score
          FROM public.daily_checkins
          WHERE created_at >= now() - interval '30 days' AND mood_score > 0
          GROUP BY user_id
        ) s
      ),
      'mood_evolution_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'avg', a) ORDER BY d), '[]'::jsonb)
        FROM (
          SELECT to_char(checkin_date, 'YYYY-MM-DD') AS d, ROUND(AVG(mood_score)::numeric * 20, 1) AS a
          FROM public.daily_checkins
          WHERE checkin_date >= (now() - interval '30 days')::date AND mood_score > 0
          GROUP BY 1
        ) s
      ),
      'top_modules_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('module', m, 'sessions', c, 'users', u) ORDER BY c DESC), '[]'::jsonb)
        FROM (
          SELECT 'Diario' AS m, count(*) AS c, count(DISTINCT user_id) AS u FROM public.journal_entries WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Check-ins', count(*), count(DISTINCT user_id) FROM public.daily_checkins WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Pensamientos', count(*), count(DISTINCT user_id) FROM public.thought_records WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'DBT', count(*), count(DISTINCT user_id) FROM public.dbt_emotion_sessions WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Mindfulness', count(*), count(DISTINCT user_id) FROM public.exercise_sessions WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Sueño', count(*), count(DISTINCT user_id) FROM public.sleep_log WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Medicación', count(*), count(DISTINCT user_id) FROM public.medication_logs WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Tests', count(*), count(DISTINCT user_id) FROM public.test_results WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Hábitos ✓', count(*), count(DISTINCT user_id) FROM public.habit_completions WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Pack día ✓', count(*), count(DISTINCT user_id) FROM public.ba_day_logs WHERE created_at >= now() - interval '30 days'
          UNION ALL SELECT 'Reflexiones', count(*), count(DISTINCT user_id) FROM public.weekly_reflections WHERE created_at >= now() - interval '30 days'
        ) s
      ),
      'mindfulness_minutes_30d', (SELECT COALESCE(ROUND(SUM(duration_seconds)::numeric / 60), 0) FROM public.exercise_sessions WHERE created_at >= now() - interval '30 days' AND exercise_type = 'mindfulness'),
      'habits_created_vs_completed', jsonb_build_object(
        'created', (SELECT count(*) FROM public.habits),
        'users_with_completions_7d', (SELECT count(DISTINCT user_id) FROM public.habit_completions WHERE created_at >= now() - interval '7 days')
      ),
      'tests_by_type_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('test', test_type, 'count', c) ORDER BY c DESC), '[]'::jsonb)
        FROM (SELECT test_type, count(*) AS c FROM public.test_results WHERE created_at >= now() - interval '30 days' GROUP BY 1) s
      ),
      'engagement_wellbeing_corr', (
        SELECT ROUND(corr(activity_count, avg_mood)::numeric, 3)
        FROM (
          SELECT p.user_id,
            (COALESCE((SELECT count(*) FROM public.thought_records WHERE user_id = p.user_id AND created_at >= now() - interval '30 days'), 0)
             + COALESCE((SELECT count(*) FROM public.exercise_sessions WHERE user_id = p.user_id AND created_at >= now() - interval '30 days'), 0)
             + COALESCE((SELECT count(*) FROM public.journal_entries WHERE user_id = p.user_id AND created_at >= now() - interval '30 days'), 0)
             + COALESCE((SELECT count(*) FROM public.dbt_emotion_sessions WHERE user_id = p.user_id AND created_at >= now() - interval '30 days'), 0)
            )::float AS activity_count,
            COALESCE((SELECT AVG(mood_score) FROM public.daily_checkins WHERE user_id = p.user_id AND created_at >= now() - interval '30 days' AND mood_score > 0), 0)::float AS avg_mood
          FROM public.patient_app_profiles p
        ) s
        WHERE activity_count > 0
      )
    ) INTO result;
  ELSE
    -- Per user
    SELECT jsonb_build_object(
      'user_id', _user_id,
      'mood_30d', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'mood', m, 'sleep', s) ORDER BY d), '[]'::jsonb)
        FROM (
          SELECT to_char(checkin_date, 'YYYY-MM-DD') AS d,
                 ROUND(AVG(mood_score)::numeric * 20, 1) AS m,
                 ROUND(AVG(sleep_score)::numeric * 20, 1) AS s
          FROM public.daily_checkins
          WHERE user_id = _user_id AND checkin_date >= (now() - interval '30 days')::date
          GROUP BY 1
        ) x
      ),
      'activity_30d', jsonb_build_object(
        'checkins', (SELECT count(*) FROM public.daily_checkins WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'thoughts', (SELECT count(*) FROM public.thought_records WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'dbt', (SELECT count(*) FROM public.dbt_emotion_sessions WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'journal', (SELECT count(*) FROM public.journal_entries WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'mindfulness_min', (SELECT COALESCE(ROUND(SUM(duration_seconds)::numeric / 60), 0) FROM public.exercise_sessions WHERE user_id = _user_id AND created_at >= now() - interval '30 days' AND exercise_type = 'mindfulness'),
        'habit_completions', (SELECT count(*) FROM public.habit_completions WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'pack_days', (SELECT count(*) FROM public.ba_day_logs WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'meds_taken', (SELECT count(*) FILTER (WHERE taken = true) FROM public.medication_logs WHERE user_id = _user_id AND created_at >= now() - interval '30 days'),
        'meds_total', (SELECT count(*) FROM public.medication_logs WHERE user_id = _user_id AND created_at >= now() - interval '30 days')
      ),
      'tests', (
        SELECT COALESCE(jsonb_agg(jsonb_build_object('test_type', test_type, 'score', score, 'severity', severity, 'created_at', created_at) ORDER BY created_at DESC), '[]'::jsonb)
        FROM public.test_results WHERE user_id = _user_id AND created_at >= now() - interval '90 days'
      )
    ) INTO result;
  END IF;

  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_wellbeing_stats(uuid) TO authenticated;
