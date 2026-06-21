
# Rediseño del módulo Gestión de Pensamientos

## 1) Quitar "Preocupaciones" y entrar directo

- En `src/components/recursos/BentoGrid.tsx`, el tile **Pensamientos** ya no irá al wizard directo; apuntará al nuevo hub `/herramientas/pensamientos`.
- Si existe alguna sub‑resource "Preocupaciones" en `algo_sub_resources`, se filtra en el hub (no se renderiza). Cualquier ruta vieja a "preocupaciones" se deja sin enlazar.

## 2) Nuevo Hub de Pensamientos (estilo Mindfulness / Regulación)

Nuevo archivo `src/pages/pensamientos/PensamientosHub.tsx`, ruta `/herramientas/pensamientos`. Estructura espejo de `MindfulnessHub.tsx`:

- Header con back a `/herramientas`, título "Pensamientos", subtítulo.
- `WeekStrip` con progreso (lee `thought_records` por fecha del usuario).
- Lista de intervenciones (por ahora solo **Modificá tus pensamientos** → wizard CBT). Diseñado para sumar más en el futuro.
- Sección inferior "Sesiones recientes" (últimos `thought_records`, abrir lectura).
- FAB "+" → abre el wizard.

## 3) Intro educativa interactiva (Modelo Cognitivo)

Nuevo `src/components/pensamientos/intro/ModeloCognitivoIntro.tsx` (modal full‑screen) que se muestra **una sola vez** la primera vez que se entra a "Modificá tus pensamientos" (flag `resma:pensamientos:intro-v1` en localStorage). Se puede reabrir desde un botón **?** en el header del wizard.

Contenido (basado en el PDF "Modelo Cognitivo"):

- Slide 1 — *No es la situación, es la interpretación*: ejemplo dinámico de 5 lectores leyendo el mismo libro → distintas emociones (entusiasmo / decepción / disgusto / angustia / tristeza). Card animada: el usuario toca cada lector y ve el pensamiento + emoción que dispara.
- Slide 2 — *El esquema A‑B‑C interactivo* (la imagen 1 adjunta como referencia): mismo evento "La ventana cruje" con dos caminos ("¡Un ladrón!" vs "Es el viento") que el usuario alterna y ve cómo cambian Emoción, Cuerpo y Conducta. Se reutiliza el contenido actual de `Step1FiltroMental` pero como demostración educativa, no como paso obligatorio.
- Slide 3 — *Qué son los pensamientos automáticos*: definición breve + la pregunta clave **"¿Qué acaba de pasar por mi mente?"**.
- Slide 4 — *Pensamientos disfuncionales*: carrusel con las 11 distorsiones del PDF (dicotómico, catastrófico, descalificar, razonamiento emocional, catalogar, magnificar/minimizar, abstracción selectiva, leer la mente, sobregeneralización, personalización, "debo/tengo que"), cada una con ejemplo.
- CTA final: "Empezar mi registro".

Estilo: glass, animaciones suaves Motion, copy en voseo argentino empático. Skippable con "Saltar".

## 4) Paso 2 reordenado + IA holística

Reescribir `Step2Captura.tsx` con orden **Evento → Emoción → Pensamiento** (en vez de Emoción → Evento → Pensamiento).

Sección nueva al inicio del paso: **"Contame qué pasó"** (textarea libre + botón "Que la IA lo organice"). Llama a `analyze-thought` en un modo nuevo `holistic` que devuelve JSON:

```
{ trigger, emotion, intensity, thoughts: [string, ...] }
```

- Si `thoughts.length > 1`: muestra una tarjeta "Detectamos varios pensamientos" con todos listados y el mensaje "Empezá con uno: tocá el que más resuene". El elegido se carga en `automaticThought`; los demás se guardan en `draft.pendingThoughts` para sugerir abrir otra sesión al final.
- Auto‑rellena los tres campos pero el usuario puede editar cada uno.

Editar `supabase/functions/analyze-thought/index.ts` para aceptar `mode: "holistic"` y devolver el JSON estructurado (Gemini default). Mantener los modos `identify` y `refine` actuales como fallback manual.

Extender `ThoughtDraft` en `src/lib/pensamientos/state.ts`: agregar `pendingThoughts: string[]` y bump del key de localStorage a `v4`.

## 5) Paso 3 — Distorsión cognitiva con viñetas grandes

En `Step3Distorsion.tsx`:

- Mover el bloque **"Por qué registrarlo"** arriba de la tarjeta de distorsión y rehacerlo como lista de 3 viñetas grandes (icono circular + título + descripción corta), no texto plano.
- Mantener la detección automática y el `DistortionPicker` colapsable.

## 6) Paso 4 — Evidencias más dinámico

Rediseño de `Step4Evidencias.tsx`:

- Tabs segmentadas **A favor / En contra** (en vez de las dos listas apiladas).
- Botón grande "¿Qué me recomendás?" arriba que llama `suggest-evidence` y devuelve sugerencias en formato chip; tocar chip = sumar al lado correspondiente.
- Quick‑prompts (chips) bajo el input: "Algo que pasó esta semana", "Algo que dijo otra persona", "Un dato concreto", "Una vez que no se cumplió" — al tocar, pre‑rellena el textarea.
- Termómetro fijo arriba, animado al agregar/quitar.

## 7) Arreglar el botón "Atrás"

En `WizardShell.tsx`, el header back hace `navigate(-1)` solo si no hay `onBack`, pero el wizard pasa `onBack` que en Paso 1 va a `/diario-inteligente/gestion-pensamientos` (ruta vieja eliminada → 404 silencioso). Cambios:

- En `PensamientosAutomaticos.tsx`, en Paso 1 navegar a `/herramientas/pensamientos` (nuevo hub).
- En `WizardShell.tsx`, asegurar que el botón flecha del header **siempre** dispara la misma lógica que el footer "Atrás" (ya pasa `onBack`, verificar que no quede el fallback a `navigate(-1)` cuando estamos en paso 1 — usar siempre `onBack` provisto).
- También `finish()` redirige al nuevo hub.

## Detalles técnicos

- Archivos nuevos: `src/pages/pensamientos/PensamientosHub.tsx`, `src/components/pensamientos/intro/ModeloCognitivoIntro.tsx`, helpers en `src/lib/pensamientos/intro.ts` (flag localStorage + contenido de slides).
- Archivos editados: `src/App.tsx` (ruta `/herramientas/pensamientos`), `src/components/recursos/BentoGrid.tsx` (target del tile), `src/components/pensamientos/shell/WizardShell.tsx`, `src/pages/pensamientos/PensamientosAutomaticos.tsx`, `src/components/pensamientos/steps/Step2Captura.tsx`, `Step3Distorsion.tsx`, `Step4Evidencias.tsx`, `src/lib/pensamientos/state.ts`, `supabase/functions/analyze-thought/index.ts`.
- Sin cambios de base de datos. Sin tocar Step1FiltroMental (su contenido pasa a vivir dentro del Intro educativo; el wizard arranca ahora en el actual Paso 2). Total de pasos del wizard pasa de 5 a **4** (Captura → Distorsión → Evidencias → Tratamiento).
- Voseo argentino, glassmorphism Light, toasts existentes.
