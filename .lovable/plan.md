## Objetivo
Convertir la administración de tests en un CRUD completo (síntomas + personalidad) editable desde `/admin/progreso`, y simplificar la vista del perfil de personalidad en el frontend para mostrar solo el resultado y explicaciones editables.

---

## 1. Base de datos (una migración)

Ampliar el esquema de tests para soportar puntuaciones por opción, baremos, mensajes de cierre y descripciones de rasgos.

**`test_definitions`** — agregar columnas:
- `baremos jsonb` — array de rangos: `[{ label: "Leve", min: 0, max: 13, color: "#22c55e", message: "..." }, ...]`. Reemplaza el `interpret()` hardcodeado del `TestRunner`.
- `result_message text` — mensaje genérico de cierre (opcional, se muestra bajo el score).
- `trait_descriptions jsonb` — solo para `kind='personality'`. `{ "O": { label: "Apertura", short: "Apertura", color: "#7c3aed", description: "Explicación del rasgo…", low: "Qué implica puntaje bajo", high: "Qué implica puntaje alto" }, ... }`

**`test_items`** — la columna `options jsonb` ya existe; formalizar formato:
`[{ label: "Nunca", score: 0 }, { label: "A veces", score: 1 }, ...]`. Cuando `options` está definido, `TestRunner` usa esos scores en lugar de `scale_min..scale_max`. `reverse` sigue funcionando (invierte score).

Ambos cambios son aditivos (nullable) — no rompen tests actuales. Se agrega policy admin write y grants correspondientes.

---

## 2. Admin — `/admin/progreso` → renombrar y reestructurar tabs

En `src/pages/admin/modules/ProgresoAdmin.tsx`:

- Tabs finales: **Índice de Bienestar** · **Evaluaciones y Psicometría** · **Personalidad** · **Protocolos de Riesgo**. Se elimina el tab "Baremos" (la funcionalidad se absorbe dentro de cada test).

### Pestaña "Evaluaciones y Psicometría" (kind='symptom')
Nuevo componente `TestsCrudPanel` (reutilizable, recibe `kind`):
- **Lista de tests** (BDI-II, BAI, PSWQ, …) con botón "Nuevo inventario".
- **Editor de test** al seleccionar uno:
  - Datos: `name`, `code`, `instructions`, `scale_min/max`, `scale_labels`, `active`, `sort`.
  - **Ítems**: tabla ordenable (drag) con `prompt`, `reverse` (toggle), `subscale`, y editor de opciones (`options`) con puntaje por opción.
  - **Baremos**: editor de rangos (label, min, max, color, mensaje interpretativo).
  - **Mensaje final**: textarea `result_message` que se muestra al terminar.
  - Botón "Guardar" hace upsert de definición + reemplazo de ítems + baremos.

### Pestaña "Personalidad" (kind='personality')
Reutiliza `TestsCrudPanel` con `kind="personality"`, agregando un editor extra:
- **Descripciones de rasgos** (`trait_descriptions`): por cada código de subscale (O, C, E, A, N o los que defina el test), campos: `label`, `short`, `color`, `description`, `low`, `high`. Estos textos alimentan las tarjetas explicativas que ve el usuario tras completar el test.

---

## 3. Frontend — `TestRunner`
`src/components/tests/TestRunner.tsx`:
- Cargar `baremos`, `result_message`, `trait_descriptions` junto a la definición.
- Reemplazar `interpret()` local: buscar el rango en `baremos` donde `total` cae y usar su `message`.
- Si un ítem tiene `options` con `score`, usar esos scores (con `reverse`); sino, seguir con `scale_min..scale_max`.
- Pantalla de resultado: mostrar `result_message` bajo el score/hexágono.

---

## 4. Frontend — Perfil de Personalidad
`src/components/proceso/BigFiveProfileModal.tsx`:
- **Eliminar el bloque "Ajusta tus rasgos para simular"** (sliders) — el X en la anotación.
- **Gate por primer resultado**: si `test_results` para `BIGFIVE` no existe, mostrar estado vacío con CTA "Hacer el test por primera vez" que abre el `TestRunner`. Sólo cuando existe un resultado se muestra el hexágono con los valores reales.
- Debajo del hexágono: **tarjetas explicativas** por cada rasgo (donde está la "A"), leyendo `trait_descriptions` del test definido en admin. Cada tarjeta: `label`, chip con el % del usuario, `description`, y sub-bloques `low`/`high` cuando existen. Si el admin no cargó descripciones, fallback a un texto neutro por rasgo.
- Cargar `trait_descriptions` con una sola query a `test_definitions` (code=BIGFIVE).

---

## 5. Historial → Índice de Bienestar
Actualmente `PsychometryCarousel` y `BigFiveCard` abren directamente el runner/modal. Agregar acceso al historial:
- En `PsychometryCarousel`: chip "Ver historial" al final de la fila → navega/abre `WellbeingAnalysisSheet` (el hub único de estadísticas ya consolidado). Idem link "Historial" dentro de `BigFiveProfileModal`.
- Dentro de `WellbeingAnalysisSheet` agregar una sección compacta "Historial de evaluaciones" que liste `test_results` del período (fecha, test, score, severidad) — reutiliza el mismo range toggle. Esto cumple con "que aparezca para verlo pero que los lleve al índice de bienestar".

---

## Detalles técnicos
- Nuevos archivos: `src/components/admin/tests/TestsCrudPanel.tsx`, `TestItemsEditor.tsx`, `BaremosEditor.tsx`, `TraitDescriptionsEditor.tsx`.
- `src/integrations/supabase/types.ts` se regenera al aprobar la migración.
- Sin cambios en `test_results` — solo lectura para historial.
- Tests que no tengan `baremos` cargados en admin mantienen el fallback actual de `interpret()` (retrocompatibilidad) hasta la primera edición.

---

## Resultado
- Admin: control total sobre inventarios, ítems, puntajes, inversas, baremos, mensajes finales y explicaciones de rasgos.
- Usuario: perfil de personalidad limpio (solo resultado + explicaciones), sin sliders. Test bloqueado hasta la primera completación. Historial disponible pero centralizado en el Índice de Bienestar.
