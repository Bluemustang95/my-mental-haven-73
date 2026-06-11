
ALTER TABLE public.psychoeducation_categories
  ADD COLUMN IF NOT EXISTS content_type text NOT NULL DEFAULT 'video'
  CHECK (content_type IN ('video','text','podcast'));
