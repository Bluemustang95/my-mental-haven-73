
# Módulo de Psicoeducación Avanzado

Reestructura el módulo en dos entidades: **Categorías** (cursos) y **Contenidos** (lecciones dentro de cada categoría), con tres formatos: video, texto enriquecido y podcast de Spotify. Incluye CMS en Admin y UI rediseñada en cliente.

## 1. Base de datos (migración)

### Nueva tabla `psychoeducation_categories`
- `id` uuid PK
- `title` text (ej: "Conceptos básicos")
- `description` text
- `emoji` text (ej: "🏔️") — para el ícono visible en las cards del cliente
- `accent_color` text (hex, ej: "#A78BFA") — color de barra/fondo de la card
- `sort_order` int default 0
- `is_published` boolean default true
- `created_at`, `updated_at`
- RLS: lectura pública si `is_published=true`; admin CRUD vía `has_role(auth.uid(),'admin')`
- GRANTs: `SELECT` a `anon` + `authenticated`; `ALL` a `service_role` y `authenticated` (filtrado por policy)

### Extender `psychoeducation_content`
- Agregar `category_id` uuid FK → `psychoeducation_categories(id) ON DELETE SET NULL` (nullable para retro-compat)
- Agregar `body_html` text — solo para `content_type='text'`
- Agregar `media_url` text — alias semántico nuevo (se mantiene `content_url` para no romper; lógica lee `media_url ?? content_url`)
- Agregar `duration_minutes` int (numérico, además del actual `duration` libre)
- Ampliar valores de `content_type` a: `video | text | podcast` (más legacy `audio | pdf`)
- Backfill: filas con `content_type='pdf'` → opcionalmente marcar `text`; el campo `category` (texto) sigue existiendo, no se borra.

## 2. Panel Admin (`/admin/contenido`)

### Tabs principales
Reemplaza el header con tabs: **Categorías · Videos · Textos · Podcasts**.

### Categorías
Nueva tabla CRUD (`CategoriesManager`): título, descripción, emoji, color, orden, publicado.

### Contenidos (Videos / Textos / Podcasts)
Una sola tabla, filtrada por `content_type` según la tab activa. Modal dinámico:

- Campos comunes: título, descripción, **categoría** (select de `psychoeducation_categories`), duración (min), thumbnail, premium, publicado, orden.
- **Video**: input `media_url` (MP4 / YouTube).
- **Texto**: editor enriquecido (**TipTap** con extensiones `StarterKit`, `Underline`, `Link`, `TextStyle`, `Color`, `Highlight`, `BulletList`, `OrderedList`). Toolbar con: B / I / U / listas / link / color de texto / highlight. Guarda HTML en `body_html`.
- **Podcast**: input "Enlace de Spotify". Live preview con iframe usando `url.replace('episode/', 'embed/episode/')`.

Dependencias nuevas: `@tiptap/react @tiptap/starter-kit @tiptap/extension-underline @tiptap/extension-link @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-highlight`.

## 3. App de Usuario

### `Psicoeducacion.tsx` (rediseño dark, como mockups)
- Fondo oscuro (`bg-[#0B0B10]`), título serif "Psicoeducación", chip "APRENDE Y COMPRENDE".
- **Featured card**: el primer video publicado (mismo estilo actual: gradiente + play, badge `VIDEO · X MIN`).
- **Sección "Seguir conociendo"**: lista de **categorías** desde `psychoeducation_categories`. Cada card: título, descripción, emoji a la derecha, barra de progreso (basada en `content_progress` de los items de la categoría), color de fondo según `accent_color`.
- **Sección "Podcasts"**: lista plana de contenidos `podcast` (título + duración + botón play que abre detalle con iframe).

### Nueva ruta `/herramientas/contenido/categoria/:id` (`CategoryDetail.tsx`)
- Header con back, emoji grande y título/descr de la categoría.
- Lista de lecciones con icono según tipo (Libro=text, Cámara=video, Auriculares=podcast), label en mayúscula ("LECTURA", "VIDEO", "PODCAST"), título, duración con ícono reloj.

### Nueva ruta `/herramientas/contenido/leccion/:id` (`LessonView.tsx`)
- Header con back + breadcrumb (nombre categoría).
- Render según `content_type`:
  - `video`: reproductor existente / `<video>` o iframe YouTube.
  - `text`: `<div className="prose prose-invert prose-slate max-w-none">` con `dangerouslySetInnerHTML={{ __html: body_html }}`.
  - `podcast`: iframe Spotify (`media_url.replace('episode/','embed/episode/')`, height 352, rounded-12).
- Botón fijo abajo "Entendido, continuar" → marca `content_progress.completed = true` y vuelve a la categoría.

Tipografía `prose`: agregar `@tailwindcss/typography` al `tailwind.config.ts` si no está.

## 4. Seguridad / RLS resumen

| Tabla | anon SELECT | auth INSERT/UPDATE/DELETE |
|---|---|---|
| psychoeducation_categories | sí (is_published) | solo admin |
| psychoeducation_content | sí (is_published) — ya existe | solo admin — ya existe |

## Fuera de alcance
- No se integra Spotify OAuth ni se valida que el enlace exista.
- No se migra el contenido viejo de `category` (texto) a `category_id` automáticamente; el admin lo reasigna desde el panel (queda visible en lista hasta que se le asocie categoría).
- No se cambia `ContentLibrary.tsx` (vista alternativa); se mantiene como está.
