
-- =============================================================
-- BUG 3: Persistencia Lab de Sueño (mindfulness y DBT ya tienen tablas)
-- =============================================================
CREATE TABLE public.sleep_hygiene_audits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  audit_date date NOT NULL DEFAULT CURRENT_DATE,
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  score integer NOT NULL DEFAULT 0,
  sos_mode text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_hygiene_audits TO authenticated;
GRANT ALL ON public.sleep_hygiene_audits TO service_role;
ALTER TABLE public.sleep_hygiene_audits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own sleep hygiene" ON public.sleep_hygiene_audits
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all sleep hygiene" ON public.sleep_hygiene_audits
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_sleep_hygiene_user_date ON public.sleep_hygiene_audits(user_id, audit_date DESC);

-- =============================================================
-- BUG 5: SafetyPlan en cloud + crisis por país
-- =============================================================
CREATE TABLE public.safety_plans (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  warning_signs jsonb NOT NULL DEFAULT '[]'::jsonb,
  contacts jsonb NOT NULL DEFAULT '[]'::jsonb,
  environment_notes text,
  coping_strategies jsonb NOT NULL DEFAULT '[]'::jsonb,
  reasons_for_living text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.safety_plans TO authenticated;
GRANT ALL ON public.safety_plans TO service_role;
ALTER TABLE public.safety_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own safety plan" ON public.safety_plans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins view all safety plans" ON public.safety_plans
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_safety_plans_updated_at BEFORE UPDATE ON public.safety_plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.crisis_hotlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  country text NOT NULL,
  label text NOT NULL,
  phone text NOT NULL,
  priority integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.crisis_hotlines TO authenticated, anon;
GRANT ALL ON public.crisis_hotlines TO service_role;
ALTER TABLE public.crisis_hotlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Crisis hotlines readable to all" ON public.crisis_hotlines
  FOR SELECT USING (active = true);
CREATE POLICY "Admins manage crisis hotlines" ON public.crisis_hotlines
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));
CREATE INDEX idx_crisis_hotlines_country ON public.crisis_hotlines(country, priority);

-- Seed crisis hotlines (Latam + ES + US)
INSERT INTO public.crisis_hotlines (country, label, phone, priority) VALUES
  ('AR', 'Centro de Asistencia al Suicida', '135', 1),
  ('AR', 'Línea contra la Violencia', '137', 2),
  ('AR', 'Emergencias SAME', '107', 3),
  ('UY', 'Línea Vida', '0800 0767', 1),
  ('UY', 'Emergencia Móvil', '105', 2),
  ('CL', 'Salud Responde', '600 360 7777', 1),
  ('CL', 'Fono Salud Mental', '600 360 7777', 2),
  ('MX', 'SAPTEL', '55 5259 8121', 1),
  ('MX', 'Línea de la Vida', '800 290 0024', 2),
  ('CO', 'Línea de la Vida Bogotá', '106', 1),
  ('CO', 'Línea Nacional', '192 op 4', 2),
  ('PE', 'Línea 113 Salud Mental', '113', 1),
  ('ES', 'Teléfono de la Esperanza', '717 003 717', 1),
  ('ES', 'Línea 024 Atención a la Conducta Suicida', '024', 2),
  ('US', 'Suicide & Crisis Lifeline', '988', 1),
  ('US', 'Emergencias', '911', 2);

-- =============================================================
-- BUG 8: columna attachments en journal_entries + bucket privado
-- =============================================================
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.journal_entries ADD COLUMN IF NOT EXISTS voice_note_path text;

-- =============================================================
-- BUG 9: Persistencia de layout de widgets del Home
-- =============================================================
CREATE TABLE public.home_layouts (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  widgets jsonb NOT NULL DEFAULT '[]'::jsonb,
  groups_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_layouts TO authenticated;
GRANT ALL ON public.home_layouts TO service_role;
ALTER TABLE public.home_layouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own home layout" ON public.home_layouts
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_home_layouts_updated_at BEFORE UPDATE ON public.home_layouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================
-- BUG 4: campos de terapeuta vinculado
-- =============================================================
ALTER TABLE public.patient_app_profiles ADD COLUMN IF NOT EXISTS therapist_name text;
ALTER TABLE public.patient_app_profiles ADD COLUMN IF NOT EXISTS therapist_phone text;
ALTER TABLE public.patient_app_profiles ADD COLUMN IF NOT EXISTS therapist_email text;
ALTER TABLE public.patient_app_profiles ADD COLUMN IF NOT EXISTS therapist_license text;

-- =============================================================
-- BUG 10: Audit log de acciones admin + RPC segura
-- =============================================================
CREATE TABLE public.admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid NOT NULL,
  action text NOT NULL,
  target_user_id uuid,
  reason text,
  payload jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.admin_audit_log TO authenticated;
GRANT ALL ON public.admin_audit_log TO service_role;
ALTER TABLE public.admin_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins view audit log" ON public.admin_audit_log
  FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins insert audit log" ON public.admin_audit_log
  FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin') AND admin_id = auth.uid());
CREATE INDEX idx_admin_audit_created ON public.admin_audit_log(created_at DESC);
CREATE INDEX idx_admin_audit_target ON public.admin_audit_log(target_user_id, created_at DESC);

-- Wrap admin_set_plan to add reason + audit
CREATE OR REPLACE FUNCTION public.admin_set_plan(
  _user_id uuid,
  _plan text,
  _expires_at timestamptz,
  _reason text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _old_plan text;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT plan INTO _old_plan FROM public.patient_app_profiles WHERE user_id = _user_id;

  UPDATE public.patient_app_profiles
  SET plan = _plan,
      plan_started_at = CASE WHEN _plan = 'premium' THEN COALESCE(plan_started_at, now()) ELSE NULL END,
      plan_expires_at = _expires_at,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, reason, payload)
  VALUES (
    auth.uid(),
    'set_plan',
    _user_id,
    _reason,
    jsonb_build_object('from', _old_plan, 'to', _plan, 'expires_at', _expires_at)
  );
END;
$$;

-- Wrap admin_set_admin_role with audit
CREATE OR REPLACE FUNCTION public.admin_set_admin_role(_user_id uuid, _is_admin boolean)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF _is_admin THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (_user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    DELETE FROM public.user_roles WHERE user_id = _user_id AND role = 'admin';
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, payload)
  VALUES (
    auth.uid(),
    CASE WHEN _is_admin THEN 'grant_admin' ELSE 'revoke_admin' END,
    _user_id,
    jsonb_build_object('is_admin', _is_admin)
  );
END;
$$;

-- RPC segura para que admin lea perfil sin tocar la tabla directo
CREATE OR REPLACE FUNCTION public.admin_get_patient(_user_id uuid)
RETURNS SETOF public.patient_app_profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;
  RETURN QUERY SELECT * FROM public.patient_app_profiles WHERE user_id = _user_id;
END;
$$;
