
# Fase A — Cerrar el loop Onboarding → Home

Objetivo: que las respuestas del onboarding realmente cambien qué ve la persona en la home, y que la pantalla de "tu plan" aparezca antes del signup como motivador.

Decisiones ya confirmadas:
- Maleta (Q3 actual, "recent_feelings") queda **multi-select** como hoy.
- La pantalla de categoría del plan va **antes del signup**.
- Solo Fase A por ahora (sin admin todavía).

---

## 1. Unificar el algoritmo

Un único archivo `src/lib/onboardingAlgorithm.ts` (reescrito). Reemplaza a `clinicalAlgorithm.ts` como fuente de verdad.

- **Módulos válidos** (solo los que tienen ruta real): `mindfulness`, `pensamientos`, `psicoeducacion`, `psicohigiene_sueno`, `habitos`, `pack_actividades`, `diario`.
- **Widgets sugeridos aparte** (sin ruta, solo home widgets): `frases_del_dia`, `noticias_psicologia`. No entran en `top3_tools`, van al pool de widgets opcionales.
- **Categorías** (con fallback real a `integral`): `sueno`, `ansiedad`, `recuperacion`, `activacion`, `autoconocimiento`, `integral`. Cada una con `{ title, description, icon, accent }`.
- **Modificadores suaves**:
  - `country != 'AR'` → `pack_actividades` se descarta de top3 (contenido AR-only por ahora, ya gateado en la app).
  - `life_stage in ['adolescente','joven-adulto']` → boost x1.2 a `habitos`.
- **Tiebreaker determinístico** por prioridad clínica fija: `mindfulness > pensamientos > psicohigiene_sueno > pack_actividades > habitos > diario > psicoeducacion`.
- **Versionado**: `ALGO_VERSION = 1` exportado en el módulo.
- Devuelve: `{ plan_category, priority_module, top3_tools: string[], suggested_widgets: string[], module_scores, algo_version }`.

## 2. Migración de DB

Nuevas columnas en `patient_app_profiles`:
- `plan_category text` — la categoría final ("sueno", "ansiedad", …).
- `top3_tools jsonb` — array de IDs de módulos (ej: `["mindfulness","pensamientos","habitos"]`).
- `algo_version int default 1`.
- `home_seeded boolean default false` — bandera para saber si ya sembramos `home_layouts` con `top3_tools`.

`priority_module` y `module_scores` ya existen, se reusan.

## 3. Wizard de onboarding (`Onboarding.tsx`)

- Reemplazar la llamada actual a `computePriority` (de `clinicalAlgorithm`) por el nuevo `calculatePlan()`.
- Persistir en `patient_app_profiles`: `plan_category`, `top3_tools`, `algo_version`, `priority_module`, `module_scores`.
- Reordenar los pasos finales así:
  1. Q respondidas (pasos actuales 0-5, sin cambios).
  2. `AlgorithmTransition` (animación corta "sintonizando tu plan", como hoy).
  3. **Nueva pantalla `PlanCategoryScreen`** — muestra categoría, título, descripción cálida, ícono, y los 3 módulos recomendados con sus nombres. CTA "Crear mi cuenta →".
  4. Paso de cuenta (email + Google, como hoy).
- Guardado en `sessionStorage` (`resma:onboarding_pending`) ya persiste `top3_tools` + `plan_category` para que sobrevivan al OAuth redirect.

## 4. Sembrar la home después del onboarding

Al hacer `persistProfile()` con éxito:
- Si `home_seeded === false` → inicializar `home_layouts.widgets` con los `top3_tools` mapeados a widgets de home. Set `home_seeded = true`.
- Mapeo módulo → widget de home:
  - `psicohigiene_sueno` → `sleep_zone` (widget existente).
  - `mindfulness` → nuevo widget `mindfulness_quick` (link a `/herramientas/mindfulness`, reusa `WidgetShell`).
  - `pensamientos` → nuevo widget `pensamientos_quick` (link a `/herramientas/pensamientos`).
  - `habitos` → `mini_habits` (widget existente).
  - `pack_actividades` → nuevo widget `pack_quick` (link a `/herramientas/pack`).
  - `diario` → nuevo widget `diario_quick` (link a `/diario`).
  - `psicoeducacion` → nuevo widget `psico_quick` (link a `/psicoeducacion`).
