
-- Push notifications: tokens, prefs, log
CREATE TABLE public.device_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  platform text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now(),
  last_seen_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX device_tokens_user_idx ON public.device_tokens(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.device_tokens TO authenticated;
GRANT ALL ON public.device_tokens TO service_role;
ALTER TABLE public.device_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own tokens" ON public.device_tokens
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "admins read all tokens" ON public.device_tokens
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  push_enabled boolean NOT NULL DEFAULT true,
  checkin_enabled boolean NOT NULL DEFAULT true,
  checkin_time time NOT NULL DEFAULT '09:00',
  medication_enabled boolean NOT NULL DEFAULT true,
  habits_enabled boolean NOT NULL DEFAULT true,
  admin_enabled boolean NOT NULL DEFAULT true,
  quiet_hours_start time NOT NULL DEFAULT '22:30',
  quiet_hours_end time NOT NULL DEFAULT '07:30',
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users manage own prefs" ON public.notification_preferences
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.notification_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  kind text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  data jsonb,
  status text NOT NULL DEFAULT 'sent',
  error text,
  sent_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX notif_log_user_idx ON public.notification_log(user_id, sent_at DESC);
CREATE INDEX notif_log_kind_idx ON public.notification_log(kind, sent_at DESC);
GRANT SELECT ON public.notification_log TO authenticated;
GRANT ALL ON public.notification_log TO service_role;
ALTER TABLE public.notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own log" ON public.notification_log
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "admins read all log" ON public.notification_log
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));
