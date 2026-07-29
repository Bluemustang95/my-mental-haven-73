CREATE OR REPLACE FUNCTION public.admin_wellbeing_raw(_user_id uuid, _days integer DEFAULT 30)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  result jsonb;
  from_date date := ((now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date - (_days - 1));
  from_ts timestamptz := (from_date)::timestamptz;
  from_60 timestamptz := (now() - interval '60 days');
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'checkins', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object(
        'checkin_date', c.checkin_date, 'mode', c.mode, 'mood_score', c.mood_score,
        'sleep_score', c.sleep_score, 'dawn_score', c.dawn_score, 'emotions', c.emotions)), '[]'::jsonb)
      FROM public.daily_checkins c WHERE c.user_id = _user_id AND c.checkin_date >= from_date
    ),
    'sleepLogs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('log_date', s.log_date, 'score', s.score, 'quality', s.quality)), '[]'::jsonb)
      FROM public.sleep_log s WHERE s.user_id = _user_id AND s.log_date >= from_date
    ),
    'hygieneAudits', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('audit_date', h.audit_date, 'score', h.score)), '[]'::jsonb)
      FROM public.sleep_hygiene_audits h WHERE h.user_id = _user_id AND h.audit_date >= from_date
    ),
    'dreams', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('dream_date', d.dream_date, 'themes', d.themes,
        'emotions', d.emotions, 'sleep_quality', d.sleep_quality)), '[]'::jsonb)
      FROM public.dream_log d WHERE d.user_id = _user_id AND d.dream_date >= from_date
    ),
    'medLogs', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('log_date', m.log_date, 'taken', m.taken)), '[]'::jsonb)
      FROM public.medication_logs m WHERE m.user_id = _user_id AND m.log_date >= from_date
    ),
    'hasMedications', (
      SELECT EXISTS(SELECT 1 FROM public.medications md WHERE md.user_id = _user_id AND (md.active IS NULL OR md.active = true))
    ),
    'sessionNotes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('session_date', n.session_date)), '[]'::jsonb)
      FROM public.session_notes n WHERE n.user_id = _user_id AND n.session_date >= from_date
    ),
    'prepNotes', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('created_at', p.created_at, 'shared_at', p.shared_at)), '[]'::jsonb)
      FROM public.therapy_prep_notes p WHERE p.user_id = _user_id AND p.created_at >= from_ts
    ),
    'tests', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('test_type', t.test_type, 'severity', t.severity, 'created_at', t.created_at)), '[]'::jsonb)
      FROM public.test_results t WHERE t.user_id = _user_id AND t.created_at >= from_60
    ),
    'inTherapy', (
      SELECT COALESCE(pr.in_therapy, false) FROM public.patient_app_profiles pr WHERE pr.user_id = _user_id
    ),
    'activities', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('date', a.d, 'kind', a.kind, 'exercise_type', a.ex)), '[]'::jsonb)
      FROM (
        SELECT e.created_at::text AS d, 'exercise' AS kind, e.exercise_type AS ex
          FROM public.exercise_sessions e WHERE e.user_id = _user_id AND e.created_at >= from_ts
        UNION ALL
        SELECT tr.created_at::text, 'thought', NULL FROM public.thought_records tr WHERE tr.user_id = _user_id AND tr.created_at >= from_ts
        UNION ALL
        SELECT db.created_at::text, 'dbt', NULL FROM public.dbt_emotion_sessions db WHERE db.user_id = _user_id AND db.created_at >= from_ts
        UNION ALL
        SELECT j.created_at::text, 'journal', NULL FROM public.journal_entries j WHERE j.user_id = _user_id AND j.created_at >= from_ts
        UNION ALL
        SELECT hc.completed_date::text, 'habit', NULL FROM public.habit_completions hc WHERE hc.user_id = _user_id AND hc.completed_date >= from_date
      ) a
    )
  ) INTO result;

  RETURN result;
END;
$function$;