## Problema

1. **BDI no refleja los cambios del admin y no tiene intro.** En `MiProceso.tsx` (líneas 113–115) el tap sobre la card BDI abre `BeckTestRunner`, que es una demo hardcodeada de 4 preguntas ("Tristeza", "Pesimismo"…) con baremos fijos 13/19/28/63 y sin pantalla intro. Nunca lee `test_definitions` / `test_items`, por eso ignora ítems personalizados, `baremos`, mensaje final y opciones custom. BAI y PSWQ ya usan el runner correcto (`TestRunner`).

2. **Personalidad muestra texto aunque no se cargó nada.** `BigFiveProfileModal.tsx` (líneas 20–26) tiene un objeto `FALLBACK_DESC` con textos por defecto para O/C/E/A/N, y las tarjetas usan `custom.description || fb.description` (líneas 219–221). Cuando el admin no cargó descripciones, cae al fallback y aparece texto que el admin nunca escribió.

## Cambios

### 1. `src/pages/MiProceso.tsx`
- Reemplazar `handleSelectTest` por: `setDirectTestCode(code)` para los tres códigos (BDI, BAI, PSWQ).
- Eliminar `beckOpen` state, el `<BeckTestRunner .../>` y el import. Todo pasa por `TestRunner` que ya soporta intro + `baremos` + `result_message` + `options` custom + `reverse`.

### 2. `src/components/proceso/BigFiveProfileModal.tsx`
- Eliminar `FALLBACK_DESC` completo.
- En la sección "Qué significa cada rasgo":
  - Si `traitDescriptions` está vacío (o ningún rasgo tiene datos), no renderizar el bloque de tarjetas ni el título — mostrar un aviso sutil: *"Las explicaciones de cada rasgo aún no fueron cargadas por el equipo."*.
  - Para cada rasgo, usar sólo `custom.description`, `custom.low`, `custom.high`, `custom.label`, `custom.color`. Si el rasgo no tiene `description`, no dibujar su tarjeta.
  - El bloque low/high solo aparece si el texto correspondiente existe.
- El nombre visible del rasgo (`label`) sigue usando el default de `TRAITS` sólo como fallback del **nombre** (no del contenido explicativo), para que el hexágono y los chips no queden sin etiqueta.

### 3. Limpieza
- `BeckTestRunner.tsx` queda sin usar. Se puede dejar en el repo o borrar; propongo **borrarlo** para evitar que vuelva a colarse en otra pantalla.

## Resultado

- Al abrir BDI se muestra la intro, los ítems reales cargados desde admin (con opciones y puntajes custom), los baremos definidos y el mensaje final. Igual que BAI/PSWQ.
- En Personalidad, si el admin no cargó descripciones, no aparece ningún texto explicativo (solo el hexágono y un aviso corto). Cuando el admin las carga, aparecen exactamente los textos que escribió.
