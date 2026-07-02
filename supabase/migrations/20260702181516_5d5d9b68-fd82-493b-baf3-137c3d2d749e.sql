ALTER TABLE public.mindfulness_scripts_v2 DROP CONSTRAINT IF EXISTS mindfulness_scripts_v2_exercise_id_minutes_version_key;
ALTER TABLE public.mindfulness_scripts_v2 ALTER COLUMN country_code SET DEFAULT 'default';
UPDATE public.mindfulness_scripts_v2 SET country_code = 'default' WHERE country_code IS NULL;
ALTER TABLE public.mindfulness_scripts_v2 ALTER COLUMN country_code SET NOT NULL;
ALTER TABLE public.mindfulness_scripts_v2 ADD CONSTRAINT mindfulness_scripts_v2_ex_min_country_version_key UNIQUE (exercise_id, minutes, country_code, version);