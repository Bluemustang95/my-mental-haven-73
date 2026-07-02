
CREATE TABLE public.ambient_audio_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sound_id text NOT NULL UNIQUE,
  label text NOT NULL,
  category text NOT NULL,
  storage_path text NOT NULL,
  duration_seconds integer,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.ambient_audio_overrides TO authenticated;
GRANT ALL ON public.ambient_audio_overrides TO service_role;

ALTER TABLE public.ambient_audio_overrides ENABLE ROW LEVEL SECURITY;

CREATE POLICY "authenticated can read active overrides"
  ON public.ambient_audio_overrides FOR SELECT
  TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin can insert overrides"
  ON public.ambient_audio_overrides FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin can update overrides"
  ON public.ambient_audio_overrides FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "admin can delete overrides"
  ON public.ambient_audio_overrides FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER trg_ambient_audio_overrides_updated_at
  BEFORE UPDATE ON public.ambient_audio_overrides
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
