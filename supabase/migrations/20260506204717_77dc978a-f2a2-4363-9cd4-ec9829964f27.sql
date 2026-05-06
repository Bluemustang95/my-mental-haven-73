CREATE TABLE public.sleep_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  log_date DATE NOT NULL DEFAULT CURRENT_DATE,
  quality TEXT NOT NULL CHECK (quality IN ('good','ok','bad')),
  score INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, log_date)
);

ALTER TABLE public.sleep_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sleep logs" ON public.sleep_log FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sleep logs" ON public.sleep_log FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sleep logs" ON public.sleep_log FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sleep logs" ON public.sleep_log FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all sleep logs" ON public.sleep_log FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_sleep_log_updated_at
BEFORE UPDATE ON public.sleep_log
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();