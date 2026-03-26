-- Selfcare tasks (offline self-care activities)
CREATE TABLE public.selfcare_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_text text NOT NULL,
  completed boolean DEFAULT false,
  completed_date date,
  is_suggested boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.selfcare_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own selfcare" ON public.selfcare_tasks FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own selfcare" ON public.selfcare_tasks FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own selfcare" ON public.selfcare_tasks FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own selfcare" ON public.selfcare_tasks FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all selfcare" ON public.selfcare_tasks FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Medications table
CREATE TABLE public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  dosage text,
  frequency text DEFAULT 'daily',
  reminder_time time,
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own meds" ON public.medications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own meds" ON public.medications FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own meds" ON public.medications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own meds" ON public.medications FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all meds" ON public.medications FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Medication logs (daily intake + side effects)
CREATE TABLE public.medication_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  medication_id uuid NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  taken_at timestamptz DEFAULT now(),
  taken boolean DEFAULT true,
  side_effects text[] DEFAULT '{}',
  note text,
  log_date date DEFAULT CURRENT_DATE
);

ALTER TABLE public.medication_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own med logs" ON public.medication_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own med logs" ON public.medication_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own med logs" ON public.medication_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own med logs" ON public.medication_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all med logs" ON public.medication_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));

-- Weekly reflections cache
CREATE TABLE public.weekly_reflections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  week_start date NOT NULL,
  reflection_text text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, week_start)
);

ALTER TABLE public.weekly_reflections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reflections" ON public.weekly_reflections FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reflections" ON public.weekly_reflections FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own reflections" ON public.weekly_reflections FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reflections" ON public.weekly_reflections FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));