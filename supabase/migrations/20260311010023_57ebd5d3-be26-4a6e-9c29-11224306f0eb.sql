
-- Psychoeducation content library
CREATE TABLE public.psychoeducation_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content_type TEXT NOT NULL,
  content_url TEXT NOT NULL,
  thumbnail_url TEXT,
  category TEXT NOT NULL,
  tags TEXT[],
  duration TEXT,
  is_premium BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.psychoeducation_content ENABLE ROW LEVEL SECURITY;

-- Public read access for published content
CREATE POLICY "Anyone can view published content" ON public.psychoeducation_content FOR SELECT USING (is_published = true);

-- Content progress tracking
CREATE TABLE public.content_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  content_id UUID NOT NULL REFERENCES public.psychoeducation_content(id) ON DELETE CASCADE,
  completed BOOLEAN DEFAULT FALSE,
  progress_percent INTEGER DEFAULT 0,
  last_accessed TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, content_id)
);

ALTER TABLE public.content_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own progress" ON public.content_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.content_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON public.content_progress FOR UPDATE USING (auth.uid() = user_id);

-- Add linking code column to patient_app_profiles
ALTER TABLE public.patient_app_profiles ADD COLUMN IF NOT EXISTS linked_professional_code TEXT;
