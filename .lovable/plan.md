# Rediseño Diario — escritura inmersiva

Reorganizar `src/pages/Diario.tsx` (componente `WriteView`) para que la escritura sea protagonista y los controles se reduzcan a una barra inferior fina con solo íconos.

## Cambios

### 1. Header minimal
- Modo claro: dejar solo botones `Lock` e historial (`Clock`) flotando arriba a la derecha como íconos pequeños sin pastilla pesada. Quitar el título "Diario" y subtítulo "Tu espacio seguro para escribir." para liberar la pantalla.
- Modo Zen: dejar únicamente el logo/flor (Flower) centrado o a la izquierda + botón `X` salir. Quitar la etiqueta "MODO ZEN".

### 2. Textarea full-screen
- La card del textarea ocupa todo el alto disponible (`flex-1`, sin altura fija `h-52`).
- Fondo translúcido sutil, sin bordes pesados. Padding cómodo, tipografía Lora más grande.
- Botón "Inspirame" se conserva flotante arriba a la derecha del textarea, más sutil.
- Banner de prompt se conserva arriba del textarea cuando está activo.

### 3. Barra inferior unificada (solo íconos)
Una sola fila compacta encima del footer de acción, con todos los controles como íconos sin texto:
- Cámara, Foto, Archivo, Audio (íconos Lucide en lugar de emojis para look fino).
- Selector "Siento…" como ícono (carita/emoji actual seleccionado) que abre popover compacto con chips.
- Selector "Causas…" como ícono (etiqueta) que abre popover compacto con chips.
- Modo Zen como ícono flor pequeño al final (en modo claro).
- Tooltips en hover/long-press para mostrar la etiqueta sin ocupar espacio.
- Estilo: pastilla única redondeada `rounded-full` translúcida, íconos ~18px, separación uniforme.

### 4. Footer acciones
- Mantener "Vaciar" + "Registrar Entrada" pero más finos (altura reducida de 14 a 12).

### 5. Modo Zen idéntico
- Misma estructura: solo logo arriba, textarea full-screen, misma barra inferior fina con íconos. Cambian solo los tokens de color (oscuro vs claro). Soundscape sigue presente.

## Detalles técnicos

- Reemplazar `AttachBtn` por `IconBtn` que renderiza ícono Lucide (`Camera`, `ImageIcon`, `Paperclip`, `Mic`) sin label visible, con `aria-label` y `title`.
- Convertir las dos `AccordionCard` en `Popover` (shadcn) anclados a un ícono en la misma barra inferior, en vez de cards grandes apiladas.
- Layout raíz cambia a flex column con textarea `flex-1` para que llene viewport.
- Mantener toda la lógica de estado, grabación, attachments, guardado y soundscape sin cambios.

No se tocan otras páginas ni backend.
