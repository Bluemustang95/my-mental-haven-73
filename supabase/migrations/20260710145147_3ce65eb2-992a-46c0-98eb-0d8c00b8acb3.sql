
-- Onboarding algo config (single row) + admin RPCs
CREATE TABLE IF NOT EXISTS public.algo_onboarding_config (
  id integer PRIMARY KEY DEFAULT 1,
  algo_version integer NOT NULL DEFAULT 1,
  weights jsonb NOT NULL DEFAULT '{}'::jsonb,
  category_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid,
  CONSTRAINT algo_config_singleton CHECK (id = 1)
);

GRANT SELECT ON public.algo_onboarding_config TO anon, authenticated;
GRANT ALL ON public.algo_onboarding_config TO service_role;
ALTER TABLE public.algo_onboarding_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read algo config"
  ON public.algo_onboarding_config FOR SELECT
  USING (true);

CREATE POLICY "Only admins can modify algo config"
  ON public.algo_onboarding_config FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.algo_onboarding_config (id, weights, category_content)
VALUES (1, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- Audit log for config changes
CREATE OR REPLACE FUNCTION public.algo_config_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS algo_config_touch_tg ON public.algo_onboarding_config;
CREATE TRIGGER algo_config_touch_tg
  BEFORE UPDATE ON public.algo_onboarding_config
  FOR EACH ROW EXECUTE FUNCTION public.algo_config_touch();

-- Admin RPC: reset plan (client will re-run algorithm and save)
CREATE OR REPLACE FUNCTION public.admin_reset_plan(_user_id uuid, _reason text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.patient_app_profiles
  SET plan_category = NULL,
      top3_tools = NULL,
      home_seeded = false,
      updated_at = now()
  WHERE user_id = _user_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, reason, payload)
  VALUES (auth.uid(), 'reset_plan', _user_id, _reason, '{}'::jsonb);
END;
$$;

-- Admin RPC: onboarding metrics
CREATE OR REPLACE FUNCTION public.admin_onboarding_metrics()
RETURNS jsonb
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  SELECT jsonb_build_object(
    'total_completed', (SELECT count(*) FROM public.patient_app_profiles WHERE onboarding_completed = true),
    'total_in_progress', (SELECT count(*) FROM public.patient_app_profiles WHERE onboarding_completed IS NOT TRUE),
    'by_category', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('category', c, 'count', n) ORDER BY n DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(plan_category, 'sin_asignar') AS c, count(*) AS n
        FROM public.patient_app_profiles
        WHERE onboarding_completed = true
        GROUP BY 1
      ) s
    ),
    'by_priority_module', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('module', m, 'count', n) ORDER BY n DESC), '[]'::jsonb)
      FROM (
        SELECT COALESCE(priority_module, 'sin_asignar') AS m, count(*) AS n
        FROM public.patient_app_profiles
        WHERE onboarding_completed = true
        GROUP BY 1
      ) s
    ),
    'by_algo_version', (
      SELECT COALESCE(jsonb_agg(jsonb_build_object('version', v, 'count', n) ORDER BY v), '[]'::jsonb)
      FROM (
        SELECT COALESCE(algo_version, 0) AS v, count(*) AS n
        FROM public.patient_app_profiles
        WHERE onboarding_completed = true
        GROUP BY 1
      ) s
    ),
    'completion_rate_30d', (
      SELECT ROUND(
        100.0 * count(*) FILTER (WHERE onboarding_completed = true) / NULLIF(count(*), 0),
        1
      )
      FROM public.patient_app_profiles
      WHERE created_at >= now() - interval '30 days'
    )
  ) INTO result;

  RETURN result;
END;
$$;

-- Admin RPC: save config (audit)
CREATE OR REPLACE FUNCTION public.admin_save_algo_config(_weights jsonb, _category_content jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  UPDATE public.algo_onboarding_config
  SET weights = COALESCE(_weights, weights),
      category_content = COALESCE(_category_content, category_content)
  WHERE id = 1;

  INSERT INTO public.admin_audit_log (admin_id, action, target_user_id, payload)
  VALUES (auth.uid(), 'save_algo_config', NULL,
    jsonb_build_object('weights_keys', (SELECT COALESCE(jsonb_object_keys(_weights), NULL)),
                       'has_content', _category_content IS NOT NULL));
END;
$$;
