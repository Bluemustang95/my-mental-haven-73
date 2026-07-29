ALTER TABLE public.daily_checkins ADD COLUMN IF NOT EXISTS is_test_seed boolean NOT NULL DEFAULT false;

CREATE OR REPLACE FUNCTION public.admin_wellbeing_audit(_days integer DEFAULT 7)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  since date := (now() - (_days || ' days')::interval)::date;
  since30 date := (now() - interval '30 days')::date;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'window_days', _days,
    'total_users', (SELECT count(*) FROM public.patient_app_profiles),
    'users_with_any_checkin', (SELECT count(DISTINCT user_id) FROM public.daily_checkins WHERE checkin_date >= since),
    'users_enough_data', (
      SELECT count(*) FROM (
        SELECT user_id FROM public.daily_checkins WHERE checkin_date >= since
        GROUP BY user_id HAVING count(DISTINCT checkin_date) >= 3
      ) s
    ),
    'users_insufficient', (
      SELECT count(*) FROM (
        SELECT user_id FROM public.daily_checkins WHERE checkin_date >= since
        GROUP BY user_id HAVING count(DISTINCT checkin_date) < 3
      ) s
    ),
    'total_checkins', (SELECT count(*) FROM public.daily_checkins WHERE checkin_date >= since),
    'morning_checkins', (SELECT count(*) FROM public.daily_checkins WHERE checkin_date >= since AND COALESCE(mode,'morning') = 'morning'),
    'night_checkins', (SELECT count(*) FROM public.daily_checkins WHERE checkin_date >= since AND mode = 'night'),
    'coverage', (
      SELECT jsonb_build_object(
        'mood', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE mood_score IS NOT NULL AND mood_score > 0) / NULLIF(count(*),0), 1), 0),
        'sleep', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE sleep_score IS NOT NULL AND sleep_score > 0) / NULLIF(count(*),0), 1), 0),
        'dawn', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE dawn_score IS NOT NULL AND dawn_score <> '') / NULLIF(count(*),0), 1), 0),
        'balance', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE emotions IS NOT NULL AND array_length(emotions,1) > 0) / NULLIF(count(*),0), 1), 0)
      )
      FROM public.daily_checkins WHERE checkin_date >= since
    ),
    'user_coverage', (
      SELECT jsonb_build_object(
        'mood', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE has_mood) / NULLIF(count(*),0), 1), 0),
        'sleep', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE has_sleep) / NULLIF(count(*),0), 1), 0),
        'dawn', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE has_dawn) / NULLIF(count(*),0), 1), 0),
        'balance', COALESCE(ROUND(100.0 * count(*) FILTER (WHERE has_balance) / NULLIF(count(*),0), 1), 0)
      )
      FROM (
        SELECT user_id,
          bool_or(mood_score IS NOT NULL AND mood_score > 0) AS has_mood,
          bool_or(sleep_score IS NOT NULL AND sleep_score > 0) AS has_sleep,
          bool_or(dawn_score IS NOT NULL AND dawn_score <> '') AS has_dawn,
          bool_or(emotions IS NOT NULL AND array_length(emotions,1) > 0) AS has_balance
        FROM public.daily_checkins
        WHERE checkin_date >= since
        GROUP BY user_id
        HAVING count(DISTINCT checkin_date) >= 3
      ) s
    ),
    'dawn_values', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('value', v, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT dawn_score AS v, count(*) AS c FROM public.daily_checkins
            WHERE checkin_date >= since30 AND dawn_score IS NOT NULL AND dawn_score <> '' GROUP BY 1) x
    ),
    'emotion_values', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('value', e, 'count', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (SELECT unnest(emotions) AS e, count(*) AS c FROM public.daily_checkins
            WHERE checkin_date >= since30 AND emotions IS NOT NULL GROUP BY 1 ORDER BY 2 DESC LIMIT 30) y
    ),
    'test_seed_rows', (SELECT count(*) FROM public.daily_checkins WHERE is_test_seed = true)
  ) INTO result;

  RETURN result;
END;
$function$;