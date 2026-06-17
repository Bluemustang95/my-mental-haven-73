
-- 1. Add columns
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS plan_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS voice_id text;

-- 2. Admin RLS: full access to patient_app_profiles
DROP POLICY IF EXISTS "Admins manage all patient profiles" ON public.patient_app_profiles;
CREATE POLICY "Admins manage all patient profiles"
ON public.patient_app_profiles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 3. Admin RLS: manage user_roles
DROP POLICY IF EXISTS "Admins manage all user roles" ON public.user_roles;
CREATE POLICY "Admins manage all user roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 4. Security-definer RPC: list patients with email (admin only)
CREATE OR REPLACE FUNCTION public.admin_list_patients()
RETURNS TABLE(
  user_id uuid,
  email text,
  display_name text,
  country text,
  life_stage text,
  plan text,
  plan_started_at timestamptz,
  plan_expires_at timestamptz,
  treatment_status text,
  onboarding_completed boolean,
  is_admin boolean,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    p.user_id,
    u.email::text,
    p.display_name,
    p.country,
    p.life_stage,
    p.plan,
    p.plan_started_at,
    p.plan_expires_at,
    p.treatment_status,
    p.onboarding_completed,
    EXISTS(SELECT 1 FROM public.user_roles r WHERE r.user_id = p.user_id AND r.role = 'admin') AS is_admin,
    p.created_at
  FROM public.patient_app_profiles p
  LEFT JOIN auth.users u ON u.id = p.user_id
  ORDER BY p.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_list_patients() TO authenticated;

-- 5. Admin helpers: set plan & toggle admin role
CREATE OR REPLACE FUNCTION public.admin_set_plan(_user_id uuid, _plan text, _expires_at timestamptz)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.patient_app_profiles
  SET plan = _plan,
      plan_started_at = CASE WHEN _plan = 'premium' THEN COALESCE(plan_started_at, now()) ELSE NULL END,
      plan_expires_at = _expires_at,
      updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_plan(uuid, text, timestamptz) TO authenticated;

CREATE OR REPLACE FUNCTION public.admin_set_admin_role(_user_id uuid, _is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated;
