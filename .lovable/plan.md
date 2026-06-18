## Objetivo

Rehacer el wizard de Pensamientos Automáticos para que sea más compacto, clínicamente más útil, y que la IA realmente acompañe en cada paso. Pasamos de 4 a **5 pasos**, sumando un paso dedicado a la **distorsión cognitiva**.

## Nuevo flujo (5 pasos)

```
1. Filtro Mental (didáctico, compacto)
2. Captura + IA que ayuda a identificar el pensamiento
3. Distorsión Cognitiva (nuevo) — qué tipo es y por qué registrarlo
4. Evidencias (IA evalúa el pensamiento dado el evento, sugerencias inline)
5. Tratamiento (Reestructuración o Plan de acción, ambos con IA interactiva)
```

---

## Paso 1 — Filtro Mental (compactar)

Sigue muy alto. Reducir todo en ~30%:
- Quitar la "Ficha 2.2" del título — mantener subtítulo corto.
- Tarjeta de evento activador: padding `p-3`, texto `text-[13px]`.
- Flechas más chicas y sin margen vertical extra.
- Tarjetas de Camino: padding `p-3`, emoji `text-xl`, label en una línea.
- Panel de emoción/fisiología/conducta: condensar en lista compacta de 3 filas con label inline + dato (sin separadores con `pt-3 border-t`), padding `p-3`, font sizes 11–12px.

Resultado: cabe sin scroll en 390×743.

## Paso 2 — Captura + IA "Ayudame a identificarlo"

Mantener los 3 bloques (Emoción + Intensidad, Evento, Pensamiento), pero cambiar la IA:

- Renombrar botón a **"Ayudame a identificar mi pensamiento"** (con icono Sparkles).
- Si el usuario NO escribió pensamiento aún (o <8 chars), la IA recibe: emoción + intensidad + evento, y devuelve:
  - `tips`: 2-3 tips de cómo identificar el pensamiento ("¿Qué imagen apareció en tu mente?", "¿Qué te decías a vos mismo?", etc.) — vienen del prompt.
  - `candidates`: 2 candidatos plausibles de pensamiento automático para que el usuario elija/edite.
- Si SÍ hay pensamiento escrito, devuelve `factual` (reescritura observable) + `questions` (socráticas). Como hoy.
- Cualquier candidato/factual es tocable → rellena el textarea.
- Toda la sugerencia aparece **debajo del textarea, no al final**, en una tarjeta amarilla colapsable.

Actualizar `analyze-thought` edge function:
- Recibir `mode: "identify" | "refine"` (lo decide el cliente según largo del texto).
- Prompt distinto por modo, devolviendo el JSON adecuado: `{tips:[], candidates:[]}` o `{factual, questions:[]}`.

## Paso 3 (NUEVO) — Distorsión Cognitiva

Antes de evidencias. Usa `detectDistortion()` sobre el pensamiento del paso 2.

- Si detecta una: card grande con
  - Etiqueta (ej "Catastrofismo")
  - Definición clínica corta (basada en el documento adjunto: Dicotómico, Catastrófico, Descalificar, Razonamiento emocional, Catalogar, Magnificar/Minimizar, Abstracción selectiva, Leer la mente, Sobregeneralización, Personalización, Debo/Tengo que). Ampliar `distortionDetector.ts` para que las descripciones coincidan textualmente con el documento.
  - Ejemplo típico (1 línea).
  - Bloque "Por qué registrarlo": "Identificar el patrón te quita poder al automatismo y permite reescribirlo con evidencia". 3 bullets cortos.
  - Selector chico (chips) para que el usuario corrija/elija otra distorsión si la detección no le cierra ("Mejor encaja:" → lista compacta de las 11).
- Si NO detecta: card neutra "No detectamos un patrón rígido evidente. De todas formas, podés marcar uno si te resuena", con la lista de chips para elegir manualmente. También un botón "Ninguno aplica".

`canContinue` paso 3: siempre `true` (el usuario puede seguir con o sin distorsión marcada).

## Paso 4 — Evidencias (mejorar IA + inline)

- Header compacto + termómetro como hoy.
- Quitar la tarjeta vieja "Patrón cognitivo detectado" (ya vive en paso 3, sin duplicar).
- **IA inline**: las sugerencias de la IA aparecen **dentro de cada lista** (a favor / en contra), justo debajo del header de esa lista, no al final del scroll. Cada sugerencia es un chip con `+` que la agrega directamente.
- Mejorar la calidad de la IA en `suggest-evidence`:
  - Pasar también `distortionKey` y `emotion` para contextualizar.
  - Prompt: "Evaluá si el pensamiento '{thought}' se sostiene dado el evento OBJETIVO '{trigger}'. Devolvé 3 evidencias {a favor / en contra} concretas, observables, basadas en el evento. Nada genérico, nada que el usuario ya escribió."
  - Filtrar duplicados contra `existing`.
