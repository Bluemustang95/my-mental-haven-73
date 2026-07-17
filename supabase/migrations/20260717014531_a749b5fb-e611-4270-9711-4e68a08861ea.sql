
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS next_session_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_weekly_recurring boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS session_day_of_week smallint,
  ADD COLUMN IF NOT EXISTS session_time time,
  ADD COLUMN IF NOT EXISTS last_session_notification_at timestamptz;

CREATE OR REPLACE FUNCTION public.roll_next_session_forward()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid := auth.uid();
  nxt timestamptz;
  recur boolean;
BEGIN
  IF uid IS NULL THEN RETURN NULL; END IF;

  SELECT next_session_at, session_weekly_recurring
    INTO nxt, recur
    FROM public.patient_app_profiles
   WHERE user_id = uid;

  IF nxt IS NULL OR recur IS NOT TRUE THEN
    RETURN nxt;
  END IF;

  -- Advance by full weeks until in the future.
  WHILE nxt < now() LOOP
    nxt := nxt + interval '7 days';
  END LOOP;

  UPDATE public.patient_app_profiles
     SET next_session_at = nxt,
         last_session_notification_at = NULL,
         updated_at = now()
   WHERE user_id = uid
     AND next_session_at IS DISTINCT FROM nxt;

  RETURN nxt;
END;
$$;

GRANT EXECUTE ON FUNCTION public.roll_next_session_forward() TO authenticated;
