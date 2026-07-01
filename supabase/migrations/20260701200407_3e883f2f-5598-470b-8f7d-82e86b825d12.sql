ALTER TABLE public.psychoeducation_categories
  ADD COLUMN IF NOT EXISTS is_premium boolean NOT NULL DEFAULT false;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS timezone text NOT NULL DEFAULT 'America/Argentina/Buenos_Aires';