

## Pestaña "Recursos" en /admin — CMS de recursos y herramientas

Crear un módulo administrativo que sea el puente entre el backend y la pestaña "Recursos" del front. Cada **Recurso** (Respiración, Mindfulness, Grounding, Autocuidado, Psicoeducación) agrupa **Herramientas** (ej: 4-7-8, Box Breathing, Coherencia). Cada herramienta es independiente y editable.

### 1. Modelo de datos (nuevas tablas)

**`resource_categories`** — los 5 recursos (bento grid)
- `id` (uuid), `slug` (text único: `respiracion`, `mindfulness`, `grounding`, `autocuidado`, `psicoeducacion`)
- `name`, `description`, `icon` (nombre lucide), `color` (hex/token bento), `sort_order`, `is_published`, timestamps

**`resource_tools`** — herramientas dentro de cada recurso
- `id`, `category_id` (FK → resource_categories), `slug` (único por categoría)
- `name`, `description`, `sort_order`, `is_published`
- `tool_type` (enum: `breathing`, `grounding`, `mindfulness_timer`, `selfcare_list`, `content_link`, `custom`)
- `config` (jsonb) — parámetros propios de cada motor:
  - breathing → `{ inhale, hold, exhale, holdAfter }`
  - mindfulness_timer → `{ durations: [{label, seconds}] }`
  - grounding → `{ steps: [{count, sense, placeholder}] }`
  - selfcare_list → `{ suggestions: [...] }`
  - content_link → `{ url, content_id }`
- timestamps

**RLS**: público puede `SELECT` donde `is_published = true`; admins (vía `has_role`) pueden full CRUD.

**Seed inicial**: precargar los recursos y herramientas existentes (Respiración: 4-7-8, Box Breathing, Coherencia; Mindfulness: timer 3/5/10/15 min; Grounding: 5-4-3-2-1; Autocuidado: lista; Psicoeducación: enlace a biblioteca). Recursos extra del front (categorías nuevas) quedan vacíos para que el admin los pueble.

### 2. UI del Admin (`/admin/recursos`)

Nuevo item en sidebar `AdminLayout` ("Recursos", icono `Sparkles`).

**Página principal `ResourcesManager.tsx`** — bento grid de 5 tarjetas (una por recurso), cada una con su color distintivo y badge contando herramientas. Botón "Nueva categoría" arriba a la derecha.

```text
┌──────────────────────┬─────────────┐
│ Respiración (azul)   │ Mindfulness │
│ 3 herramientas       │ 1 herram.   │
├──────────────────────┼─────────────┤
│ Grounding (verde)    │ Autocuidado │
├──────────────────────┴─────────────┤
│ Psicoeducación (slate) — completa  │
└────────────────────────────────────┘
```

Tap en una tarjeta → `/admin/recursos/:slug` (detalle).

**Página detalle `ResourceDetail.tsx`** — header con el color del recurso, formulario para editar metadatos de la categoría (nombre, descripción, icono, color, publicado), y debajo la lista de **Herramientas** en grid del mismo color. Cada tarjeta de herramienta muestra nombre + tipo + estado, con acciones editar/eliminar/publicar. Botón "Nueva herramienta".

**Editor de herramienta `ToolEditor.tsx`** (Dialog) — campos comunes (nombre, slug, descripción, orden, publicado) + un sub-formulario dinámico según `tool_type`:
- breathing → 4 inputs numéricos
- mindfulness_timer → lista editable de duraciones
- grounding → lista editable de pasos
- selfcare_list → textarea de sugerencias (una por línea)
- content_link → URL o selector de psychoeducation_content
- custom → textarea JSON libre

### 3. Conexión con el front

Refactor de `src/pages/Tools.tsx`: en lugar de hardcodear las 5 tarjetas, leer `resource_categories` (publicadas, ordenadas) y renderizar el bento usando `color`/`icon` de la DB. Cada tarjeta navega a `/herramientas/:slug`.

Nueva página `ResourceTools.tsx` (`/herramientas/:slug`) que lista las herramientas publicadas del recurso. Tap en una herramienta navega a su runner.

Refactor de runners existentes (`Breathing`, `Mindfulness`, `Grounding`, `SelfCare`) para aceptar `?tool=<slug>` y leer su `config` desde la DB en lugar de constantes hardcodeadas. Si no hay parámetro, fallback a defaults actuales (no rompe nada).

### 4. Rutas nuevas

```
/admin/recursos                 → ResourcesManager
/admin/recursos/:slug           → ResourceDetail
/herramientas/:slug             → ResourceTools (lista herramientas)
/herramientas/:slug/:toolSlug   → runner correspondiente
```

### 5. Detalles técnicos

- Colores bento sugeridos (tokens HSL semánticos en `index.css` para mantener identidad RESMA): respiracion=`accent`, mindfulness=`primary/10`, grounding=`secondary`, autocuidado=`success/10`, psicoeducacion=`muted`. El admin puede sobreescribir vía campo `color`.
- Migración crea las 2 tablas + enum `tool_type` + RLS + seed.
- Tipo `Database` se regenera automáticamente; `ToolEditor` usa `config: Json`.
- Voseo argentino en toda la UI admin ("Editá", "Creá una herramienta nueva").

### 6. Archivos a crear/editar

**Nuevos**: `src/pages/admin/ResourcesManager.tsx`, `src/pages/admin/ResourceDetail.tsx`, `src/pages/admin/ToolEditor.tsx`, `src/pages/ResourceTools.tsx`, migración SQL.

**Editados**: `src/components/admin/AdminLayout.tsx` (nuevo nav item), `src/App.tsx` (rutas), `src/pages/Tools.tsx` (lectura desde DB), `src/pages/Breathing.tsx` + `Mindfulness.tsx` + `Grounding.tsx` + `SelfCare.tsx` (aceptar config dinámico).

