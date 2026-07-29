## Fase 2 — Rituales: Sintonía Diaria y Balance Nocturno

Objetivo: que los dos rituales usen la misma tipografía oficial que el resto de la app, que las emociones queden bien centradas y que la selección de valores sea circular, con ícono, etiqueta abajo y cambio de color al seleccionar (sin cortes visuales).

### 1. Tipografía unificada
- Reemplazar todos los usos de `font-serifElegant` y las itálicas decorativas en `SintoniaManana.tsx` y `BalanceNocturno.tsx` por la fuente oficial (`font-display` para títulos, fuente base para cuerpo), igual que Home y Recursos.
- Normalizar la escala: título de paso ~26px, subtítulo ~14px, cuerpo 13.5–14px, etiquetas en mayúsculas 10px con tracking.
- Quitar itálicas salvo en las citas clínicas puntuales (se convierten en texto normal con opacidad).

### 2. Paso 2 — Emociones centradas
- Contenedor con ancho máximo y centrado vertical/horizontal real.
- Grid simétrico de emociones (chips centrados, mismo alto, ícono + etiqueta alineados al centro).
- Título, descripción y contador centrados; mismos estilos tipográficos del punto 1.

### 3. Paso 3 — Valores en formato circular
- Reemplazar las tarjetas actuales (que se ven cortadas) por un grid de píldoras circulares:
  - Círculo de ~72px con ícono de trazo fino centrado.
  - Nombre del valor debajo del círculo, en 2 líneas máximo, centrado.
  - Estado no seleccionado: vidrio neutro con borde suave.
  - Estado seleccionado: relleno teñido del color del valor, borde e ícono en el mismo tono, escala táctil al presionar.
- Corregir el recorte: se elimina el scroll horizontal/overflow que corta las tarjetas y se usa grid de 3 columnas con scroll vertical suave.

### Detalles técnicos
- Archivos: `src/pages/ritual/SintoniaManana.tsx`, `src/pages/ritual/BalanceNocturno.tsx`, y si hace falta un pequeño componente nuevo `src/components/ritual/ValueBubble.tsx` para la píldora circular.
- Sin cambios de datos ni de lógica de guardado: sólo presentación y estados visuales de selección.

### Fases restantes después de esta
- **Fase 3**: Recursos — Bento Grid asimétrico con tinted glassmorphism e iconografía de trazo fino.
- **Fase 4**: Índice de Bienestar Modelo A — mensaje contextual, mini-trend de 7 días, autocuidado separado y casos borde.
- **Fase 5**: FAB Speed Dial en "Mi Proceso" (Sparkles + menú glass con Resmita y SOS).

Quedan 3 fases después de la Fase 2.
