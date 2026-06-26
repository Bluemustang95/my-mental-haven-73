# Ajustes pequeños previos

## 1. Hábitos
**Archivo:** `src/pages/pensamientos/HabitosHome.tsx`
- Eliminar el bloque del título "ACUMULAR AFECTO POSITIVO" + "Tus Hábitos Diarios" + bajada (las 3 líneas centradas justo antes del `ViewSegmentedControl`).
- Mantener header con acciones y el segmented control.

## 2. Recursos — quitar calendarios por módulo
Sacar el `WeekStrip` (calendario semanal) de:
- `src/pages/pensamientos/PensamientosHub.tsx` (línea 76).
- `src/pages/mindfulness/MindfulnessHub.tsx` (línea 103) — también el `DayHistorySheet` asociado y su estado.
- `src/pages/DiarioInteligente.tsx` (línea 112).

El único calendario que queda es el de **Inicio** (`Dashboard.tsx`), que ya agrega progreso de todos los módulos vía `daily_checkins`. No se toca su lógica.

## 3. "Pendientes para vos" — full color
**Archivos:** `src/pages/Dashboard.tsx` (función `PendingForYou`, líneas 324-358) y `src/components/home/PendingBento.tsx`.

- Hoy los boxes son `glass-premium` (vidrio translúcido). Cambiarlos a tarjetas con **fondo de gradiente sólido full-color** (usando el `from`/`to2` ya definidos por item en `PendingBento`, y para los placeholders del Dashboard usar gradientes equivalentes).
- Texto en blanco, icono en chip blanco translúcido, sombra suave del color base.
- Mantener la misma estructura/tamaño/iconografía.
- Nota: ya no se mostrarán contadores de progreso dentro de cada módulo — todo el "qué hiciste / qué te recomendamos" vive aquí. No requiere cambios extra porque los hubs no muestran esos contadores; sólo eliminamos sus calendarios (paso 2).

## 4. Inicio — agrupar widgets en bloques movibles
**Archivos:** `src/components/home/WidgetsBoard.tsx` y `src/pages/Dashboard.tsx`.

Problema actual: en modo edición cada item se mueve por separado, y al cambiar tamaño no se refleja hasta salir.

Cambios:
- Introducir el concepto de **grupos** en `WidgetsBoard`. Tres grupos fijos que se reordenan/arrastran como una sola unidad:
  1. `camino_hoy` → `morning` + `recommended` + `night` (no incluye sueño).
  2. `pendientes` → `pending`.
  3. `sueño` → `sleep_zone`.
  - Resto de widgets opcionales (`mini_habits`, `gratitude`, `contention_notes`) se mantienen como ítems individuales movibles.
- `ReorderableStack` opera sobre **grupos** (un `Reorder.Item` por grupo). Dentro de cada grupo se renderizan sus widgets apilados, sin drag interno.
- Solo los widgets individuales (sueño, mini hábitos, etc.) y los grupos pueden moverse por separado; los 3 ítems de "Tu camino de hoy" y los 2 boxes de "Pendientes" se mueven como una unidad.
- **Resize en vivo:** mover el toggle de tamaño para que aplique `setSize` con `flushSync`/estado local inmediato y forzar re-render en modo edición — actualmente `WidgetCell` solo lee `size` cuando no está en edit. Asegurar que el contenedor del item en `ReorderableStack` use la clase de tamaño actual (`col-span-1`/`col-span-2`) leyendo del estado, y que el grid del modo edición conmute a 2 columnas para que `half` tenga efecto visible al instante.
- Persistencia: extender `WidgetState` con un campo `group?: GroupId` o derivarlo de un mapa estático; no romper localStorage existente (migración tolerante en `loadWidgets`).

## Notas técnicas
- No tocar lógica de backend, RLS ni datos.
- Persistencia de orden de grupos en mismo `localStorage` key, agregando `groupOrder` o renombrando con migración suave.
- Verificar build después de cada bloque.
