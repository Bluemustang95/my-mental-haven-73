
CREATE POLICY "authenticated read ambient-audio"
  ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'ambient-audio');

CREATE POLICY "admin insert ambient-audio"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'ambient-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin update ambient-audio"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'ambient-audio' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin delete ambient-audio"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'ambient-audio' AND public.has_role(auth.uid(), 'admin'));
