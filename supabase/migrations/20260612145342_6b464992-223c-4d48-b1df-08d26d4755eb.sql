
-- =========================================
-- 1. ba_content (singleton editable por admin)
-- =========================================
CREATE TABLE public.ba_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  singleton boolean NOT NULL DEFAULT true UNIQUE,
  program_meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  intro_slides jsonb NOT NULL DEFAULT '[]'::jsonb,
  cycle_text jsonb NOT NULL DEFAULT '{}'::jsonb,
  clinical_plan jsonb NOT NULL DEFAULT '{}'::jsonb,
  values_catalog jsonb NOT NULL DEFAULT '[]'::jsonb,
  default_ladder jsonb NOT NULL DEFAULT '[]'::jsonb,
  barriers_catalog jsonb NOT NULL DEFAULT '[]'::jsonb,
  daily_messages jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ba_content TO authenticated;
GRANT ALL ON public.ba_content TO service_role;

ALTER TABLE public.ba_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ba_content readable by authenticated"
  ON public.ba_content FOR SELECT TO authenticated USING (true);

CREATE POLICY "ba_content writable by admin"
  ON public.ba_content FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ba_content_updated
  BEFORE UPDATE ON public.ba_content
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 2. ba_programs (uno por usuario)
-- =========================================
CREATE TABLE public.ba_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  state text NOT NULL DEFAULT 'day1',
  current_day int NOT NULL DEFAULT 1,
  day_one_step int NOT NULL DEFAULT 0,
  selected_values jsonb NOT NULL DEFAULT '[]'::jsonb,
  motivation text DEFAULT '',
  goals jsonb NOT NULL DEFAULT '["","",""]'::jsonb,
  selected_goal_idx int DEFAULT 0,
  ladder jsonb NOT NULL DEFAULT '[]'::jsonb,
  started_at timestamptz NOT NULL DEFAULT now(),
  last_completed_date date,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ba_programs TO authenticated;
GRANT ALL ON public.ba_programs TO service_role;

ALTER TABLE public.ba_programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own ba_programs"
  ON public.ba_programs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read ba_programs"
  ON public.ba_programs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ba_programs_updated
  BEFORE UPDATE ON public.ba_programs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 3. ba_baseline_entries
-- =========================================
CREATE TABLE public.ba_baseline_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.ba_programs(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  hour int NOT NULL CHECK (hour BETWEEN 0 AND 23),
  activity text NOT NULL DEFAULT '',
  emotion text DEFAULT '',
  intensity int DEFAULT 0,
  dominio int DEFAULT 0,
  agrado int DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, day_of_week, hour)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ba_baseline_entries TO authenticated;
GRANT ALL ON public.ba_baseline_entries TO service_role;

ALTER TABLE public.ba_baseline_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own ba_baseline"
  ON public.ba_baseline_entries FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER trg_ba_baseline_updated
  BEFORE UPDATE ON public.ba_baseline_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 4. ba_day_logs
-- =========================================
CREATE TABLE public.ba_day_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.ba_programs(id) ON DELETE CASCADE,
  day int NOT NULL CHECK (day BETWEEN 2 AND 7),
  phase text NOT NULL DEFAULT 'planning',
  scheduled_time time,
  anticipated_difficulty int,
  actual_difficulty int,
  dominio int,
  agrado int,
  barrier_chosen text,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, program_id, day)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ba_day_logs TO authenticated;
GRANT ALL ON public.ba_day_logs TO service_role;

ALTER TABLE public.ba_day_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users manage own ba_day_logs"
  ON public.ba_day_logs FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "admins read ba_day_logs"
  ON public.ba_day_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ba_day_logs_updated
  BEFORE UPDATE ON public.ba_day_logs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================