- Layout inicial: primer slot `full`, siguientes dos `half` (encaja con `EditSlots`).

## 5. Home lee `priority_module` para la card "Recomendado"

`Dashboard.tsx` ya arma un `priorityCards` hardcodeado. Cambio mínimo:
- Cargar `patient_app_profiles.priority_module` (junto con `display_name`, en la misma query).
- La card `recommended` toma su `title`, `description`, `actionLabel`, `onAction` de un mapa `PRIORITY_CARD_BY_MODULE[priority_module]`. Si no hay `priority_module`, cae al default actual ("Manejo de distorsiones").
- `RecommendedResourceCard` sigue funcionando igual (usa `get_daily_recommendations`), pero cuando el RPC devuelve vacío hace fallback al `priority_module` en vez del pool hardcodeado.

## 6. Nuevos widgets tipo "quick launcher"

Componente único genérico `QuickToolWidget` en `src/components/home/QuickToolWidget.tsx` que recibe `{ id, title, subtitle, route }` y usa `WidgetShell` con la identidad ya definida en `WidgetVisual.tsx`. Agregar entradas a `WIDGET_IDENTITY` para los IDs nuevos (`mindfulness_quick`, `pensamientos_quick`, `pack_quick`, `diario_quick`, `psico_quick`).

Registro en `WidgetsBoard.tsx`:
- Agregar los IDs nuevos a `TOOL_IDS`.
- Extender `DEFAULT_WIDGETS` para que existan (deshabilitados por defecto — el seed del punto 4 los habilita según top3).

## 7. Retirar `clinicalAlgorithm.ts`

- Redirigir todos los imports actuales al nuevo `onboardingAlgorithm.ts` (export compat: `computePriority` sigue existiendo con la misma firma que hoy pero llama internamente al nuevo `calculatePlan`).
- No borrar el archivo aún — deja un `re-export` para no romper nada. Se elimina en Fase B cuando el admin esté en pie.

---

## Fuera de alcance de esta fase (van en B y C)

- Admin `/admin/onboarding` (editor de preguntas, pesos, categorías, métricas).
- Botón "Recalcular plan" en `PatientDetail`.
- Sembrar `algo_user_answers` desde el onboarding (mejora `get_daily_recommendations`).
- Bridge de `plan_category` en Sintonía / Balance (copy contextual).
- Recomendación diaria mejorada con fallback a `priority_module`.

---

## Archivos que se tocan

**Nuevos:**
- `src/components/home/QuickToolWidget.tsx`
- `src/components/onboarding/PlanCategoryScreen.tsx`
- `supabase/migrations/<timestamp>_onboarding_plan_fields.sql` (columnas nuevas en `patient_app_profiles`)

**Modificados:**
- `src/lib/onboardingAlgorithm.ts` (reescrito completo, unificado)
- `src/lib/clinicalAlgorithm.ts` (re-export delgado hacia el nuevo, para compat)
- `src/pages/Onboarding.tsx` (nueva pantalla de categoría antes del signup + persist de campos nuevos + seed de `home_layouts`)
- `src/pages/Dashboard.tsx` (lee `priority_module` para la card recomendado)
- `src/components/home/WidgetsBoard.tsx` (nuevos IDs, DEFAULT_WIDGETS extendido)
- `src/components/home/WidgetVisual.tsx` (identidad para los 5 widgets nuevos)
- `src/components/home/RecommendedResourceCard.tsx` (fallback a `priority_module`)

Cuando confirmes, arranco.
