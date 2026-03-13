
-- New tables for journal hub

CREATE TABLE public.body_map_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  body_part text NOT NULL,
  intensity integer DEFAULT 5,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.day_timeline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  period text NOT NULL,
  mood_score integer,
  note text,
  entry_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.relationship_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  person text NOT NULL,
  what_happened text,
  what_i_wished text,
  emotion text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.unsent_letters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  recipient text,
  content text NOT NULL,
  action text DEFAULT 'saved',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.therapy_prep_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  note text NOT NULL,
  resolved boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.micro_achievements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  achievement_text text NOT NULL,
  achievement_date date DEFAULT CURRENT_DATE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE public.internal_dialogues (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  situation text,
  critical_voice text NOT NULL,
  compassionate_voice text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.body_map_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.day_timeline_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationship_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unsent_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.therapy_prep_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.micro_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.internal_dialogues ENABLE ROW LEVEL SECURITY;

-- body_map_entries policies
CREATE POLICY "Users can view own body map" ON public.body_map_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own body map" ON public.body_map_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own body map" ON public.body_map_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all body map" ON public.body_map_entries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- day_timeline_entries policies
CREATE POLICY "Users can view own timeline" ON public.day_timeline_entries FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own timeline" ON public.day_timeline_entries FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own timeline" ON public.day_timeline_entries FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own timeline" ON public.day_timeline_entries FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all timeline" ON public.day_timeline_entries FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- relationship_logs policies
CREATE POLICY "Users can view own relationships" ON public.relationship_logs FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own relationships" ON public.relationship_logs FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own relationships" ON public.relationship_logs FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own relationships" ON public.relationship_logs FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all relationships" ON public.relationship_logs FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- unsent_letters policies
CREATE POLICY "Users can view own letters" ON public.unsent_letters FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own letters" ON public.unsent_letters FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own letters" ON public.unsent_letters FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own letters" ON public.unsent_letters FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all letters" ON public.unsent_letters FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- therapy_prep_notes policies
CREATE POLICY "Users can view own therapy notes" ON public.therapy_prep_notes FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapy notes" ON public.therapy_prep_notes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own therapy notes" ON public.therapy_prep_notes FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own therapy notes" ON public.therapy_prep_notes FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all therapy notes" ON public.therapy_prep_notes FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- micro_achievements policies
CREATE POLICY "Users can view own achievements" ON public.micro_achievements FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements" ON public.micro_achievements FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own achievements" ON public.micro_achievements FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all achievements" ON public.micro_achievements FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- internal_dialogues policies
CREATE POLICY "Users can view own dialogues" ON public.internal_dialogues FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dialogues" ON public.internal_dialogues FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dialogues" ON public.internal_dialogues FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dialogues" ON public.internal_dialogues FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all dialogues" ON public.internal_dialogues FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

-- Storage bucket for voice notes
INSERT INTO storage.buckets (id, name, public) VALUES ('voice-notes', 'voice-notes', false);
CREATE POLICY "Users can upload own voice notes" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can view own voice notes" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own voice notes" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
