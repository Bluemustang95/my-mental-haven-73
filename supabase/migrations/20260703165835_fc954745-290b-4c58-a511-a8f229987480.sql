
CREATE POLICY "Authenticated can read lottie" ON storage.objects
FOR SELECT TO authenticated
USING (bucket_id = 'lottie-animations');

CREATE POLICY "Admins can insert lottie" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lottie-animations' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update lottie" ON storage.objects
FOR UPDATE TO authenticated
USING (bucket_id = 'lottie-animations' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete lottie" ON storage.objects
FOR DELETE TO authenticated
USING (bucket_id = 'lottie-animations' AND public.has_role(auth.uid(), 'admin'));
