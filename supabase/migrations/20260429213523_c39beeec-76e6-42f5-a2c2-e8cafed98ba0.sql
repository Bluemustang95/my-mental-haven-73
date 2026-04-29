CREATE TABLE public.mindful_eating_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  meal_moment text NOT NULL,
  hunger_level integer NOT NULL DEFAULT 5,
  emotions text[] NOT NULL DEFAULT '{}'::text[],
  notes text,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_time time NOT NULL DEFAULT CURRENT_TIME,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.mindful_eating_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own mindful eating entries"
ON public.mindful_eating_entries
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own mindful eating entries"
ON public.mindful_eating_entries
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mindful eating entries"
ON public.mindful_eating_entries
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own mindful eating entries"
ON public.mindful_eating_entries
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all mindful eating entries"
ON public.mindful_eating_entries
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_mindful_eating_entries_updated_at
BEFORE UPDATE ON public.mindful_eating_entries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();