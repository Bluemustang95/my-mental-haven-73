CREATE OR REPLACE FUNCTION public.bootstrap_configured_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
  current_user_id uuid := auth.uid();
BEGIN
  IF current_user_id IS NULL THEN
    RETURN false;
  END IF;

  IF current_email = 'redsaludmentalarg@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (current_user_id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
    RETURN true;
  END IF;

  RETURN public.has_role(current_user_id, 'admin'::public.app_role);
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_configured_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_configured_admin() TO authenticated;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'redsaludmentalarg@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;