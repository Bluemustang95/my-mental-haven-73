
REVOKE EXECUTE ON FUNCTION public.admin_list_patients() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_plan(uuid, text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM PUBLIC, anon;
