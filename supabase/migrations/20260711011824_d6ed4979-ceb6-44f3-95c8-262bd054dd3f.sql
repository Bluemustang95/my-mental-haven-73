
-- Snapshot function (caller-scoped, gated by user's own preference)
CREATE OR REPLACE FUNCTION public.get_resmita_user_snapshot()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  allowed boolean;
  result jsonb;
  last_ci record;
  prev_avg numeric;
  curr_avg numeric;
  trend text;
  streak int := 0;
  med_count int;
  open_thought boolean;
  last_test record;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT COALESCE(resmita_share_snapshot, false)
    INTO allowed
    FROM public.patient_app_profiles WHERE user_id = uid;

  IF NOT COALESCE(allowed, false) THEN
    RETURN jsonb_build_object('allowed', false);
  END IF;

  SELECT mood_score, sleep_score, checkin_date
    INTO last_ci
    FROM public.daily_checkins
   WHERE user_id = uid
   ORDER BY checkin_date DESC
   LIMIT 1;

  SELECT AVG(mood_score) INTO curr_avg
    FROM public.daily_checkins
   WHERE user_id = uid
     AND mood_score > 0
     AND checkin_date >= (now() - interval '7 days')::date;

  SELECT AVG(mood_score) INTO prev_avg
    FROM public.daily_checkins
   WHERE user_id = uid
     AND mood_score > 0
     AND checkin_date >= (now() - interval '14 days')::date
     AND checkin_date <  (now() - interval '7 days')::date;

  trend := CASE
    WHEN curr_avg IS NULL OR prev_avg IS NULL THEN NULL
    WHEN curr_avg > prev_avg + 0.3 THEN 'improving'
    WHEN curr_avg < prev_avg - 0.3 THEN 'declining'
    ELSE 'stable'
  END;

  -- Streak: consecutive days with a check-in ending today or yesterday
  WITH days AS (
    SELECT DISTINCT checkin_date::date AS d
      FROM public.daily_checkins
     WHERE user_id = uid
       AND checkin_date >= (now() - interval '60 days')::date
     ORDER BY d DESC
  ),
  gaps AS (
    SELECT d, (current_date - d)::int - ROW_NUMBER() OVER (ORDER BY d DESC)::int + 1 AS grp
      FROM days
  )
  SELECT COUNT(*) INTO streak
    FROM gaps WHERE grp = (SELECT grp FROM gaps LIMIT 1);

  SELECT COUNT(*) INTO med_count
    FROM public.medications WHERE user_id = uid AND (active IS NULL OR active = true);

  SELECT EXISTS(
    SELECT 1 FROM public.thought_records
     WHERE user_id = uid
       AND (completed_at IS NULL OR completed_at > now() - interval '2 days')
       AND created_at > now() - interval '7 days'
  ) INTO open_thought;

  SELECT test_type, severity, created_at
    INTO last_test
    FROM public.test_results
   WHERE user_id = uid
   ORDER BY created_at DESC
   LIMIT 1;

  result := jsonb_build_object(
    'allowed', true,
    'last_checkin', CASE WHEN last_ci.checkin_date IS NULL THEN NULL ELSE jsonb_build_object(
       'mood', last_ci.mood_score, 'sleep', last_ci.sleep_score, 'date', last_ci.checkin_date
    ) END,
    'mood_trend_7d', trend,
    'streak_days', streak,
    'active_medications', med_count,
    'open_thought_record', open_thought,
    'last_test', CASE WHEN last_test.test_type IS NULL THEN NULL ELSE jsonb_build_object(
       'type', last_test.test_type, 'severity', last_test.severity, 'date', last_test.created_at
    ) END
  );

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_resmita_user_snapshot() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_resmita_user_snapshot() TO authenticated;

-- Admin analytics
CREATE OR REPLACE FUNCTION public.admin_resmita_analytics(_days int DEFAULT 7)
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
    'window_days', _days,
    'total_events', (SELECT count(*) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval),
    'sessions', (SELECT count(DISTINCT session_id) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval AND session_id IS NOT NULL),
    'unique_users', (SELECT count(DISTINCT user_id) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval),
    'total_cost_usd', (SELECT COALESCE(ROUND(SUM(cost_usd)::numeric, 4), 0) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval),
    'total_tokens', (SELECT COALESCE(SUM(prompt_tokens) + SUM(completion_tokens), 0) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval),
    'error_count', (SELECT count(*) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval AND event_type = 'error'),
    'consent_granted', (SELECT count(*) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval AND event_type = 'consent_granted'),
    'consent_declined', (SELECT count(*) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval AND event_type = 'consent_declined'),
    'latency_p50_ms', (SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY latency_ms) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval AND latency_ms IS NOT NULL),
    'latency_p95_ms', (SELECT percentile_cont(0.95) WITHIN GROUP (ORDER BY latency_ms) FROM public.resmita_context_events WHERE created_at >= now() - (_days || ' days')::interval AND latency_ms IS NOT NULL),
    'top_routes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('route', route, 'screen', screen_title, 'sessions', c) ORDER BY c DESC), '[]'::jsonb)
      FROM (
        SELECT route, screen_title, count(DISTINCT session_id) AS c
        FROM public.resmita_context_events
        WHERE created_at >= now() - (_days || ' days')::interval AND route IS NOT NULL
        GROUP BY route, screen_title
        ORDER BY c DESC
        LIMIT 10
      ) s
    ),
    'daily', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', d, 'sessions', s, 'cost', c) ORDER BY d), '[]'::jsonb)
      FROM (
        SELECT to_char(date_trunc('day', created_at), 'YYYY-MM-DD') AS d,
               count(DISTINCT session_id) AS s,
               COALESCE(ROUND(SUM(cost_usd)::numeric, 4), 0) AS c
        FROM public.resmita_context_events
        WHERE created_at >= now() - (_days || ' days')::interval
        GROUP BY 1
      ) x
    ),
    'action_click_rate', (
      SELECT ROUND(100.0 * count(*) FILTER (WHERE event_type = 'action_click')::numeric / NULLIF(count(*) FILTER (WHERE event_type = 'open_sheet'), 0), 1)
      FROM public.resmita_context_events
      WHERE created_at >= now() - (_days || ' days')::interval
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_resmita_analytics(int) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.admin_resmita_analytics(int) TO authenticated;
