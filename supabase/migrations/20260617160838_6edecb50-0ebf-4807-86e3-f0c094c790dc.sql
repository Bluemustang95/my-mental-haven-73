REVOKE EXECUTE ON FUNCTION public.admin_stats_overview() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_list_patients() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_plan(uuid, text, timestamptz) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_stats_overview() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_patients() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_plan(uuid, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_admin_role(uuid, boolean) TO authenticated;