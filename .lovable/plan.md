# Plan: Módulo de Hábitos Premium DBT (RESMA)

Reescribe completamente el módulo de Hábitos en `/herramientas/habitos` siguiendo el brief clínico. Mantiene la estructura existente de Cloud (tablas `habits` + `habit_completions`) y la extiende.

## 1. Migración de Base de Datos

Nueva migración que agrega columnas al `habits` existente y categorías personalizadas:

```sql
ALTER TABLE public.habits
  ADD COLUMN description text,
  ADD COLUMN category_key text DEFAULT 'salud',
  ADD COLUMN frequency text DEFAULT 'daily',        -- daily | weekly | monthly
  ADD COLUMN frequency_count int DEFAULT 1,         -- veces por período
  ADD COLUMN time_slot text DEFAULT 'all',          -- morning | afternoon | night | all
  ADD COLUMN cadence text DEFAULT 'every_day',      -- every_day | every_2 | custom
  ADD COLUMN reminders_enabled boolean DEFAULT false,
  ADD COLUMN icon_type text DEFAULT 'emoji';        -- emoji | line

CREATE TABLE public.habit_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  key text NOT NULL,
  label text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, key)
);
-- GRANTs + RLS por user_id
```

`habit_completions` ya soporta toggles por fecha — sin cambios.

## 2. Estructura de Archivos

```text
src/pages/pensamientos/HabitosHome.tsx          (reescrito — shell elástico)
src/components/habitos/
  ├─ HabitShell.tsx                              (NUEVO — shell h-full/sm:h-[90vh])
  ├─ DashboardHeader.tsx                         (NUEVO — workspace + 📊 + +)
  ├─ ViewSegmentedControl.tsx                    (NUEVO — Grid/Últimos 5/Cards)
  ├─ HabitCard.tsx                               (reescrito — 3 vistas pulidas)
  ├─ NewHabitSheet.tsx                           (reescrito — tabs + acordeón)
  ├─ HabitDetailSheet.tsx                        (NUEVO — pantalla 3)
  │   ├─ MiniYearMatrix.tsx
  │   └─ MonthCalendarGrid.tsx
  └─ stats/
      ├─ StatsDashboard.tsx                      (NUEVO — pantalla 4)
      ├─ RadialProgress.tsx                      (SVG strokeDasharray)
      ├─ TrendAreaChart.tsx                      (SVG Bezier cúbico C)
      ├─ WeekdayBarChart.tsx                     (barras verticales)
      └─ TimeSlotHorizontalBars.tsx              (Mañana/Tarde/Noche)
src/hooks/useHabits.ts                           (extiende create con nuevos campos + useHabitCategories)
src/lib/habitsIcons.ts                           (NUEVO — emoji set + lucide line icons)
```

`WrappedDialog.tsx` y `HabitStatsSheet.tsx` previos quedan eliminados (reemplazados).

## 3. Pantalla 1 — Dashboard

- Shell elástico: `flex flex-col h-full sm:h-[90vh] sm:max-h-[760px]` en contenedor `max-w-md`.
- Header sticky superior glassmorphic: "WORKSPACE / RESMA" + botón estadísticas 📊 + botón `+`.
- Hero centrado: kicker `ACUMULAR AFECTO POSITIVO`, título serif "Tus Hábitos Diarios", subtítulo DBT.
- Segmented control píldora (Grid / Últimos 5 días / Cards).
- Lista scroll independiente `flex-1 overflow-y-auto no-scrollbar pb-28`.
- **Grid view**: card con icono + nombre + categoría, micro-grilla 20 celdas del mes actual, botón check circular grande con el color del hábito que dispara `animate-pop` (framer scale 0.85→1.05→1) y toast.
- **Últimos 5 días**: fila de 5 chips día (`Ju 18`, etc.) tappables; racha 🔥 al header.
- **Cards**: grid 2 cols compacto con icono, nombre, categoría, racha y check toggle.
- Toast superior con `sonner` al completar.

## 4. Pantalla 2 — Crear Hábito (Sheet)

