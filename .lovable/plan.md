# Widgets con utilidad real en Inicio

## Objetivo
Convertir los tiles de Inicio en mini-herramientas interactivas (no solo accesos), y limpiar la jerarquía visual eliminando los títulos de sección.

## Cambios en Inicio (`src/pages/Dashboard.tsx`)
1. **Quitar títulos**: eliminar el header "Tus herramientas" + streak; `PriorityStack` sin encabezado "Enfoque prioritario".
2. **`ManageWidgetsButton`** se mueve a un ícono discreto (sin texto) en la esquina sup-der del grid. Long-press sigue activando modo edición.
3. Ajustar márgenes verticales tras remover los títulos.

## Widgets interactivos

Cada tile mantiene tamaño cuadrado `h-[130px]` y muestra contenido real. Interacción por **swipe horizontal con snap** cuando hay >1 item (indicadores de puntitos abajo). Tap en header/ícono navega al módulo completo.

### A. `MiniHabitsWidget`
- Lista de hábitos activos (`useHabits`).
- Item visible: ícono + nombre corto + botón circular de check para marcar hoy (`toggle(habitId, today)`).
- Swipe entre hábitos.

### B. `pensamientos_quick`
- `thought_followups` pendientes (mismo query que `ThoughtTaskWidget`, limit 3).
- Item con check que abre `FollowupCompleteSheet`.
- Swipe entre pendientes; estado vacío "Todo al día".

### C. `sleep_zone`
- Último `sleep_log` / audio de sueño. Muestra "Continuar: <nombre>" con ▶︎.
- Si no hay checkin nocturno: "Registrar sueño de anoche".

### D. `psico_quick`
- Última lección con `progress < 1` de `content_progress` + `psychoeducation_content`.
- "Seguí con: <título>" + barra de progreso + ▶︎ que navega directo a la lección.

### E. `pack_quick`, `mindfulness_quick`, `diario_quick`
- **Pack**: día actual del programa BA (`ba_programs` + `ba_day_logs`), check rápido.
- **Mindfulness**: última práctica (`mindfulness_audio_cache`/favoritos), ▶︎ para repetir.
- **Diario**: si no hay entry hoy → "Escribir hoy" abre **mini-sheet**; si ya hay → "Registrado ✓".

### F. `gratitude`, `contention_notes`
- Chip "+ Añadir" abre **mini-sheet** para escribir una línea sin salir de Inicio.
- Debajo, últimos 2 items como texto compacto (swipe si son varios).

## Patrón compartido
Nuevo `src/components/home/InteractiveTile.tsx`:
- `h-[130px] rounded-[22px] p-3`.
- Header: ícono + nombre corto (izq), acción principal (der).
- Cuerpo: contenido del item actual.
- Footer: dots si `items.length > 1`.
- Props: `items`, `renderItem`, `onNavigate`, `onPrimaryAction`.
- Swipe implementado con Framer Motion `drag="x"` + snap por índice.

Mini-sheets: componente `QuickCaptureSheet.tsx` reutilizable (textarea + guardar), usado por diario/gratitud/contención.

## Archivos
- `src/pages/Dashboard.tsx` — quitar títulos, ajustar layout, mover botón manage.
- `src/components/home/InteractiveTile.tsx` — **nuevo**.
- `src/components/home/QuickCaptureSheet.tsx` — **nuevo**.
- `src/components/home/OptionalWidgets.tsx` — reescribir Mini/Gratitude/Contention.
- `src/components/home/QuickToolWidget.tsx` — dividir por id en implementaciones funcionales (o crear archivos `MindfulnessQuick.tsx`, `PensamientosQuick.tsx`, `PackQuick.tsx`, `DiarioQuick.tsx`, `PsicoQuick.tsx`, `SleepZoneQuick.tsx`).
- Sin cambios de schema; se usan tablas existentes.

## Fuera de alcance
- Sin cambios en rutas, permisos, ni tamaño del grid.
- Sin cambios en `PriorityStack` interno ni en los widgets de "camino" (mañana/recomendado/noche).
