## Objetivo

En Psicoeducación (lecciones teóricas y prácticas):

1. Renombrar el botón "Más" a **"Continuar"**.
2. El botón final fijo abajo ("Entendido, continuar" / "Guardar y finalizar") **no se muestra** hasta que el usuario haya abierto todos los "Continuar" de la pantalla.
3. Al tocar "Continuar", la vista **se desplaza sola** hasta la nueva sección revelada, sin que el usuario tenga que scrollear.

## Cambios

### 1. `src/components/psico/RichContent.tsx`
- `MoreButton`: label por defecto `"Continuar"`.
- Nuevo contexto ligero **RevealGate** (`RevealGateProvider` + `useRevealGate`): cada bloque con reveals pendientes se registra con un id; el provider expone `allRevealed` (true cuando ningún bloque tiene pendientes).
- `RichContent` se registra en el gate: reporta `revealed < sections.length`.
- Al revelar: tras la animación (~350 ms) hacer `scrollIntoView({ behavior: "smooth", block: "start" })` sobre la sección nueva, con un offset para el header sticky, de modo que el texto nuevo quede arriba de la pantalla.

### 2. `src/pages/psicoeducacion/LessonView.tsx`
- Envolver el contenido en `RevealGateProvider`.
- Ocultar la barra fija inferior mientras `allRevealed === false` (fade-in cuando se completa). Se conserva el auto-marcado de leído por scroll + 20 s.
- Ajustar el `pb-28` para que no quede un hueco vacío cuando la barra está oculta.

### 3. `src/pages/psicoeducacion/PracticeView.tsx`
- Envolver en el mismo `RevealGateProvider`; los bloques `more` de la práctica y los `RichContent` internos (Instrucciones / Ejemplo) se registran automáticamente.
- Botón "Guardar y finalizar" oculto hasta que todos los "Continuar" estén abiertos.
- Mismo auto-scroll al revelar cada sección de bloques.

### 4. Editor admin (`src/components/admin/RichTextEditor.tsx`)
- Cambiar la etiqueta del botón de la toolbar de "Más" a "Continuar" (el marcador guardado sigue siendo `[[more]]`, sin migración de datos).

## Notas técnicas
- El marcador en la base de datos no cambia (`[[more]]`), sólo el texto visible.
- El estado de reveals sigue persistiendo en `localStorage`; si un usuario ya abrió todo, el botón final aparece de inmediato al volver a entrar.
