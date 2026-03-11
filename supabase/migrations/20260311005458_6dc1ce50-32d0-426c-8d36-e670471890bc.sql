
-- Journal entries
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  entry_date DATE DEFAULT CURRENT_DATE,
  content TEXT NOT NULL,
  prompt TEXT,
  emotion_tags TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own journal" ON public.journal_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own journal" ON public.journal_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own journal" ON public.journal_entries FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own journal" ON public.journal_entries FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_journal_entries_updated_at BEFORE UPDATE ON public.journal_entries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Thought records (TCC)
CREATE TABLE public.thought_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  situation TEXT NOT NULL,
  automatic_thought TEXT,
  emotion TEXT,
  emotion_intensity INTEGER,
  evidence_for TEXT,
  evidence_against TEXT,
  alternative_thought TEXT,
  new_emotion TEXT,
  new_emotion_intensity INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.thought_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own thoughts" ON public.thought_records FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own thoughts" ON public.thought_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own thoughts" ON public.thought_records FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own thoughts" ON public.thought_records FOR DELETE USING (auth.uid() = user_id);

-- Dream log
CREATE TABLE public.dream_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  dream_date DATE DEFAULT CURRENT_DATE,
  description TEXT NOT NULL,
  emotions TEXT[],
  themes TEXT[],
  lucid BOOLEAN DEFAULT FALSE,
  sleep_quality INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.dream_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own dreams" ON public.dream_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dreams" ON public.dream_log FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dreams" ON public.dream_log FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dreams" ON public.dream_log FOR DELETE USING (auth.uid() = user_id);

-- Test results for PHQ-9, GAD-7 etc
CREATE TABLE public.test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  test_type TEXT NOT NULL,
  score INTEGER NOT NULL,
  answers JSONB,
  severity TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.test_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.test_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own results" ON public.test_results FOR INSERT WITH CHECK (auth.uid() = user_id);
