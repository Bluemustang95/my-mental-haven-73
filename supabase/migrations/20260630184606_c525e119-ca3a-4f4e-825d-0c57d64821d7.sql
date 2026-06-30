INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role FROM auth.users
WHERE lower(email) = 'redsaludmentalarg@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

INSERT INTO public.patient_app_profiles (user_id, plan, plan_started_at, plan_expires_at)
SELECT id, 'premium', now(), NULL FROM auth.users
WHERE lower(email) = 'redsaludmentalarg@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET plan = 'premium', plan_expires_at = NULL;