-- Enum for tool types
CREATE TYPE public.tool_type AS ENUM ('breathing', 'grounding', 'mindfulness_timer', 'selfcare_list', 'content_link', 'custom');

-- Resource categories
CREATE TABLE public.resource_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT 'Sparkles',
  color TEXT NOT NULL DEFAULT 'muted',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Resource tools
CREATE TABLE public.resource_tools (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category_id UUID NOT NULL REFERENCES public.resource_categories(id) ON DELETE CASCADE,
  slug TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  tool_type public.tool_type NOT NULL DEFAULT 'custom',
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (category_id, slug)
);

-- RLS
ALTER TABLE public.resource_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_tools ENABLE ROW LEVEL SECURITY;

-- Public read for published
CREATE POLICY "Anyone can view published categories" ON public.resource_categories
  FOR SELECT USING (is_published = true);
CREATE POLICY "Anyone can view published tools" ON public.resource_tools
  FOR SELECT USING (is_published = true);

-- Admin full access
CREATE POLICY "Admins manage categories" ON public.resource_categories
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins manage tools" ON public.resource_tools
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Updated_at triggers
CREATE TRIGGER trg_resource_categories_updated_at
  BEFORE UPDATE ON public.resource_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_resource_tools_updated_at
  BEFORE UPDATE ON public.resource_tools
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Seed categories
INSERT INTO public.resource_categories (slug, name, description, icon, color, sort_order) VALUES
  ('respiracion', 'Respiración', 'Ejercicios guiados para regular el sistema nervioso', 'Wind', 'accent', 1),
  ('mindfulness', 'Mindfulness', 'Pausas para volver al presente', 'Flower2', 'primary', 2),
  ('grounding', 'Grounding', 'Técnicas para anclarte al aquí y ahora', 'Hand', 'secondary', 3),
  ('autocuidado', 'Autocuidado', 'Pequeñas acciones que te hacen bien', 'Leaf', 'success', 4),
  ('psicoeducacion', 'Psicoeducación', 'Videos, audios y lecturas', 'BookOpen', 'muted', 5);

-- Seed tools
WITH cats AS (SELECT id, slug FROM public.resource_categories)
INSERT INTO public.resource_tools (category_id, slug, name, description, tool_type, config, sort_order)
SELECT c.id, t.slug, t.name, t.description, t.tool_type::public.tool_type, t.config::jsonb, t.sort_order FROM cats c
JOIN (VALUES
  ('respiracion', '4-7-8', '4-7-8 Relajante', 'Inhalá 4, sostené 7, exhalá 8', 'breathing', '{"inhale":4,"hold":7,"exhale":8,"holdAfter":0}', 1),
  ('respiracion', 'box-breathing', 'Box Breathing', 'Cuadrado: 4-4-4-4', 'breathing', '{"inhale":4,"hold":4,"exhale":4,"holdAfter":4}', 2),
  ('respiracion', 'coherencia', 'Coherencia Cardíaca', 'Inhalá 5, exhalá 5', 'breathing', '{"inhale":5,"hold":0,"exhale":5,"holdAfter":0}', 3),
  ('mindfulness', 'timer', 'Temporizador Mindful', 'Sesiones cortas guiadas', 'mindfulness_timer', '{"durations":[{"label":"3 min","seconds":180},{"label":"5 min","seconds":300},{"label":"10 min","seconds":600},{"label":"15 min","seconds":900}]}', 1),
  ('grounding', '5-4-3-2-1', '5-4-3-2-1 Sentidos', 'Recorré tus sentidos', 'grounding', '{"steps":[{"count":5,"sense":"ver","placeholder":"Cosas que ves"},{"count":4,"sense":"tocar","placeholder":"Cosas que podés tocar"},{"count":3,"sense":"oír","placeholder":"Sonidos que escuchás"},{"count":2,"sense":"oler","placeholder":"Aromas"},{"count":1,"sense":"saborear","placeholder":"Un sabor"}]}', 1),
  ('autocuidado', 'sugerencias', 'Sugerencias diarias', 'Lista de pequeñas acciones', 'selfcare_list', '{"suggestions":["Tomá un vaso de agua","Salí a caminar 5 minutos","Mandale un mensaje a alguien que querés","Estirá el cuerpo","Apagá pantallas 10 minutos"]}', 1),
  ('psicoeducacion', 'biblioteca', 'Biblioteca', 'Acceso a contenidos', 'content_link', '{"url":"/herramientas/contenido"}', 1)
) AS t(cat_slug, slug, name, description, tool_type, config, sort_order) ON c.slug = t.cat_slug;