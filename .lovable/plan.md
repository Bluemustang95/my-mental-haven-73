
# Módulo "Activación Comportamental" — Pack de Actividades

Programa terapéutico guiado de 7 días con estética **light glassmorphism** (oro `#facb60` + teal `#7cc2c8`) aislada dentro del Pack, totalmente editable desde admin y con todo el progreso del usuario persistido en Lovable Cloud.

---

## 1. Estructura de carpetas (frontend)

```text
src/pages/pack/
  PackHome.tsx                  → Lista de programas (cards bento)
  PackIntro.tsx                 → Onboarding "Pack de Actividades"
  ba/
    BAProgram.tsx               → Orquesta intro / day1-wizard / journey / day-task
    BAOnboarding.tsx            → 3 slides intro (editables vía admin)
    BAJourney.tsx               → Timeline vertical 7 días + botón calendario flotante
    BADayOne.tsx                → Wizard 5 pasos
    BADayTask.tsx               → Fases planning / pending / feedback
    BACalendarModal.tsx         → Tabla horaria línea base (reutilizable)
    BABarrierFlow.tsx           → Mini-flow "No pude hacerlo"
    BAProgressChart.tsx         → Gráfico Dominio/Agrado día a día
src/components/pack/
  GlassCard.tsx, GlassButton.tsx, AmbientGlows.tsx, StepDots.tsx
src/lib/baTypes.ts              → Tipos compartidos
src/pages/admin/pack/
  PackOverview.tsx              → Listado de programas del Pack
  BAContentEditor.tsx           → CMS completo del BA
```

Rutas (todas fuera de `AppLayout`, con `ProtectedRoute`):
- `/herramientas/pack` → PackHome
- `/herramientas/pack/ba` → BAProgram
- `/admin/pack` → PackOverview
- `/admin/pack/ba` → BAContentEditor

Acceso desde "Recursos / Herramientas": una card grande "Pack de Actividades" que lleva al onboarding del pack.

---

## 2. Esquema de base de datos (Lovable Cloud)

### Contenido editable (admin)
- **`ba_content`** (singleton, 1 sola fila editable)
  - `intro_slides` jsonb — 3 slides `{title, body, icon}`
  - `program_meta` jsonb — `{title, subtitle, icon}`
  - `cycle_text` jsonb — textos de "Hacer de menos / Hacer de más"
  - `values_catalog` jsonb — array de `{key, emoji, title, subtitle}` (4 por defecto)
  - `clinical_plan` jsonb — textos del "Plan Clínico" (slide 3)
  - `default_ladder` jsonb — escalera sugerida de 7 pasos
  - `barriers_catalog` jsonb — barreras + respuestas terapéuticas
  - `daily_messages` jsonb — texto por día 2-7 (motivacional)
- RLS: lectura para `authenticated`, escritura solo para `has_role(uid, 'admin')`.

### Progreso del usuario
- **`ba_programs`** — un programa activo por usuario
  - `user_id` (FK auth.users, único), `started_at`, `current_day` int 1-7, `last_completed_date` date
  - `selected_values` jsonb, `motivation` text, `goals` jsonb (array 3)
  - `selected_goal_idx` int, `ladder` jsonb (array de 7 `{text, suds}`)
  - `state` text ('onboarding'|'day1'|'active'|'completed')
- **`ba_baseline_entries`** — celdas del calendario línea base
  - `user_id`, `program_id`, `day_of_week` 0-6, `hour` int, `activity`, `emotion`, `intensity`, `dominio`, `agrado`
  - UNIQUE (user_id, program_id, day_of_week, hour)
- **`ba_day_logs`** — un log por día del programa
  - `user_id`, `program_id`, `day` int 2-7, `scheduled_time` time
  - `anticipated_difficulty` int, `actual_difficulty` int, `dominio` int, `agrado` int
  - `barrier_chosen` text NULL, `completed_at` timestamptz NULL

Las 4 tablas con RLS por `user_id = auth.uid()` + `GRANT` a `authenticated` y `service_role`. Trigger `update_updated_at` donde corresponda.

---

## 3. Flujo de usuario (resumen funcional)

