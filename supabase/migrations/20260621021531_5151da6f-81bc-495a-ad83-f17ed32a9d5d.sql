
-- HABITS
CREATE TABLE public.habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '⭐',
  value_key text NOT NULL DEFAULT 'salud',
  color text NOT NULL DEFAULT '#7cc2c8',
  text_color text NOT NULL DEFAULT '#7cc2c8',
  best_streak integer NOT NULL DEFAULT 0,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;

ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own habits" ON public.habits FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own habits" ON public.habits FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own habits" ON public.habits FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own habits" ON public.habits FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all habits" ON public.habits FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER habits_updated_at BEFORE UPDATE ON public.habits
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HABIT COMPLETIONS
CREATE TABLE public.habit_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  habit_id uuid NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  completed_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_date)
);

CREATE INDEX habit_completions_user_date_idx ON public.habit_completions(user_id, completed_date);
CREATE INDEX habit_completions_habit_idx ON public.habit_completions(habit_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_completions TO authenticated;
GRANT ALL ON public.habit_completions TO service_role;

ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users select own completions" ON public.habit_completions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users insert own completions" ON public.habit_completions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own completions" ON public.habit_completions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own completions" ON public.habit_completions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins view all completions" ON public.habit_completions FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
