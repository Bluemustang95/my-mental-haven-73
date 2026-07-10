ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS emotion_shift_note text,
  ADD COLUMN IF NOT EXISTS emotion_shift_summary jsonb;

COMMENT ON COLUMN public.daily_checkins.emotion_shift_note IS 'Reflexión libre sobre qué generó el cambio emocional entre mañana y noche.';
COMMENT ON COLUMN public.daily_checkins.emotion_shift_summary IS 'Resumen jsonb: {sostenidas:[], sumadas:[], disueltas:[]}';