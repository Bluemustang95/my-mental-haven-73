
-- Allow all authenticated users to see catalog rows regardless of publish flag,
-- so client-side filters can hide OFF resources correctly.
DROP POLICY IF EXISTS "Authenticated view all categories" ON public.resource_categories;
CREATE POLICY "Authenticated view all categories" ON public.resource_categories
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Authenticated view all tools" ON public.resource_tools;
CREATE POLICY "Authenticated view all tools" ON public.resource_tools
  FOR SELECT TO authenticated USING (true);