- Cuando la IA termina, el panel de sugerencias aparece **encima de la lista correspondiente**, no flotando al final.

## Paso 5 — Tratamiento (rehacer ambos caminos)

Quitar scroll largo. Layout más interactivo.

### Camino A — Reestructuración Racional
Una sola tarjeta principal con tabs internas o pasos verticales muy compactos:
1. **Resumen mini** (1 línea): emoción · pensamiento · % en contra.
2. **Generar alternativa con IA** (botón grande): la IA toma pensamiento + evidencias en contra + distorsión y devuelve 3 alternativas balanceadas. Aparecen como cards seleccionables; al tocar una se carga al textarea editable.
3. **Textarea** del pensamiento alternativo (auto-rellenado, editable).
4. **Slider de re-evaluación** + microanimación cuando baja >20.

Sin tarjeta "Camino sugerido" gigante; queda como un chip arriba.

Nueva edge function `suggest-alternatives` (o reutilizar `analyze-thought` con un mode nuevo `alternatives`).

### Camino B — Modificación Conductual
Un solo flujo vertical:
1. **Lluvia de ideas** (textarea pequeño).
2. **Sugerir plan con IA** (botón). La IA usa lluvia + pensamiento + evento y devuelve **acciones estructuradas** (no texto plano):
   ```json
   { "actions": [ { "what": "...", "when": "...", "why": "..." }, ... ] }
   ```
3. Cada acción sugerida aparece como card con botón **"Sumar al plan"** → se agrega editable a `actionPlan`.
4. **Planificador** vertical compacto (como ahora pero más chico) debajo. Cada fila: input acción + input cuándo + X. Botón "+ Sumar acción manual".

Actualizar `suggest-behavior-plan` para devolver `actions[]` estructuradas y aceptar `distortionKey`.

---

## Cambios técnicos resumidos

### Archivos a editar
- `src/lib/pensamientos/state.ts` — añadir `step` hasta 5, `aiTips: string[]`, `aiCandidates: string[]`, ampliar `aiSuggestions` a `{what,when,why}[]`.
- `src/lib/pensamientos/distortionDetector.ts` — descripciones alineadas con el documento, agregar `example`.
- `src/components/pensamientos/steps/Step1FiltroMental.tsx` — compactar.
- `src/components/pensamientos/steps/Step2Captura.tsx` — IA con modos identify/refine, sugerencias inline.
- `src/components/pensamientos/steps/Step4Tratamiento.tsx` → renombrar a `Step5Tratamiento.tsx` y rehacer.
- `src/components/pensamientos/steps/Step3Evidencias.tsx` → renombrar a `Step4Evidencias.tsx`, sugerencias inline.
- `src/pages/pensamientos/PensamientosAutomaticos.tsx` — `TOTAL=5`, lógica `goNext` para nuevo paso 3.
- `supabase/functions/analyze-thought/index.ts` — soportar modo `identify` / `refine` / `alternatives`.
- `supabase/functions/suggest-evidence/index.ts` — mejor prompt + contexto.
- `supabase/functions/suggest-behavior-plan/index.ts` — devolver `actions[]` estructuradas.

### Archivos a crear
- `src/components/pensamientos/steps/Step3Distorsion.tsx` (nuevo).
- `src/components/pensamientos/pieces/DistortionPicker.tsx` (chips de selección manual).

### Sin cambios de schema
La tabla `thought_records` ya tiene `distortion_key`, `distortion_label`, `is_real_problem`, `action_plan` (jsonb) — alcanza para guardar la versión nueva.

---

## Criterios de aceptación
- Paso 1 entra completo en 390×743 sin scroll del contenido.
- Paso 2: la IA, sin pensamiento escrito, devuelve tips + 2 candidatos; con pensamiento, devuelve fáctica + 2 preguntas. Las sugerencias caen pegadas al textarea.
- Paso 3 muestra distorsión detectada con definición clínica del documento o permite elegirla manualmente.
- Paso 4: sugerencias IA aparecen dentro del bloque "a favor" o "en contra" correspondiente.
- Paso 5: alternativa o plan se generan con IA y se aceptan con un toque, sin que el usuario tenga que copiar/pegar.
