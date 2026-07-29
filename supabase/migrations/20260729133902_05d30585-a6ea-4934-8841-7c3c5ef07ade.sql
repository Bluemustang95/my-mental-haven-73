CREATE OR REPLACE FUNCTION public.admin_wellbeing_checkins(_user_id uuid)
RETURNS TABLE(checkin_date date, mood_score integer, sleep_score integer, dawn_score text, emotions text[], mode text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT c.checkin_date, c.mood_score, c.sleep_score, c.dawn_score, c.emotions, c.mode
  FROM public.daily_checkins c
  WHERE c.user_id = _user_id
    AND c.checkin_date >= (now() AT TIME ZONE 'America/Argentina/Buenos_Aires')::date - 13
  ORDER BY c.checkin_date;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_wellbeing_checkins(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_wellbeing_checkins(uuid) TO authenticated;