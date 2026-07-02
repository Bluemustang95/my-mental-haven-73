
CREATE TABLE public.thought_followups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  thought_record_id uuid REFERENCES public.thought_records(id) ON DELETE CASCADE,
  type text NOT NULL,
  title text NOT NULL,
  description text,
  due_date date,
  status text NOT NULL DEFAULT 'pending',
  pinned_home boolean NOT NULL DEFAULT true,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thought_followups TO authenticated;
GRANT ALL ON public.thought_followups TO service_role;
ALTER TABLE public.thought_followups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own followups select" ON public.thought_followups FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own followups insert" ON public.thought_followups FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own followups update" ON public.thought_followups FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own followups delete" ON public.thought_followups FOR DELETE USING (auth.uid() = user_id);
CREATE TRIGGER trg_thought_followups_updated BEFORE UPDATE ON public.thought_followups FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_thought_followups_user ON public.thought_followups(user_id, status);

CREATE TABLE public.thought_followup_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  followup_id uuid NOT NULL REFERENCES public.thought_followups(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  did_it boolean NOT NULL,
  suds_before int,
  suds_after int,
  achieved text,
  note text,
  next_step text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.thought_followup_logs TO authenticated;
GRANT ALL ON public.thought_followup_logs TO service_role;
ALTER TABLE public.thought_followup_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own flogs select" ON public.thought_followup_logs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "own flogs insert" ON public.thought_followup_logs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own flogs update" ON public.thought_followup_logs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "own flogs delete" ON public.thought_followup_logs FOR DELETE USING (auth.uid() = user_id);
CREATE INDEX idx_thought_flogs_followup ON public.thought_followup_logs(followup_id);
