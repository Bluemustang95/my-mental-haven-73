
-- Privacy preference columns on patient_app_profiles
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS resmita_context_consent boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resmita_context_consent_at timestamptz,
  ADD COLUMN IF NOT EXISTS resmita_share_screen boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS resmita_share_snapshot boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS resmita_store_history boolean NOT NULL DEFAULT true;

-- Telemetry table
CREATE TABLE IF NOT EXISTS public.resmita_context_events (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id uuid,
  event_type text NOT NULL,
  route text,
  screen_title text,
  screen_purpose text,
  snapshot jsonb,
  model text,
  prompt_tokens integer,
  completion_tokens integer,
  latency_ms integer,
  cost_usd numeric(10,6),
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.resmita_context_events TO authenticated;
GRANT ALL ON public.resmita_context_events TO service_role;

ALTER TABLE public.resmita_context_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert own resmita events"
  ON public.resmita_context_events
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users view own resmita events"
  ON public.resmita_context_events
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins view all resmita events"
  ON public.resmita_context_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_resmita_events_user_created ON public.resmita_context_events (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resmita_events_route ON public.resmita_context_events (route);
CREATE INDEX IF NOT EXISTS idx_resmita_events_session ON public.resmita_context_events (session_id);
CREATE INDEX IF NOT EXISTS idx_resmita_events_created ON public.resmita_context_events (created_at DESC);
