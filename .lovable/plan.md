# Ajustes en "Modificá tus pensamientos"

## 1. Fix del "salto" al escribir en Pros y contras (Paso 6)

**Causa**: en `src/components/pensamientos/steps/Step6Balanza.tsx` el subcomponente `Panel` está declarado **dentro** del componente padre. Cada tecla que se tipea recrea `Panel` como nuevo tipo → React desmonta y remonta el `<input>` y el bloque animado con `AnimatePresence` + `height: auto`, provocando pérdida de foco y una animación de expansión/colapso visible como "movimiento".

**Fix**: extraer `Panel` fuera del componente (o inlinear el JSX) y evitar animar `height: auto` en el editor abierto para que la tarjeta no oscile. El input mantiene foco y la tarjeta queda fija mientras se escribe.

## 2. Ocultar el downbar cuando aparece el prompt de seguimiento

**Causa**: `FollowupPromptModal.tsx` no llama a `useHideBottomNav`, por eso la BottomNav queda encima del modal (visible en la captura 2).

**Fix**: importar `useHideBottomNav` desde `@/hooks/useUiChrome` y activarlo con `open` — mismo patrón ya usado en `FollowupCompleteSheet.tsx`.

## 3. Historial reciente ampliado + integración con Calendario

### 3a. Ver todo el historial en Mente & Emoción
- `RecentHistory.tsx` hoy trae solo 5 registros y muestra situación + emoción muy cortas.
- Cambios:
  - Subir a los últimos 20 y agregar botón "Ver todos" que despliega la lista completa (paginado local desde `thought_records`).
  - Al tocar un ítem, abrir un **sheet de detalle** (nuevo `ThoughtRecordDetailSheet.tsx`) que muestre: fecha, situación, emociones + intensidad, pensamiento automático, distorsiones, evidencias a favor/en contra, pensamiento alternativo, plan/resolución y estado del follow-up (pendiente/completado con SUDS antes-después y logro).
  - Filtro simple por tipo (Reestructuración / Abordaje) y por estado de tarea.

### 3b. Tareas de seguimiento en el Calendario
- `src/lib/calendarActivity.ts` ya trae `thought_records` como tipo `"thought"`. Ampliar la función para incluir además:
  - `thought_followups` creados ese día (label: "Tarea de seguimiento pendiente") — usando `due_date`.
  - `thought_followup_logs` (o el campo `completed_at` en `thought_followups`) para marcar la tarea como **completada** o **incompleta** en el día correspondiente. Detail: SUDS antes→después y "Logrado / No logrado".
- Nuevo `type: "thought_task"` con label e icono propio para diferenciarlo del registro de pensamiento.

## Archivos afectados
- `src/components/pensamientos/steps/Step6Balanza.tsx` — extraer `Panel`, quitar animación de altura.
- `src/components/pensamientos/FollowupPromptModal.tsx` — `useHideBottomNav(open)`.
- `src/components/pensamientos/RecentHistory.tsx` — 20 items + "Ver todos" + apertura de detalle.
- `src/components/pensamientos/ThoughtRecordDetailSheet.tsx` — **nuevo**, muestra el registro completo y el estado de la tarea.
- `src/lib/calendarActivity.ts` — agrega `thought_followups` (pendientes y completadas) al día correspondiente.

Sin cambios de esquema en base de datos: se usa lo ya existente (`thought_records`, `thought_followups`, `thought_followup_logs`).
