
CREATE TABLE public.diary_chips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('emotion','cause')),
  name text NOT NULL,
  icon text,
  image_url text,
  is_primary boolean NOT NULL DEFAULT false,
  active boolean NOT NULL DEFAULT true,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.diary_chips TO authenticated;
GRANT ALL ON public.diary_chips TO service_role;

ALTER TABLE public.diary_chips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "read chips" ON public.diary_chips
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "admin manage chips" ON public.diary_chips
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TRIGGER trg_diary_chips_updated
  BEFORE UPDATE ON public.diary_chips
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed emotions (primary)
INSERT INTO public.diary_chips (kind,name,icon,is_primary,sort_order) VALUES
  ('emotion','Calma','🧘',true,1),
  ('emotion','Alegría','☀️',true,2),
  ('emotion','Tristeza','🌧️',true,3),
  ('emotion','Ansiedad','⚡',true,4),
  ('emotion','Enojo','🔥',true,5),
  ('emotion','Agotamiento','🛌',true,6),
  ('emotion','Amor','💗',false,7),
  ('emotion','Gratitud','🙏',false,8),
  ('emotion','Culpa','😔',false,9),
  ('emotion','Vergüenza','🫣',false,10),
  ('emotion','Miedo','😨',false,11),
  ('emotion','Frustración','😤',false,12),
  ('emotion','Esperanza','🌈',false,13),
  ('emotion','Orgullo','🦁',false,14),
  ('emotion','Nostalgia','🍂',false,15),
  ('emotion','Confusión','🌀',false,16),
  ('emotion','Envidia','🥴',false,17),
  ('emotion','Aburrimiento','🥱',false,18);

INSERT INTO public.diary_chips (kind,name,icon,is_primary,sort_order) VALUES
  ('cause','Trabajo','🏢',true,1),
  ('cause','Pareja','❤️',true,2),
  ('cause','Salud','🍎',true,3),
  ('cause','Finanzas','💵',true,4),
  ('cause','Sueño','💤',true,5),
  ('cause','Familia','🏡',false,6),
  ('cause','Amistades','🤝',false,7),
  ('cause','Estudios','📚',false,8),
  ('cause','Hijes','🧸',false,9),
  ('cause','Cuerpo','💪',false,10),
  ('cause','Redes','📱',false,11),
  ('cause','Duelo','🕊️',false,12),
  ('cause','Mudanza','📦',false,13),
  ('cause','Rutina','🔁',false,14);
