## Plan: Home minimalista, historial diario y rediseño de Psicoeducación

### 1. Home más minimalista (`src/pages/Dashboard.tsx`)
- Reducir tamaños tipográficos del header: saludo `text-2xl` → `text-lg font-medium`, fecha/subtítulo `text-xs uppercase tracking-wider text-muted-foreground/70`.
- Quitar pesos `font-bold` excesivos; usar `font-display` solo en el nombre.
- Padding vertical más compacto (`pt-8 pb-4` en lugar de `pt-14`).
- Tarjetas de timeline: títulos `text-sm`, descripciones `text-xs`, iconos 18px.
- WeekStrip ya minimal, mantener.

### 2. Calendario muestra todo lo completado
- `src/lib/calendarActivity.ts` ya agrega journals, thoughts, tests, ejercicios, dreams, check-ins, goals, body-map. Agregar:
  - Lecturas de psicoeducación → `content_progress` (filtro `completed=true`).
  - Resultados Big Five / BDI / BAI / PSWQ → ya cubierto por `test_results` (etiqueta amigable por `kind`/`test_type`).
  - Valoración nocturna de objetivos → leer `daily_checkins.goal_completed` y añadir entrada "Valoración objetivo: cumplido/parcial/no".
  - Sesiones de psicoeducación destacada (video reproducido).
- En `CalendarDay.tsx` agrupar por tipo con icono y horario; ya existe — solo enriquecer labels.

### 3. Historial en Configuración (`src/pages/Settings.tsx`)
- Nueva sección "Historial" con link a nueva ruta `/ajustes/historial` (`src/pages/SettingsHistory.tsx`).
- Pantalla full-screen con lista agrupada por día (descendente), reusando `fetchCalendarActivities` iterando últimos 30 días.
- Cada día = card colapsable con conteo y lista de actividades (check-ins, tests con score, personalidad, lecturas, ejercicios, objetivos cumplidos).
- Filtro por tipo (chips: Todo / Tests / Lecturas / Check-ins / Objetivos).

### 4. Rediseño Psicoeducación (`src/pages/Psicoeducacion.tsx`)
Reemplazar el `PsychoModal` actual por una pantalla propia:

**Header**
- Título "Psicoeducación" en `font-serif text-4xl`.
- Subtítulo `text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground`: "APRENDE Y COMPRENDE".

**Botón nav central** (`src/components/layout/BottomNav.tsx`)
- Ya sobresale; cambiar fondo a `bg-gradient-to-br from-[hsl(28_95%_65%)] to-[hsl(40_100%_88%)]` cuando activo; icono `BookOpen` se mantiene. Estado inactivo: gradiente más suave.

**Módulo destacado (Video)**
- `GlassCard` ancha, `p-0`, `overflow-hidden`.
- Miniatura 16:9 con `bg-gradient-to-br from-slate-800 to-slate-600` + imagen difuminada opcional, botón Play central translúcido (`bg-white/20 backdrop-blur rounded-full p-4`).
- Cápsula flotante abajo-izquierda: `Video · 3 min`.
- Bajo la miniatura: título `font-display text-lg`, descripción `text-sm text-muted-foreground`.

**Artículos recomendados**
- Subtítulo `font-display text-base font-semibold`.
- Lista de `GlassCard` horizontales: icono 44×44 en cuadro `rounded-2xl` con fondo pastel por categoría (celeste, verde, durazno, lavanda). Título bold + descripción truncada `line-clamp-2`.

**Data driven**
- Definir tipo `PsychoItem = { id; type: 'video'|'article'; title; description; duration?; icon; pastelBg; contentUrl }`.
- Render desde `psychoeducation_content` (tabla ya existente): el primero con `is_featured=true` (nueva columna) o `content_type='video'` se muestra como destacado; el resto como artículos.
- Si no hay flag, usar el `sort_order` más bajo con `content_type='video'`.

### 5. Migración
- Agregar columna `is_featured boolean default false` a `psychoeducation_content` para marcar el destacado desde admin.
- No requiere nuevas tablas.

### Archivos
**Crear**: `src/pages/SettingsHistory.tsx`, `src/components/psico/FeaturedVideoCard.tsx`, `src/components/psico/ArticleCard.tsx`.
**Editar**: `src/pages/Dashboard.tsx`, `src/pages/Psicoeducacion.tsx`, `src/pages/Settings.tsx`, `src/App.tsx` (ruta historial), `src/components/layout/BottomNav.tsx` (gradiente), `src/lib/calendarActivity.ts` (lecturas + valoración objetivo).
**Migración**: columna `is_featured` en `psychoeducation_content`.

### Fuera de alcance
- Reproductor de video real (se abre `content_url` en pestaña nueva).
- Editor admin del flag `is_featured` (queda listo en DB; UI admin se hace en otra iteración si lo pedís).
