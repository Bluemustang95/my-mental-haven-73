ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS category_key text NOT NULL DEFAULT 'salud',
  ADD COLUMN IF NOT EXISTS frequency text NOT NULL DEFAULT 'daily',
  ADD COLUMN IF NOT EXISTS frequency_count int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS time_slot text NOT NULL DEFAULT 'all',
  ADD COLUMN IF NOT EXISTS cadence text NOT NULL DEFAULT 'every_day',
  ADD COLUMN IF NOT EXISTS reminders_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS icon_type text NOT NULL DEFAULT 'emoji';

CREATE TABLE IF NOT EXISTS public.habit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_categories TO authenticated;
GRANT ALL ON public.habit_categories TO service_role;

ALTER TABLE public.habit_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own habit_categories" ON public.habit_categories FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own habit_categories" ON public.habit_categories FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own habit_categories" ON public.habit_categories FOR DELETE TO authenticated USING (auth.uid() = user_id);