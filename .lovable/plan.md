## Recap del algoritmo actual de Índice de Bienestar (`src/lib/wellbeingScore.ts`)

Score 0–100 = promedio de los **componentes disponibles** (los null se ignoran para no castigar):

- **mood** — promedio `mood_score` de `daily_checkins` últimos 7 días.
- **sleep** — promedio `sleep_score` de `daily_checkins` últimos 7 días.
- **habits** — % días con al menos 1 completación en `habit_completions`.
- **tests** — último resultado por test clínico (excluye Big Five), severidad invertida.
- **engagement** — `thought_records` + `dbt_emotion_sessions` + `journal_entries` últimos 7d, mapeado 0/40/70/100.
- **delta** — variación % de mood 7d vs 7d anteriores. **trend** — 7 puntos diarios de mood.

Lo que **no** entraba hoy: mindfulness/respiración, medicación, pack, objetivos semanales, reflexiones de valores. Los hábitos ya se cuentan por **completación**, no por creación (si armás pero no marcás → habits=null, no penaliza). Lo mismo con CBT/DBT: solo cuenta sesiones cerradas.

**Cambios al algoritmo (esta iteración)** — ampliar engagement + agregar medicación:

- **engagement** ahora suma: `thought_records` + `dbt_emotion_sessions` + `journal_entries` + `exercise_sessions` (mindfulness/respiración) + `weekly_reflections` + completaciones de días del Pack (`ba_day_logs`). Escala: 0→null, 1→35, 3→60, 6→80, 10+→100.
- **medication** (nuevo componente opcional) — `taken / total` de `medication_logs` últimos 7 días. Solo aporta si el usuario registra medicación.
- **Ponderación** (sobre los componentes presentes, se renormaliza): mood 25 · sleep 20 · habits 15 · engagement 15 · tests 15 · medication 10. Componentes null se descartan y los pesos se reescalan.
- El texto del `?` explica todo esto en criollo.

---

## Fase 1 — Recursos: sumar bentos Tests / Personalidad

**`src/components/recursos/BentoGrid.tsx`** — sacar el gating premium (la app ahora es gratis) y agregar dos tiles: **"Tests e inventarios"** y **"Personalidad"**. Ambos accesibles sin paywall.

**Nuevas pantallas**
- `src/pages/InventariosHub.tsx` — lista visual de BDI, BAI, PSWQ, PHQ-9, GAD-7, PSS-10, Rosenberg. Muestra "Último: hace X días". Toca → abre `TestRunner`.
- `src/pages/PersonalidadHome.tsx` — abre `BigFiveProfileModal` directo; si no hay resultado inicia BFI-20.
- Rutas nuevas en `src/App.tsx`: `/herramientas/inventarios`, `/herramientas/personalidad`.

**`src/pages/MiProceso.tsx`**
- Quitar `PsychometryCarousel`, `BigFiveCard`, `BigFiveProfileModal`, `TestRunner`, `SymptomsTestModal`, `directTestCode`, `bigFiveOpen` y sus imports.
- Quitar el wrapper `<PremiumLock>` (app gratis).
- Quedan: `WellbeingCardV2` (con `?` de ayuda) + bloque Terapia + encuesta de satisfacción.

## Fase 2 — Rediseñar `WellbeingAnalysisSheet`

**Eliminar**: banner "Tu semana / Tu mes", título "Cómo estuvo tu semana", grilla 2x2 "Qué influyó", "Esta semana vs la anterior", "De dónde viene tu número".

**Nuevo layout**:

1. **Header** — número del índice + delta + botón `?` con popover explicando qué mide, qué no cuenta, por qué a veces baja aunque estés bien.
2. **Gráfico interactivo** (`WellbeingChart` nuevo) — toggle **Semana / Mes** que reemplaza el rango de todo lo que está debajo. Swipe/flechas para retroceder períodos anteriores. Header dinámico ("Semana del 3 al 9 nov" / "Nov 2026"). Semana = 7 barras diarias; Mes = 4 barras semanales con promedio.
3. **Actividad del período** (`ActivityBreakdown` nuevo) — un solo item colapsable: "N actividades esta semana/este mes". Al tocar despliega desglose por tipo (mindfulness min, check-ins, hábitos ✓, CBT, DBT, diario, pack, medicación). Reactivo al rango + offset del gráfico.
4. **Historial de evaluaciones** — se queda, filtrado al mismo rango del gráfico.
5. **Qué se conecta con qué** (nuevo, no lo llamamos "correlaciones"):
   - Card A: *Actividad y bienestar* — Pearson entre actividad diaria total y `mood_score` diario del rango elegido. Muestra número interpretado ("+0.42 · conexión media positiva"). Toca → `/proceso/conexiones/actividad-bienestar` (scatter + tendencia).
   - Card B: *Actividad e inventarios* — Pearson entre actividad semanal y evolución del score del test más registrado. Toca → `/proceso/conexiones/actividad-tests` (líneas + barras).
   - Si <7 puntos: mensaje "Necesitás más registros" con contador.

**Archivos nuevos**
- `src/components/proceso/WellbeingChart.tsx`, `ActivityBreakdown.tsx`, `CorrelationCards.tsx`, `WellbeingHelpPopover.tsx`.
- `src/pages/proceso/CorrelacionActividadBienestar.tsx`, `CorrelacionActividadTests.tsx` (Recharts full-screen).
- `src/lib/correlations.ts` (Pearson + agregadores diarios/semanales por rango).
- `src/lib/activityAggregator.ts` (conteo unificado por rango, reutilizado por sheet, correlaciones y admin).

**`src/lib/wellbeingScore.ts`** — sumar mindfulness/weekly_reflections/ba_day_logs a engagement, agregar componente `medication`, aplicar pesos renormalizados. Mantener null-skip.

## Fase 3 — Admin > Principal > "Estadísticas"

**Nueva RPC** `admin_wellbeing_stats(_user_id uuid default null)` (SECURITY DEFINER, admin-only):
- Con `_user_id`: índice actual, componentes, evolución 30d, últimos 3 resultados por test, adherencia hábitos, correlación actividad↔bienestar individual.
- Sin `_user_id` (global): promedio índice, distribución por rango (bajo/medio/alto), % con al menos 1 test, adherencia promedio de hábitos, sesiones totales por módulo, DAU/MAU, minutos mindfulness, ratio "creó hábito vs cumplió hábito", top hábitos activos, correlación global uso↔bienestar.

**Página nueva** `src/pages/admin/modules/EstadisticasAdmin.tsx` con 3 tabs:
1. **Bienestar general** — promedio índice, distribución (Pie), evolución del promedio (Line), correlación uso↔bienestar.
2. **Uso de la app** — top módulos (Bar), minutos por recurso, retención por módulo, ratio armado/cumplido de hábitos.
3. **Por usuario** — buscador → índice, componentes, evolución 30d, tests, actividades por tipo, correlación individual.

**Sidebar** — agregar en Principal `{ title: "Estadísticas", url: "/admin/estadisticas-bienestar", icon: TrendingUp }`. Ruta en `App.tsx` → `EstadisticasAdmin`. Se mantiene la vieja `/admin/estadisticas`.

## Fuera de alcance
- Rediseño visual de `WellbeingCardV2` (solo `?`).
- Notificaciones basadas en correlaciones.
- Cache persistido de correlaciones (se calcula on-demand).

## Riesgos
- Correlación con <7 puntos → mostramos estado "faltan X días" en vez de un `r` engañoso.
- El toggle Semana/Mes cambia el rango de todo lo de abajo (gráfico, actividad, historial, correlaciones) — confirmado por vos.