-- 5. Seed contenido por defecto
-- =========================================
INSERT INTO public.ba_content (singleton, program_meta, intro_slides, cycle_text, clinical_plan, values_catalog, default_ladder, barriers_catalog, daily_messages)
VALUES (
  true,
  '{"title":"Activación Comportamental","subtitle":"Recuperá tu energía vital actuando de afuera hacia adentro.","icon":"zap"}'::jsonb,
  '[
    {"title":"El ciclo de la depresión","body":"La depresión nos roba la energía. A menudo respondemos aislándonos o sobre-exigiéndonos, pero esto solo empeora las cosas. En la Activación Comportamental vamos a entender este ciclo.","icon":"zap"},
    {"title":"De afuera hacia adentro","body":"El secreto clínico es: no podemos esperar a tener ganas para empezar a actuar. Al forzarnos amorosamente a hacer pequeñas acciones, nuestra química cerebral cambia y la motivación empieza a volver sola.","icon":"zap"},
    {"title":"El Plan Clínico","body":"1. Elegirás tus valores y metas.\n2. Iniciaremos un calendario de Dominio y Agrado.\n3. Armaremos una Escalera de Acción (paso a paso).","icon":"zap"}
  ]'::jsonb,
  '{
    "title":"El Ciclo de la Acción",
    "subtitle":"Nuestras acciones retroalimentan cómo nos sentimos. ¿Qué sueles hacer cuando la tristeza te abruma?",
    "less":{"title":"Aislamiento y Evitación","body":"Quedarnos en cama o cancelar planes trae un alivio inmediato a la ansiedad o tristeza. Pero a largo plazo, nos desconecta de las cosas que nos dan placer o sentido de logro, hundiendo más nuestro estado de ánimo y reforzando los síntomas."},
    "more":{"title":"Sobreexigencia y Distracción","body":"Llenar la agenda o exigirnos ser productivos puede tapar el malestar un rato. Pero la falta de descanso y de actividades significativas nos lleva al burnout y a sentirnos vacíos."}
  }'::jsonb,
  '{
    "title":"El Plan Clínico",
    "steps":["1. Elegirás tus valores y metas.","2. Iniciaremos un calendario de Dominio y Agrado.","3. Armaremos una Escalera de Acción (paso a paso)."],
    "designed_for":["Sientes que no disfrutas las cosas tanto como antes.","Dejaste de hacer actividades que te importaban.","Notas una tristeza constante que te frena."]
  }'::jsonb,
  '[
    {"key":"vinculos","emoji":"❤️","title":"Relaciones y Vínculos","subtitle":"Familia, pareja, amistades"},
    {"key":"trabajo","emoji":"💼","title":"Trabajo y Educación","subtitle":"Desarrollo, estudios, metas"},
    {"key":"ocio","emoji":"🎨","title":"Ocio y Recreación","subtitle":"Hobbies, tiempo libre, diversión"},
    {"key":"salud","emoji":"🌿","title":"Salud y Autocuidado","subtitle":"Cuerpo, descanso, alimentación"}
  ]'::jsonb,
  '[
    {"text":"Paso inicial muy fácil","suds":2},
    {"text":"Pequeño paso de calentamiento","suds":3},
    {"text":"Acción concreta y breve","suds":4},
    {"text":"Acción intermedia","suds":5},
    {"text":"Acción que te empuja un poco","suds":6},
    {"text":"Casi la meta","suds":8},
    {"text":"La meta completa","suds":9}
  ]'::jsonb,
  '[
    {"label":"No tenía ganas","response":"Recordá: la motivación aparece DESPUÉS de actuar, no antes. Probá hacer la versión más pequeña posible mañana."},
    {"label":"Me sentí abrumado/a","response":"Está perfecto bajar un escalón. Volvé al paso anterior de la escalera y consolidalo."},
    {"label":"Surgió algo urgente","response":"Reagendá hoy mismo para mañana a una hora específica. Si no lo agendás, no existe."},
    {"label":"Me distraje","response":"Ponete una alarma 10 minutos antes. La estructura externa reemplaza la motivación que falta."}
  ]'::jsonb,
  '{
    "2":"Día 2: hoy vas por el paso inicial. Empezar es lo más importante.",
    "3":"Día 3: ya tenés impulso. Confiá en el proceso.",
    "4":"Día 4: estás a mitad de camino. El cuerpo empieza a recordar.",
    "5":"Día 5: cada acción cambia tu química cerebral.",
    "6":"Día 6: casi llegás. La meta está cerca.",
    "7":"Día 7: hoy la meta completa. Sos capaz."
  }'::jsonb
);
