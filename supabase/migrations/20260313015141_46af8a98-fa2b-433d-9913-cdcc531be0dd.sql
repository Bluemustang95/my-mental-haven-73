
ALTER TABLE public.day_timeline_entries ADD CONSTRAINT day_timeline_unique_period UNIQUE (user_id, entry_date, period);