- Bottom-sheet con scroll interno propio, header serif + close.
- Tabs **Emojis** / **Iconos finos** (lucide-react: `Droplet, Book, Dumbbell, Heart, Sun, Moon, Brain, Coffee, ...`).
- Nombre + Descripción opcional.
- Selector de 6 colores de racha (Teal, Gold, Rose, Indigo, Emerald, Slate).
- Acordeón colapsable "Configurar objetivos y frecuencia":
  - Frecuencia (Diario/Semanal/Mensual) + cantidad numérica.
  - Horario de registro (chips: Mañana/Tarde/Noche/Día completo).
  - Categoría DBT (chips predefinidos + "Crear propia" → input rápido → inserta en `habit_categories`).
  - Frecuencia de registro (Día a día / Cada 2 días / Personalizado).
  - Toggle Recordatorios → dispara `toast.info("RESMA solicita permiso…")`.
- CTA "REGISTRAR HÁBITO".

## 5. Pantalla 3 — Detalle de Hábito

- Sheet full-screen al tocar nombre/icono de un card.
- Header: icono grande, nombre serif, descripción, badge categoría.
- Stats rápidas (2 cards): Objetivo (`3× semana`) y Racha actual (`5 días 🔥`).
- **MiniYearMatrix**: 12 columnas (Ene-Dic), 4 filas (semanas comprimidas), celdas coloreadas según completions.
- **MonthCalendarGrid** Junio 2026: grilla 7×N tappable; al tocar día → toggle completion; racha se recalcula desde hoy hacia atrás.
- Botonera: Editar (abre `NewHabitSheet` en modo edit) + Eliminar (destructivo rojo con confirm).

## 6. Pantalla 4 — Stats Dashboard

- Se renderiza dentro del mismo shell cuando se pulsa 📊 (toggle `view='stats'`).
- Selector horizontal de hábito (chips). Cambiar hábito retransiciona gráficos (framer `AnimatePresence` + key).
- **RadialProgress** — `<circle strokeDasharray>` animado: % adherencia últimos 30 días.
- **TrendAreaChart** — SVG path con `C` cúbico, área rellena con gradient del color del hábito, tooltips on tap.
- **WeekdayBarChart** — 7 barras verticales L→D, altura proporcional.
- **TimeSlotHorizontalBars** — 3 barras horizontales Mañana/Tarde/Noche con %.
- Card Psicoeducación Serif con texto Linehan/parasimpático.

## 7. Sistema de Diseño

- Tokens existentes (`#101927`, `#7cc2c8`, `#facb60`, `#f9f9fb`) — sin cambios.
- Glass panels: `bg-white/45 backdrop-blur-[28px] border border-white/60`.
- Dos orbes animados de fondo (ya existen patrones).
- Tipografía: serif `Lora` para títulos, `Inter` UI, `Montserrat uppercase tracking` para etiquetas (los 3 ya cargados).
- Animaciones: `framer-motion` (`layout`, `AnimatePresence`, scale en toggle). Transiciones de vista `slide-in-from-right`.

## 8. Lógica & Hooks

- `useHabits`: extiende `create(input)` con nuevos campos; agrega `update(id, patch)`, `remove(id)` (hard delete vs archive en detalle).
- Nuevo `useHabitCategories()` para fetch + insert.
- Cálculos de stats (puro frontend desde `completions`): `adherence30d`, `weeklyTrend(8 semanas)`, `weekdayDistribution`, `timeSlotDistribution` (proxy basado en hora de `created_at`).
- `localDateStr` ya respeta UTC-3.

## 9. Garantías de Layout

- Shell `flex flex-col`, contenido `flex-1 min-h-0 overflow-y-auto pb-28 smooth-scroll`.
- BottomNav global se respeta con `pb-28`; sheets internos con `pb-40`.
- Modo desktop: el contenedor se centra con `sm:h-[90vh] sm:max-h-[760px]` y bordes redondeados.

## Validación final

- Build TS pasa.
- Crear hábito → aparece en las 3 vistas, toggle día funciona, racha se actualiza.
- Toggle día desde `MonthCalendarGrid` y desde Stats refleja en todos lados.
- BottomNav nunca tapa el CTA.
