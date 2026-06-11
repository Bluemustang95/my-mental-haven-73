DROP FUNCTION IF EXISTS public.bootstrap_configured_admin();

CREATE POLICY "Configured admin can claim own role"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role = 'admin'::public.app_role
  AND lower(coalesce(auth.jwt() ->> 'email', '')) = 'redsaludmentalarg@gmail.com'
);

REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO service_role;

REVOKE ALL ON FUNCTION public.get_daily_recommendations(uuid, int) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_daily_recommendations(uuid, int) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_daily_recommendations(uuid, int) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_daily_recommendations(uuid, int) TO service_role;