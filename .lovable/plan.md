## Ajustes al editor del Diario

### 1. Confirmación al iniciar nueva entrada
- En el ícono ✨ del header (botón "Nueva entrada") agregar un `AlertDialog` de shadcn antes de ejecutar `reset()`.
- Texto: *"¿Querés empezar una entrada nueva? Se guardará la actual y se vaciará el editor."*
- Acciones: **Cancelar** / **Empezar nueva**.
- Solo se muestra si hay contenido (texto, emoción o causas); si está vacío, no aparece.

### 2. Tipografía más fina
- Bajar el textarea de `text-lg` (18px) a `text-[15px]` con `leading-relaxed`.
- Mantener `Lora` serif para preservar la estética de diario, pero más liviano visualmente.
- Aplicar el mismo tamaño en Modo Zen.

### 3. Formato de texto enriquecido (negrita / itálica)
- Reemplazar el `<textarea>` por un editor `contentEditable` ligero (`<div contentEditable>`), conservando el mismo placeholder, autosave y click sonoro.
- Al **seleccionar texto**, mostrar una mini-toolbar flotante (popover anclado a la selección) con dos botones:
  - **B** (negrita) → `document.execCommand('bold')`
  - **I** (itálica) → `document.execCommand('italic')`
- La toolbar aparece sólo mientras hay selección no vacía y se oculta al hacer click fuera o al colapsarse la selección.
- Guardado: persistir el `innerHTML` en `journal_entries.content` (el campo ya es `text`, acepta HTML). El historial renderiza con `dangerouslySetInnerHTML` sanitizando con un whitelist mínimo (`<b>`, `<strong>`, `<i>`, `<em>`, `<br>`, `<div>`).

### Archivos afectados
- `src/pages/Diario.tsx` — header (AlertDialog), reemplazo textarea→contentEditable, mini-toolbar de formato, ajuste de tamaño, sanitización en el render del historial.
- Reutiliza `@/components/ui/alert-dialog` y `@/components/ui/popover` ya existentes.

### Fuera de alcance
- No se agregan más opciones de formato (subrayado, listas, headings) para mantener el editor minimal.
- No se modifica el esquema de la tabla `journal_entries`.
