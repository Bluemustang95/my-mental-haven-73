# Plan: Mi Proceso, Crisis, Widgets y Psicoeducación

## 1. Mi Proceso — reorganizar y agregar vista mensual

**Problema:** La información importante queda debajo del fold. No hay vista mensual del índice.

**Cambios en `src/pages/MiProceso.tsx`:**
- Quitar de la página principal el bloque **"Práctica esta semana"** (min. mindfulness) y el bloque **`<PeriodStats />` (Tu actividad 30 días / 12 meses)**.
- Dejar arriba del fold: título compacto + `WellbeingCardV2` + `PsychometryCarousel` + `BigFiveCard`. Reducir márgenes verticales (`mt-5` → `mt-3`) para que entre más contenido sin scroll.
- Debajo, la sección de Terapia (sin cambios funcionales).

**Cambios en `src/components/proceso/WellbeingAnalysisSheet.tsx`:**
- Agregar un **selector de rango** (Semana / Mes) arriba del sparkline. Semana = 7 días (comportamiento actual). Mes = 30 días agregados en 4 puntos semanales.
- Al final del sheet, integrar:
  - la tarjeta **"Práctica esta semana / mes"** (minutos de mindfulness según rango),
  - el componente **`<PeriodStats />`** (movido desde MiProceso), respetando el rango seleccionado.
- `PeriodStats` acepta un prop opcional `range` para sincronizar con el selector del sheet (default sigue mostrando el toggle interno cuando se usa suelto).

Resultado: al abrir "Índice de Bienestar" el usuario ve **toda la estadística** (semana, mes, pilares, actividad, minutos, comparación) en un solo lugar.

## 2. Crisis — "Plan de seguridad" no navega + agregar acceso desde Recursos

**Problema:** Al tocar "Ver mi plan de seguridad" en el `CrisisSheet` no pasa nada (el sheet se cierra pero `navigate` a veces se pierde por el unmount de framer-motion).

**Cambios en `src/components/CrisisButton.tsx`:**
- Invertir el orden: primero `navigate("/herramientas/plan-seguridad")` y luego `onClose()`, o envolver el `onClose` en `setTimeout(..., 0)` para asegurar que la navegación se dispare antes del unmount.

**Cambios en `src/pages/ResourceTools.tsx` (Recursos → Herramientas):**
- Agregar una **tarjeta destacada "Plan de Seguridad"** con ícono `ShieldCheck`, que navegue a `/herramientas/plan-seguridad`. Ubicada arriba en la grilla para acceso rápido no-crisis.

## 3. Widgets nuevos: Frases del día + Noticias de Psicología

Ambos son **solo widgets** en Home (no ocupan página propia) y se administran desde el panel.

**Base de datos (migración nueva):**
- Tabla `daily_quotes`: `text` (contenido), `author`, `active` (bool), `sort_order`. RLS: lectura pública `authenticated`, escritura solo `admin` (via `has_role`). GRANTs a `authenticated` + `service_role`.
- Tabla `psychology_news`: `title`, `summary`, `url`, `image_url`, `published_at`, `active`. Mismas policies/GRANTs.
- Función SQL `get_daily_quote()` (SECURITY DEFINER) que devuelve una frase activa determinística por día (`ORDER BY hashtext(fecha||id) LIMIT 1`) para que todos vean la misma frase el mismo día.

**Frontend — nuevos widgets:**
- Agregar dos `WidgetId` en `src/components/home/WidgetsBoard.tsx`: `"daily_quote"` y `"psy_news"` (ambos `enabled: false` por defecto, size `full`).
- Componentes:
  - `src/components/home/DailyQuoteWidget.tsx`: tarjeta glass con la frase del día + autor.
  - `src/components/home/PsyNewsWidget.tsx`: carrusel/lista corta con 1-3 noticias recientes (título, imagen, link externo).
- Registrar ambos en el render del board y en el sheet "Gestionar widgets".

**Panel admin — nuevo módulo:**
- Nueva página `src/pages/admin/modules/ContenidoDiarioAdmin.tsx` con dos tabs: "Frases" y "Noticias".
  - CRUD simple (lista + form: crear/editar/eliminar, toggle activo, orden).
- Registrar ruta en `src/App.tsx` y entrada en `src/components/admin/AdminLayout.tsx` bajo el grupo de Contenido: `"Frases y Noticias" → /admin/contenido-diario`.

## 4. Psicoeducación — rediseño al estilo del resto de la app

**Problema:** `src/pages/Psicoeducacion.tsx` usa fondo negro `#0B0B10` y texto blanco: rompe con la estética clara (cream `#FDFCFB`, glass sobre blanco) del resto.

**Cambios en `src/pages/Psicoeducacion.tsx`:**
- Fondo: `bg-[#f9f9fb]` con los mismos ambient glows de MiProceso (`bg-[#7cc2c8]/20 blur-3xl` y `bg-[#facb60]/15`).
- Header: eyebrow en teal `#3d8a90`, título en `font-serif text-[#0f172a]` (mismo tamaño que "Mi Proceso"), subtítulo italic `text-[#64748b]`.
- Tarjeta destacada (video): fondo blanco glass (`bg-white/85 border border-white/70 backdrop-blur-xl`), hero con gradiente suave teal→amarillo en lugar de slate oscuro, texto oscuro.
- Tarjetas de categorías: fondo blanco/tint del `accent_color` al 12% con borde blanco. Textos `text-[#0f172a]` y `text-[#64748b]`. Barra de progreso sobre `bg-black/[0.06]`.
- Podcasts: mismo tratamiento glass claro.
- Mantener toda la lógica de datos, `PremiumLock`, navegación y rutas intactas.

## Detalles técnicos

- `PeriodStats` ganará prop `range?: "month" | "year"; hideToggle?: boolean` para controlarse desde el sheet.
- `WellbeingAnalysisSheet` mantiene el sparkline de 7 días cuando rango=Semana; cuando rango=Mes, agrega los últimos 30 días desde `daily_checkins` en 4 buckets semanales (query nuevo).
- Widgets nuevos leen vía `supabase.rpc('get_daily_quote')` y `select` sobre `psychology_news` (limit 5, `active=true`, orden `published_at desc`).
- Admin usa el mismo patrón que `PensamientosAdmin` / `ProgresoAdmin` (Tabs + AdminCard + toast).

## Fuera de alcance

- No se toca lógica clínica del wellbeing score.
- No se cambia el flujo del CrisisModal automático (solo el sheet manual).
- No se agrega ingesta automática de noticias externas: la carga es 100% manual desde admin.
