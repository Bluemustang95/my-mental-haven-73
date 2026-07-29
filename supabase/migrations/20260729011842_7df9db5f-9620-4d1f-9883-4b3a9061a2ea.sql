CREATE POLICY "Users can delete own test-seed checkins"
ON public.daily_checkins
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND is_test_seed = true);