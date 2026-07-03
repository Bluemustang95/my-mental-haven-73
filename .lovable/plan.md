
## Objetivo
El botón "Más" debe funcionar también **entre bloques** (no solo dentro de un mismo texto), con transición suave y recordando el estado por usuario.

## Cambios

### 1. Nuevo bloque de práctica: "Más" (separador colapsable)
- Agregar tipo `more` a `src/lib/practiceTypes.ts`: `{ id, type: "more", label?: string }`. Label opcional (default `"Más"`).
- En `PracticeBuilder.tsx`: registrar en `BLOCK_LABELS` como "Punto 'Más' (ocultar lo siguiente)" y en `newBlock`. Editor mínimo: input opcional para cambiar la etiqueta.
- En `PracticeView.tsx`: partir el array `blocks` en secciones cada vez que aparece un `more`. Renderizar la primera sección siempre; el resto detrás de un botón "Más ⌄" centrado. Cada click revela **la siguiente sección**.

### 2. Botón "Más" entre bloques (mismo look que el interno)
- Reutilizar el mismo estilo pill del `RichContent` (mismo componente extraído: `<MoreButton onClick label />`) para consistencia.

### 3. Transición suave sin saltos
- Envolver el contenido revelado (tanto en `RichContent` como en `PracticeView`) con `framer-motion` `AnimatePresence` + `motion.div` con `initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}`, `transition={{ duration: 0.35, ease: "easeOut" }}` y `overflow: hidden`. Framer-motion ya se usa en el proyecto.

### 4. Persistencia del estado expandido
- Helper `usePersistedReveal(key, total)` que lee/escribe `localStorage` con clave `psico:reveal:{key}`. Guarda un número (cuántas secciones reveladas).
- `RichContent` recibe una prop opcional `storageKey` (ej: `${contentId}:body` para lección; `${contentId}:instructions:${blockId}` y `${contentId}:example:${blockId}` para bloques). Sin `storageKey` mantiene el estado solo en memoria (comportamiento actual).
- `LessonView` pasa `storageKey={lesson.id + ":body"}`.
- `PracticeView` usa el mismo helper para las secciones inter-bloque con clave `${contentId}:practice`, y le pasa `storageKey` a cada `InstructionsBlock` / `ExampleBlock` (esos componentes reciben `contentId` + `blockId` y lo propagan a `RichContent`).

### Archivos tocados
- `src/lib/practiceTypes.ts` — nuevo tipo `more`.
- `src/components/admin/PracticeBuilder.tsx` — editor y etiqueta.
- `src/components/psico/RichContent.tsx` — animación + `storageKey` + `MoreButton` exportado.
- `src/components/practice/blocks/InstructionsBlock.tsx` y `ExampleBlock.tsx` — reciben `storageKey` opcional.
- `src/pages/psicoeducacion/PracticeView.tsx` — corte por bloque `more`, animación, persistencia.
- `src/pages/psicoeducacion/LessonView.tsx` — pasa `storageKey`.

Sin cambios de DB (los bloques `more` se guardan dentro de `practice_blocks` JSON existente).
