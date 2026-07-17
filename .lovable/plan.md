## Objetivo

Dejar **7 recursos visibles** (Mente & Emoción, Tests e Inventarios, Hábitos, Sueño, Diario, Psicoeducación, Plan de Seguridad). Los otros 4 (Mindfulness suelto, Pack Actividades, Personalidad, Resma Research) se **desactivan vía toggle admin** (no se borran de la DB, se dejan en `is_published=false`). Sueño entra al Bento, los colores del Bento se unifican con Home, Home pasa a **grid 2×2 (4 widgets)**, y el estado ON/OFF se propaga a bienestar, algoritmo, notificaciones y Resmita.

Confirmado por el usuario: Mindfulness y Pack quedan OFF; las rutas siguen funcionando internamente (ritual, DBT, etc.), solo desaparecen como recursos descubribles.

## 1. Toggle admin unificado

Dos tablas ya existentes:
- `resource_categories` → tarjetas del Bento `/herramientas`.
- `resource_tools` → widgets atómicos en Home + agregadores clínicos (`hiddenTools.ts`).

Cambios:
- Migración: upsert de 11 filas en `resource_categories` con slugs canónicos (`mente-emocion`, `inventarios`, `habitos`, `sueno`, `diario`, `psicoeducacion`, `plan-seguridad`, `mindfulness`, `pack`, `personalidad`, `noticias`). Los 7 primeros con `is_published=true`, los 4 últimos `false`.
- Upsert en `resource_tools` de los slugs atómicos hijos de las categorías OFF (`mindfulness_quick`, `pack_quick`, `pensamientos_quick`, `personalidad`, `psy_news`) también con `is_published=false`.
- Panel admin (`ResourceDetail.tsx` / listado padre) muestra los 11 con su Switch — ya está cableado, solo verificar que aparezcan todos.

## 2. Bento de Recursos (`/herramientas`)

- Agrego tile **Sueño** (`slug: "sueno"`, `Moon`, `target=/herramientas/sueno`, color índigo `#6366f1`).
- Muevo **Plan de Seguridad** al grid como tile normal (hoy es un banner rojo full-width abajo), manteniendo el rojo clínico `#e24b4a`.
- Cada tile toma el color desde `ATOMIC_COLORS` (`QuickToolWidget.tsx`) — la misma fuente de verdad que Home. El halo, el ícono y el ring del "Tu foco" heredan ese color por recurso.
- `BentoGrid` ya filtra por `is_published=false` → los 4 OFF desaparecen automáticamente.

## 3. Home — grid 2×2

- `Dashboard.tsx`: `grid-cols-3` → `grid-cols-2 gap-4`, límite `slice(0, 3)` → `slice(0, 4)`.
- Widget picker: filtra opciones cuyo recurso padre esté OFF. Las preferencias del usuario no se borran (por si vuelve a activarse).
- Opciones disponibles con los 7 ON: Sueño, Hábitos, Diario, Tests, Psicoeducación, Mente & Emoción (acceso rápido CBT/DBT), Plan de Seguridad. Se retiran del picker: Mindfulness quick, Pack quick, Pensamientos quick, Personalidad, Resma Research.

## 4. Propagación del ON/OFF a la lógica clínica

### Índice de bienestar (`src/lib/wellbeingScore.ts`)
- `engagement` ya usa `getHiddenToolSlugs()` para filtrar `exercise_sessions`. Extiendo con `getHiddenCategorySlugs()` para omitir: DBT si `mente-emocion` OFF; `thought_records` si `mente-emocion` OFF (CBT también vive ahí); `ba_day_logs` si `pack` OFF; `journal_entries`/`weekly_reflections` si `diario` OFF; mindfulness sessions si `mindfulness` OFF.
- `tests`: null si `inventarios` OFF.
- `habits`: null si `habitos` OFF.
- `sleep`/`mood`: siguen (dependen de check-in, no de recurso).
- La renormalización de pesos ya ignora `null` sin penalizar.

### Algoritmo y prioridad (`clinicalAlgorithm.ts`, `get_daily_recommendations`)
- Filtro en cliente: si `readLocalProfile().priority` apunta a slug OFF, se ignora (no se muestra badge "Tu foco", no se reordena el Bento).
- Recomendaciones diarias: la RPC sigue igual; el consumidor descarta filas cuya `resource_category` esté OFF antes de renderizar.

### Notificaciones (`cron-push-dispatcher`, `NotificationRunner.tsx`, `notificationEngine.ts`)
- Guard: antes de despachar una regla, chequear que la categoría padre esté ON. Si no, se marca `skipped_reason='resource_off'` en `notification_log` y no se envía. Preferencias del usuario intactas.
- Subpestaña admin de notificaciones muestra "pausada por recurso OFF" para las reglas afectadas.

### Resmita (`resmita-chat/index.ts`, `useResmitaContext.ts`)
- Añado `enabled_resources: string[]` al snapshot y al system prompt. Resmita solo menciona/sugiere recursos ON; los OFF se omiten del `screen_context.available_actions`.

## 5. Utilidad compartida

`src/lib/hiddenTools.ts` gana:
```ts
export async function getHiddenCategorySlugs(): Promise<Set<string>>
```
Cache 5 min igual que `getHiddenToolSlugs`. Consumida por wellbeing, algoritmo, notif engine y Resmita context.

## 6. Archivos afectados

- `supabase/migrations/*` — upsert `resource_categories` + `resource_tools`.
- `src/lib/hiddenTools.ts` — nueva función categorías.
- `src/components/recursos/BentoGrid.tsx` — tile Sueño, PlanSeguridad al grid, colores desde `ATOMIC_COLORS`, elimina banner.
- `src/pages/Dashboard.tsx` — grid 2×2, límite 4, filtro categorías OFF.
- Widget picker de Home — filtra por recursos ON.
- `src/lib/wellbeingScore.ts` — respeta toggle por componente.
- `src/lib/clinicalAlgorithm.ts` + consumidores — filtra OFF.
- `src/lib/notificationEngine.ts` + `supabase/functions/cron-push-dispatcher/index.ts` — guard por categoría.
- `supabase/functions/resmita-chat/index.ts` + `src/hooks/useResmitaContext.ts` — inyectan `enabled_resources`.
- `src/pages/admin/ResourceDetail.tsx` — verifico que los 11 aparezcan.

Nada se elimina de la DB. Todo es reversible con el Switch de admin.
