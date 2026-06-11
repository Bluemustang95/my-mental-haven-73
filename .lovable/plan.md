# Mejoras al Hub de Mindfulness

## 1. WeekStrip — cambiar el click, no eliminarlo

El `WeekStrip` sigue visible pero más compacto. Hoy al tocar un día navega a `/calendario/:fecha`. Cambio: en lugar de navegar, abre un **bottom sheet contextual** con el historial del día.

- En `MindfulnessHub`: el sheet muestra sólo sesiones de mindfulness de ese día (tipo, modo, duración, SUDS pre/post si existe).
- En `Home` (Dashboard): el sheet muestra **toda** la actividad de ese día (check-ins, journal, tests, ejercicios, etc.) reutilizando `fetchCalendarActivities` como en `SettingsHistory`.
- El `WeekStrip` acepta una nueva prop `onSelectDay` que se sobreescribe para abrir el sheet en vez de navegar. Ningún `navigate('/calendario/...')` queda en estos dos lugares.

## 2. Bottom sheet de historial diario

Nuevo componente `DayHistorySheet` (basado en `Sheet` de shadcn, side="bottom", rounded-t-3xl, fondo claro).

Props: `date`, `scope: "mindfulness" | "all"`, `open`, `onOpenChange`.

Contenido:
- Encabezado: fecha en formato `EEEE d 'de' MMMM` (es).
- Lista de actividades con hora, etiqueta y resultado (ej: "Respiración 4-7-8 · 3 min · SUDS 7→3").
- Estado vacío: "Todavía no hiciste nada este día."
- Para mindfulness, query a `exercise_sessions` filtrando `exercise_type='mindfulness'` y `created_at` en el día (UTC-3 respetando `localDateStr`).

## 3. Tarjetas más compactas en el Hub

Reducir las 3 tarjetas (Respiración / Observar / Describir):
- Alto fijo más bajo (~72px en vez de ~96px).
- Ícono dentro de un cuadrado 44x44 (en lugar de 56x56).
- Padding `p-3` en lugar de `p-5`.
- Título `text-base`, descripción a una línea con `line-clamp-1`.
- Espaciado vertical entre tarjetas: `space-y-2`.

WeekStrip también un poco más discreto: padding vertical reducido.

## 4. FAB "+" para agregar otro ejercicio del día

Lógica: si el usuario **ya completó al menos un ejercicio de mindfulness hoy**, mostrar un FAB redondo abajo a la derecha del Hub.

- Detección: contar sesiones de hoy con `exercise_type='mindfulness'` (se puede derivar del mismo `progressByDate[hoy] > 0`).
- FAB: 56x56, fondo `#101927`, ícono `+` blanco, sombra, fixed `bottom-24 right-5` (sobre la BottomNav).
- Al tocar: abre un **bottom sheet selector rápido** (`QuickAddSheet`) con 3 filas: Respiración, Observar, Describir → cada una navega al sub-hub correspondiente.
- Si todavía no hizo ninguno, el FAB no aparece (las 3 tarjetas grandes ya cumplen ese rol).

## 5. Resumen de archivos

Nuevos:
- `src/components/mindfulness/DayHistorySheet.tsx`
- `src/components/mindfulness/QuickAddSheet.tsx`

Editados:
- `src/pages/mindfulness/MindfulnessHub.tsx` — tarjetas compactas, FAB condicional, sheets, click del WeekStrip reemplazado.
- `src/components/home/WeekStrip.tsx` — sólo si hace falta reducir padding; el cambio de click es vía prop.
- `src/pages/Dashboard.tsx` (Home) — reemplazar el `navigate('/calendario/:fecha')` del WeekStrip por abrir `DayHistorySheet` con `scope="all"`.

Sin cambios de base de datos. Sin tocar `/calendario/:fecha` (la ruta sigue existiendo por si se usa en otros lados, pero ya no se llega desde Home ni Mindfulness).
