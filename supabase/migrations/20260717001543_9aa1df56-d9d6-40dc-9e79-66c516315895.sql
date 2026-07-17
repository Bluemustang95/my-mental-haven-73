
CREATE TABLE public.habit_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_key text NOT NULL,
  title text NOT NULL,
  description text,
  icon text NOT NULL DEFAULT '✨',
  icon_type text NOT NULL DEFAULT 'emoji',
  color text NOT NULL DEFAULT '#7cc2c8',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.habit_suggestions TO anon, authenticated;
GRANT ALL ON public.habit_suggestions TO service_role;

ALTER TABLE public.habit_suggestions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active habit suggestions"
  ON public.habit_suggestions FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert habit suggestions"
  ON public.habit_suggestions FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update habit suggestions"
  ON public.habit_suggestions FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete habit suggestions"
  ON public.habit_suggestions FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER habit_suggestions_updated_at
  BEFORE UPDATE ON public.habit_suggestions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed a few defaults per DBT category
INSERT INTO public.habit_suggestions (category_key, title, description, icon, color, sort_order) VALUES
  ('salud', 'Tomar 2 L de agua', 'Hidratación básica del día', '💧', '#7cc2c8', 1),
  ('salud', 'Caminar 15 minutos', 'Movimiento suave, sin presión', '🚶', '#22c55e', 2),
  ('salud', 'Dormir 7 horas', 'Higiene de sueño', '🌙', '#a78bfa', 3),
  ('positivo', 'Anotar 1 cosa buena del día', 'Acumular afecto positivo', '✨', '#facb60', 1),
  ('positivo', 'Escuchar una canción que me gusta', 'Placer breve intencional', '🎵', '#f472b6', 2),
  ('maestria', 'Leer 10 minutos', 'Construir maestría', '📖', '#60a5fa', 1),
  ('maestria', 'Practicar algo que me cuesta', 'Sensación de logro', '🎯', '#f97316', 2),
  ('vinculos', 'Mensaje a alguien que quiero', 'Cultivar vínculos', '💌', '#fb7185', 1),
  ('vinculos', 'Agradecer a alguien', 'Refuerzo positivo social', '🙏', '#7cc2c8', 2);
