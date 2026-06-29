
ALTER TABLE public.sleep_hygiene_audits
  ADD CONSTRAINT sleep_hygiene_audits_user_date_unique UNIQUE (user_id, audit_date);
