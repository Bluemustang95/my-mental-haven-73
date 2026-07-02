
ALTER TABLE public.test_definitions
  ADD COLUMN IF NOT EXISTS baremos jsonb,
  ADD COLUMN IF NOT EXISTS result_message text,
  ADD COLUMN IF NOT EXISTS trait_descriptions jsonb;

-- Admin write policies for test catalog
DROP POLICY IF EXISTS "test_definitions admin write" ON public.test_definitions;
CREATE POLICY "test_definitions admin write" ON public.test_definitions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "test_items admin write" ON public.test_items;
CREATE POLICY "test_items admin write" ON public.test_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_definitions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_items TO authenticated;
GRANT ALL ON public.test_definitions TO service_role;
GRANT ALL ON public.test_items TO service_role;
