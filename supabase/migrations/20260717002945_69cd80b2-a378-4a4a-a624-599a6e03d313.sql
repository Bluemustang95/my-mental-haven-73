
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS reminder_days int[] NOT NULL DEFAULT ARRAY[0,1,2,3,4,5,6];

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS target_key text,
  ADD COLUMN IF NOT EXISTS log_date date;

CREATE UNIQUE INDEX IF NOT EXISTS notification_log_idempotency
  ON public.notification_log (user_id, reason, target_key, log_date)
  WHERE reason IS NOT NULL AND target_key IS NOT NULL AND log_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS notification_log_recent_idx
  ON public.notification_log (user_id, sent_at DESC);

ALTER TABLE public.device_tokens
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS invalid boolean NOT NULL DEFAULT false;

ALTER TABLE public.notification_preferences
  ADD COLUMN IF NOT EXISTS paused_until timestamptz;
