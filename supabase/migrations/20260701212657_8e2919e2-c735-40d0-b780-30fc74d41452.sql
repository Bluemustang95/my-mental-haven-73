
-- Resmita conversation memory
CREATE TABLE public.resmita_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL CHECK (role IN ('user','assistant')),
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resmita_messages TO authenticated;
GRANT ALL ON public.resmita_messages TO service_role;
ALTER TABLE public.resmita_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own resmita msgs" ON public.resmita_messages FOR ALL USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
CREATE INDEX resmita_messages_user_created_idx ON public.resmita_messages (user_id, created_at DESC);

-- Therapy session reminders
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS next_session_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_reminder_dismissed_at timestamptz;

-- Diario encryption flag (payload stored inside content as JSON envelope when encrypted)
ALTER TABLE public.journal_entries
  ADD COLUMN IF NOT EXISTS is_encrypted boolean NOT NULL DEFAULT false;
