
-- 1. Add columns to psychoeducation_content
ALTER TABLE public.psychoeducation_content
  ADD COLUMN IF NOT EXISTS text_kind text NOT NULL DEFAULT 'theory',
  ADD COLUMN IF NOT EXISTS practice_blocks jsonb,
  ADD COLUMN IF NOT EXISTS practice_intro text;

-- 2. Create practice_responses table
CREATE TABLE IF NOT EXISTS public.practice_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content_id uuid NOT NULL REFERENCES public.psychoeducation_content(id) ON DELETE CASCADE,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, content_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.practice_responses TO authenticated;
GRANT ALL ON public.practice_responses TO service_role;

ALTER TABLE public.practice_responses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own practice responses"
  ON public.practice_responses
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all practice responses"
  ON public.practice_responses
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_practice_responses_updated_at
  BEFORE UPDATE ON public.practice_responses
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
