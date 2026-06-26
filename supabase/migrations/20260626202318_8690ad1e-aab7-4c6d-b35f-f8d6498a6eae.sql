
-- Admin key/value settings (one row per config key)
CREATE TABLE public.admin_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.admin_settings TO authenticated;
GRANT ALL ON public.admin_settings TO service_role;
ALTER TABLE public.admin_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage settings" ON public.admin_settings
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read settings" ON public.admin_settings
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE TRIGGER admin_settings_touch BEFORE UPDATE ON public.admin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Notification rules
CREATE TABLE public.notification_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL,
  trigger_key text NOT NULL,
  enabled boolean NOT NULL DEFAULT true,
  condition_text text,
  copy_text text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(category, trigger_key)
);
GRANT SELECT ON public.notification_rules TO authenticated;
GRANT ALL ON public.notification_rules TO service_role;
ALTER TABLE public.notification_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage notification rules" ON public.notification_rules
  FOR ALL USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Authenticated read notification rules" ON public.notification_rules
  FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE TRIGGER notification_rules_touch BEFORE UPDATE ON public.notification_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
