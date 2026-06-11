
-- Tests (definitions + items)
CREATE TABLE IF NOT EXISTS public.test_definitions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('symptom','personality')),
  scale_min int NOT NULL DEFAULT 0,
  scale_max int NOT NULL DEFAULT 3,
  scale_labels jsonb,
  instructions text,
  active boolean NOT NULL DEFAULT true,
  sort int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.test_definitions TO anon, authenticated;
GRANT ALL ON public.test_definitions TO service_role;
ALTER TABLE public.test_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_definitions readable to all" ON public.test_definitions FOR SELECT USING (true);

CREATE TABLE IF NOT EXISTS public.test_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.test_definitions(id) ON DELETE CASCADE,
  sort int NOT NULL,
  prompt text NOT NULL,
  reverse boolean NOT NULL DEFAULT false,
  subscale text,
  options jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.test_items TO anon, authenticated;
GRANT ALL ON public.test_items TO service_role;
ALTER TABLE public.test_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "test_items readable to all" ON public.test_items FOR SELECT USING (true);

-- goal_completed column on daily_checkins
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS goal_completed text CHECK (goal_completed IN ('yes','partial','no'));
