
-- Content favorites
CREATE TABLE public.content_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.psychoeducation_content(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, content_id)
);
ALTER TABLE public.content_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites" ON public.content_favorites FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own favorites" ON public.content_favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own favorites" ON public.content_favorites FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all favorites" ON public.content_favorites FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Session notes
CREATE TABLE public.session_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_date date NOT NULL DEFAULT CURRENT_DATE,
  note text NOT NULL,
  mood_after integer,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.session_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own session notes" ON public.session_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own session notes" ON public.session_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own session notes" ON public.session_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own session notes" ON public.session_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all session notes" ON public.session_notes FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Weekly goals
CREATE TABLE public.weekly_goals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  week_start date NOT NULL DEFAULT (date_trunc('week', CURRENT_DATE))::date,
  goal_text text NOT NULL,
  completed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.weekly_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own goals" ON public.weekly_goals FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own goals" ON public.weekly_goals FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own goals" ON public.weekly_goals FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own goals" ON public.weekly_goals FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all goals" ON public.weekly_goals FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
