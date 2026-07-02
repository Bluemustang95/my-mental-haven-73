
CREATE POLICY "read mindfulness audio" ON storage.objects FOR SELECT USING (bucket_id = 'mindfulness-audio');
CREATE POLICY "admin write mindfulness audio" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'mindfulness-audio' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin update mindfulness audio" ON storage.objects FOR UPDATE USING (bucket_id = 'mindfulness-audio' AND public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admin delete mindfulness audio" ON storage.objects FOR DELETE USING (bucket_id = 'mindfulness-audio' AND public.has_role(auth.uid(), 'admin'));
