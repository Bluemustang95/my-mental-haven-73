
# Módulo "Hábitos" — Habit Tracker Premium para RESMA

## 1. Reorganización del hub `PensamientosHome` (Bento 2x2)

Reemplazar la lista vertical actual de `src/pages/pensamientos/PensamientosHome.tsx` por un Bento Grid 2x2 con tarjetas glassmorphic (`rounded-[28px]`, `bg-white/45`, `backdrop-blur-[28px]`, borde `white/60`, sombra suave).

```text
┌─────────────┬─────────────┐
│ 🍃 Mindfuln │ ❤️ Reg. Emo │   ← opacity-60, no clickeables
├─────────────┼─────────────┤
│ 🧠 Pensam.  │ ⚡ Hábitos  │   ← activos
│ Wizard CBT  │ Habit Track │
└─────────────┴─────────────┘
```

- **Mindfulness** y **Regulación Emocional**: `opacity-60`, sin onClick, subtítulo gris.
- **Pensamientos**: navega a `/diario-inteligente/gestion-pensamientos/pensamientos-automaticos` (ya existe).
- **Hábitos**: navega a la nueva ruta `/diario-inteligente/gestion-pensamientos/habitos`, borde de acento oro (`ring-1 ring-[#facb60]/40`).
- Debajo del bento se conserva una tarjeta "Módulo activo · Pack de Actividades" tal como muestran las capturas.

## 2. Nueva pantalla `HabitosHome` (`/.../habitos`)

Archivo nuevo: `src/pages/pensamientos/HabitosHome.tsx`. Misma base visual (ambient orbs, glass header sticky con back + chip "Workspace · Gestión de Pensamientos", botón "Wrapped" + botón "+" arriba a la derecha).

Contenido:
- Header editorial: chip dorado `ACUMULAR AFECTO POSITIVO`, título serif `Tus Hábitos Diarios`, bajada `Asociá rutinas sencillas a tus valores fundamentales…`.
- **Selector de vista** segmentado (pill negra activa) con 3 modos: `Grid` · `Semana` · `Cards`. Estado en componente.
- Lista de hábitos del usuario (cada uno renderiza la vista seleccionada).
- Padding inferior `pb-40` para no chocar con la tab bar; contenedor con `ref` y `scrollTop = 0` al montar / cambiar de vista.

### Vistas por hábito
Cada tarjeta de hábito (glass) tiene cabecera: icono emoji en cuadro, nombre serif, `VALOR: …` uppercase, chip de racha `4 días 🔥` con `textColor` del hábito. La cabecera es clickeable y abre el modal de estadísticas.

- **Grid**: cuadrícula 10×4 (40 bloques) coloreada con `bg-[color]` cuando el día está en `completions`, gris `#eef1f5` cuando no. Tap toggle inmediato con transición `scale-110` + glow. Caption inferior `TOCÁ LOS BLOQUES PARA REGISTRAR…`.
- **Semana**: 7 círculos `L M M J V S D` con check ✓ en los días completados de la semana actual.
- **Cards**: mini calendario 28 días en grid 7×4, cada día redondeado, marcado con color cuando está completo.

Toggle: actualiza optimistamente el estado local y persiste en backend (ver §4).

## 3. Modal "Nuevo Hábito Clínico" (botón "+")

Sheet/dialog glass con:
- Input "¿Qué rutina vas a incorporar?" (placeholder `Ej: Beber 2L de agua`).
- Picker de icono emoji (📖 ☀️ ✍️ 🧘 💧 🏃) horizontal con seleccionable destacado.
- Select "¿A qué valor de vida se asocia?" con `Salud / Autocuidado 🧘`, `Crecimiento 🌱`, `Relaciones 🤝`, `Ocio 🎨`, `Espiritualidad ✨`.
- Picker de color hue (5 swatches): teal `#7cc2c8`, oro `#facb60`, coral `#f47b6f`, lavanda `#b794f4`, índigo `#7c83f4`.
- CTA negro pill `CREAR HÁBITO`.
- Toasts del sistema RESMA (oscuros). Sin `alert/confirm`.

## 4. Persistencia (Lovable Cloud)

Migración nueva con dos tablas:

```text
habits(id uuid pk, user_id uuid, name text, icon text, value_key text,
       color text, text_color text, best_streak int default 0,
       created_at timestamptz default now(), archived_at timestamptz)

habit_completions(id uuid pk, user_id uuid, habit_id uuid fk,
                  completed_date date, created_at timestamptz default now(),
                  unique(habit_id, completed_date))
```

- `GRANT SELECT/INSERT/UPDATE/DELETE … TO authenticated;` `GRANT ALL … TO service_role;`
- RLS: cada usuario sólo ve/edita sus filas (`auth.uid() = user_id`). Admin select via `has_role`.
- Streak (`streak`, `bestStreak`), `hourlyData`, `weekdayData`, `historyTrend` se calculan en cliente a partir de `habit_completions.created_at` y `completed_date`. `best_streak` se persiste al cerrar racha.

Hook nuevo `src/hooks/useHabits.ts` que carga hábitos + completions del mes/año en curso y expone `toggle(habitId, date)`, `create(habit)`, `archive(habitId)`.

## 5. Modal de estadísticas del hábito (`HabitStatsSheet`)

Drawer bottom (`animate-in slide-in-from-bottom-8`) glass.
- 2 tarjetas grandes: "Total del mes" y "Mejor racha histórica".
- **Distribución horaria**: 4 barras horizontales (Mañana 6-12, Mediodía 12-17, Tarde 17-21, Noche 21-6) basadas en `created_at` de completions.
- **Rendimiento semanal**: histograma vertical L-D.
- **Tendencia 4 semanas**: barras verticales por semana del último mes.
- Render con SVG simple inline (sin nueva dependencia; ya hay `recharts` si conviene).

## 6. "RESMA Wrapped" anual

Botón `Wrapped 📊` en header abre dialog glass `WrappedDialog`:
- Header serif `Tu 2026 en Revisión`.
- Tarjeta navy oscura con borde dorado: `Total completados`, `Racha más larga`, `Valor prioritario`.
- Debajo: **Distribución por Valores** (donut/barras de %), **Curva mensual** (12 barras Ene-Dic).
- Botón `COMPARTIR FICHA WRAPPED` (genera PNG con `html-to-image` si está disponible; si no, copia resumen al portapapeles con toast).
- Botón `Cerrar Resumen`.

## 7. Detalles técnicos

- Tokens del módulo: gradiente base `linear-gradient(180deg,#f9f9fb 0%,#f2f4f8 100%)`, orbes existentes (`animate-[orb-float_…]` ya definidos en index.css).
- Voseo argentino en todos los strings.
- Todo el módulo cliente-side; backend solo Supabase + RLS.
- No tocar el wizard de Pensamientos Automáticos existente.

## Archivos

**Crear**
- `src/pages/pensamientos/HabitosHome.tsx`
- `src/components/habitos/HabitCard.tsx` (incluye vistas Grid/Semana/Cards)
- `src/components/habitos/NewHabitSheet.tsx`
- `src/components/habitos/HabitStatsSheet.tsx`
- `src/components/habitos/WrappedDialog.tsx`
- `src/hooks/useHabits.ts`
- `supabase/migrations/<ts>_habits.sql`

**Editar**
- `src/pages/pensamientos/PensamientosHome.tsx` → Bento 2x2.
- `src/App.tsx` → ruta `/diario-inteligente/gestion-pensamientos/habitos`.

No se modifica el wizard CBT ni `WeeklyGoalsWidget`.
