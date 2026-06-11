
CREATE TABLE public.psychoeducation_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  emoji text,
  accent_color text DEFAULT '#A78BFA',
  sort_order int NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.psychoeducation_categories TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.psychoeducation_categories TO authenticated;
GRANT ALL ON public.psychoeducation_categories TO service_role;

ALTER TABLE public.psychoeducation_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published categories"
  ON public.psychoeducation_categories FOR SELECT
  USING (is_published = true);

CREATE POLICY "Admins can select all categories"
  ON public.psychoeducation_categories FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert categories"
  ON public.psychoeducation_categories FOR INSERT
  TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update categories"
  ON public.psychoeducation_categories FOR UPDATE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete categories"
  ON public.psychoeducation_categories FOR DELETE
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_psychoeducation_categories_updated_at
  BEFORE UPDATE ON public.psychoeducation_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.psychoeducation_content
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.psychoeducation_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS body_html text,
  ADD COLUMN IF NOT EXISTS media_url text,
  ADD COLUMN IF NOT EXISTS duration_minutes int;

CREATE INDEX IF NOT EXISTS idx_psychoeducation_content_category_id
  ON public.psychoeducation_content(category_id);
