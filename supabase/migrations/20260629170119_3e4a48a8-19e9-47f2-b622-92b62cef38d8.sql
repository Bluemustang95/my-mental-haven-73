
-- journal-attachments: owner-only access by user_id folder
CREATE POLICY "Users read own journal attachments" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'journal-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users insert own journal attachments" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'journal-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users update own journal attachments" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'journal-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own journal attachments" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'journal-attachments' AND (storage.foldername(name))[1] = auth.uid()::text);

-- voice-notes bucket may not have policies yet — add same per-user scoping
CREATE POLICY "Users read own voice notes" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users insert own voice notes" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users delete own voice notes" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'voice-notes' AND (storage.foldername(name))[1] = auth.uid()::text);
