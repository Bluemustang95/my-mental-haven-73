DO $$
DECLARE tbl record;
BEGIN
  FOR tbl IN
    SELECT c.relname AS table_name
      FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
     WHERE c.relkind='r' AND n.nspname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', tbl.table_name);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', tbl.table_name);
  END LOOP;
END $$;

-- Public-readable catalog tables (used by anon visitors on resource pages)
GRANT SELECT ON public.resource_categories TO anon;
GRANT SELECT ON public.resource_tools TO anon;
GRANT SELECT ON public.psychoeducation_content TO anon;
GRANT SELECT ON public.algo_questions TO anon;
GRANT SELECT ON public.algo_options TO anon;
GRANT SELECT ON public.algo_option_links TO anon;
GRANT SELECT ON public.algo_psycho_links TO anon;
GRANT SELECT ON public.algo_sub_resources TO anon;
GRANT SELECT ON public.test_definitions TO anon;
GRANT SELECT ON public.test_items TO anon;