1. **PackHome**: card "Activación Comportamental" (oro). Si ya tiene `ba_programs.state != 'completed'`, muestra "Continuar Día N".
2. **Onboarding**: pantalla bienvenida → 3 slides (leídos de `ba_content.intro_slides`) → crea `ba_programs` con `state='day1'`.
3. **Día 1 — Wizard 5 pasos** (cada paso guarda parcialmente en `ba_programs`):
   - Psicoeducación interactiva (toggle Menos/Más).
   - Selección hasta 2 valores (de `values_catalog`).
   - Motivación + 3 metas.
   - **Calendario línea base** completo (15h × 7d) con modal de edición → escribe `ba_baseline_entries`.
   - Escalera de 7 pasos a partir de meta elegida (SUDS 1-10, efecto visual descendente). Botón "Comenzar mi Tratamiento" → `state='active'`, `current_day=2`.
4. **Journey**: timeline vertical 1→7, día actual escalado y oro, futuros bloqueados, pasados con check teal. Botón calendario flotante abre `BACalendarModal`. Botón DEV "Simular 24h" solo en `import.meta.env.DEV`.
5. **Día N (2-7)** — 3 fases:
   - **planning**: muestra `ladder[N-2]`, input `time`, slider dificultad anticipada → guarda en `ba_day_logs`.
   - **pending**: reloj pulsando, recordatorio. "Ya lo hice" → feedback. "No pude" → `BABarrierFlow` (lee `barriers_catalog`, guarda `barrier_chosen`).
   - **feedback**: sliders dificultad real / Dominio / Agrado → escribe `completed_at`, incrementa `current_day`, actualiza `last_completed_date`, vuelve a Journey.
6. **Día 7 completo** → `state='completed'`, muestra `BAProgressChart` con evolución Dominio/Agrado.

**Validación suave**: para avanzar pide mínimos razonables (al menos 1 valor, al menos 1 meta con texto, escalera con paso 1 y 7 escritos). Sin bloqueos en testeo si está en `DEV`.

---

## 4. CMS Admin (`/admin/pack/ba`)

Editor con tabs (usando shadcn Tabs):
- **General**: título, subtítulo, ícono del programa, activo on/off.
- **Onboarding**: 3 slides editables (título + cuerpo + ícono).
- **Psicoeducación**: textos "Hacer de menos / Hacer de más" + "El Plan Clínico".
- **Valores**: CRUD de la lista (emoji, título, subtítulo).
- **Escalera sugerida**: 7 inputs editables con SUDS por defecto (precarga si el usuario no edita).
- **Barreras**: CRUD `{label, clinical_response}` para `BABarrierFlow`.
- **Mensajes diarios**: textos para días 2-7.

Listado en `/admin/pack` con la grilla "Pack de Actividades" (un solo programa por ahora; preparado para sumar otros).

---

## 5. Diseño (Light Glassmorphism)

- Fondo `#fdfbfb`, texto `#101927`.
- Dos `AmbientGlows` fijos (`#facb60` y `#7cc2c8`, opacity 0.15, blur 100px).
- Tarjetas `bg-white/80 backdrop-blur-2xl border-[#101927]/5 shadow-[0_10px_40px_rgba(16,25,39,0.08)]`.
- Inputs `bg-white shadow-inner border-[#101927]/10`.
- Botón primario oscuro `#101927`, secundario oro `#facb60`.
- Iconos `lucide-react` (uso normal, no hay conflicto real con `Plus`/`Target` en este proyecto).
- Tipografía: respeta `mindful`/`display` ya definidas (Lora para titulares, Montserrat para UI).
- Aislado dentro de `/herramientas/pack/**` — el resto de la app sigue dark.

---

## 6. Notas técnicas

- Persistencia con `supabase.from('ba_programs').upsert(...)` debounced 600 ms (igual patrón que `PracticeView`).
- Fechas: `localDateStr()` para `last_completed_date` (UTC-3).
- `useBAProgram(userId)` hook centraliza fetch + mutaciones.
- `AdminRoute` protege `/admin/pack/**` con `has_role(uid, 'admin')`.
- Cuando se completa un día se inserta opcionalmente una entrada en `day_timeline_entries` para que aparezca en el Diario (banderita simple — fuera de scope si complica, lo dejamos como TODO).

---

## 7. Fuera de scope (v2)

- Notificaciones push / recordatorio horario real.
- Resumen exportable PDF.
- Otros programas del Pack (Mindfulness ACT, Exposición, etc.).
- Sincronización del calendario línea base con el calendario general de la app.

---

## Entregables

1. Migración SQL con 4 tablas + GRANT + RLS + seed de `ba_content` con contenido por defecto en español rioplatense.
2. Frontend completo de `src/pages/pack/**` y `src/components/pack/**`.
3. Admin `src/pages/admin/pack/**` registrado en `AdminLayout` y `App.tsx`.
4. Entry point: card "Pack de Actividades" en `Tools.tsx` (Herramientas).
