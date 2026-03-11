
-- Create function for updated_at timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Patient app profiles
CREATE TABLE public.patient_app_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  display_name TEXT,
  life_stage TEXT,
  areas_of_interest TEXT[],
  recent_feelings TEXT[],
  treatment_status TEXT DEFAULT 'none',
  onboarding_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patient_app_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.patient_app_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.patient_app_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.patient_app_profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_patient_profiles_updated_at BEFORE UPDATE ON public.patient_app_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Daily check-ins
CREATE TABLE public.daily_checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  checkin_date DATE NOT NULL DEFAULT CURRENT_DATE,
  mood_score INTEGER CHECK (mood_score BETWEEN 1 AND 5),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

ALTER TABLE public.daily_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own checkins" ON public.daily_checkins FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkins" ON public.daily_checkins FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own checkins" ON public.daily_checkins FOR UPDATE USING (auth.uid() = user_id);

-- Exercise sessions
CREATE TABLE public.exercise_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  exercise_type TEXT NOT NULL,
  exercise_name TEXT,
  duration_seconds INTEGER,
  completed BOOLEAN DEFAULT TRUE,
  mood_before INTEGER,
  mood_after INTEGER,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.exercise_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sessions" ON public.exercise_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.exercise_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Patients intake (treatment requests)
CREATE TABLE public.patients_intake (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER,
  phone TEXT,
  email TEXT,
  reason TEXT,
  modality TEXT,
  insurance TEXT,
  zone TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.patients_intake ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own intake" ON public.patients_intake FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert intake" ON public.patients_intake FOR INSERT WITH CHECK (auth.uid() = user_id);
