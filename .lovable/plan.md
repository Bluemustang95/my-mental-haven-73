
## Objetivo

Reemplazar el wizard actual de 4 pasos de Gestión de Pensamientos por un flujo TCC de 8 pasos, manteniendo el Hub (`/herramientas/pensamientos`), eliminando el `ModeloCognitivoIntro` previo, y reemplazando la psicoeducación por un modal serif accesible desde el "?" del header en cada paso. Agregar IA acompañante real (Lovable AI Gateway) en un drawer flotante.

## 1. Migración de base de datos

Ampliar `thought_records` con columnas tipadas para los nuevos pasos:

- `sub_emotions text[]` — subemociones seleccionadas en Paso 3
- `behavior text` — conducta del Paso 4
- `body_sensations text[]` — sensaciones corporales seleccionadas (Paso 5)
- `distortions jsonb` — array `[{key, label}]` (Paso 7, múltiples)
- `resolution_mode text` — `"reestructuracion" | "abordaje"` (Paso 8)
- `resolution_plan text` — plan de acción cuando es Abordaje

Mantener las columnas existentes (`situation`, `automatic_thought`, `emotion`, `emotion_intensity`, `evidence_for_json`, `evidence_against_json`, `distortion_key`/`label`, `alternative_thought`, `is_real_problem`). Las nuevas son nullable; los registros viejos siguen abriéndose.

## 2. Pasos del wizard (8)

```
1. Situación (texto)            - Identificar
2. Pensamiento automático       - Identificar
3. Emociones + subemociones     - Identificar
4. Conducta                     - Identificar
5. Sensaciones corporales       - Identificar (orden dinámico)
6. Balanza de evidencias        - Evaluar
7. Distorsiones (bento 2x2)     - Evaluar
8. Resolución (bifurcada)       - Reestructurar
```

Datos clínicos en `src/lib/pensamientos/`:
- `emotions.ts` (existente, extender): por cada emoción principal, lista de subemociones y de sensaciones corporales asociadas (chest tightness ↔ ansiedad, nudo en garganta ↔ tristeza/ansiedad, mandíbula apretada ↔ enojo, etc).
- `bodySensations.ts` (nuevo): catálogo de ~12 sensaciones con `id`, `label`, `emoji`, `linkedEmotions[]`.
- `distortions.ts` (nuevo): los 4 sesgos del bento (Dicotómico, Catastrófico, Lectura de mente, Descalificar lo positivo) con icono/emoji y descripción corta.

## 3. Componentes nuevos en `src/components/pensamientos/steps/`

- `Step1Situacion.tsx` — textarea + tip-callout (cámara de video).
- `Step2Pensamiento.tsx` — textarea + tip-callout cerebro.
- `Step3Emociones.tsx` — grilla 2x3 de emociones; al elegir se expande panel de subemociones (chips multi-select); slider de intensidad 1-100.
- `Step4Conducta.tsx` — textarea simple.
- `Step5Sensaciones.tsx` — grid 2 columnas; sensaciones vinculadas a `draft.emotion` van primero con badge teal "Frecuente en tu sentir".
- `Step6Balanza.tsx` — refactor de `Step4Evidencias` actual con 2 contadores grandes (% A favor / En contra), botón `+` por panel, lista con eliminar individual.
- `Step7Distorsiones.tsx` — bento 2x2 multi-select.
- `Step8Resolucion.tsx` — calcula modo desde `evidenceFor/Against`. Si más en contra → "Reestructuración Cognitiva" + textarea respuesta adaptativa. Si más a favor → "Abordaje de la Problemática" + textarea plan asertivo. Banner gold "Resultado de balanza".

## 4. Shell y navegación (`WizardShell.tsx`)

- `totalSteps = 8`. Header muestra "PASO N DE 8" + título dinámico.
- Botón "?" abre `PsicoeducacionModal` (nuevo) — modal centrado tipografía serif (Lora/Playfair) con copy específico por paso (mapa `STEP_HELP[step] = { title, body, llave }`).
- Botón central ☰ abre `PasosDrawer` (nuevo) — lista los 8 pasos con check verde si completos; el nombre del paso 8 cambia dinámicamente a "Reestructuración" o "Resolución de Problema" según balanza.
- Botón Atrás: en paso 1 navega a `/herramientas/pensamientos`; resto retrocede.
- Eliminar el componente `ModeloCognitivoIntro` y dejar de mostrarlo automáticamente. Eliminar `src/components/pensamientos/intro/ModeloCognitivoIntro.tsx` y `src/lib/pensamientos/intro.ts`.

## 5. State (`state.ts`)

Bumpear key a `resma:thought-draft:v5`. Ampliar `ThoughtDraft`:

```ts
subEmotions: string[]
behavior: string
bodySensations: string[]
distortions: { key: string; label: string }[]   // reemplaza distortionKey/Label single
resolutionPlan: string
// el modo se deriva en runtime de la balanza
```

`canContinue` por paso: 1 ≥4 chars, 2 ≥8 chars, 3 emoción seleccionada, 4 ≥4 chars, 5 ≥1 sensación, 6 ≥1 evidencia total, 7 ≥1 distorsión, 8 textarea ≥10 chars.

## 6. IA acompañante (drawer flotante)

- Componente `AiCompanionDrawer.tsx` con FAB circular (icono Bot) bottom-right, persistente en todos los pasos.
- Edge function nueva `pensamientos-companion`: usa Lovable AI Gateway (`google/gemini-3-flash-preview`) vía AI SDK con `streamText`. Recibe `{ messages, draft }` y construye system prompt con contexto del registro actual (situación, pensamiento, emoción, paso actual). Tono voseo argentino, empático, con disclaimer terapéutico (regla de memoria).
- Cliente usa `useChat` (`@ai-sdk/react`) apuntando a `${VITE_SUPABASE_URL}/functions/v1/pensamientos-companion` con header `Authorization: Bearer ${VITE_SUPABASE_PUBLISHABLE_KEY}`.
- Render con `react-markdown`. Manejo de 429/402 con toasts.
- Mensaje inicial: "Hola, soy tu acompañante cognitivo. Estoy acá para ayudarte a desarmar este pensamiento, paso a paso."

## 7. Modal "?" (`PsicoeducacionModal.tsx`)

Modal centrado, fondo blur, panel glass, tipografía serif para el título (Lora). Para cada paso muestra:
- Título serif
- Cuerpo explicativo (2-3 párrafos)
- "Pregunta llave" destacada en card gold

Ejemplo Paso 2 (Pensamiento Automático): explica que son hipótesis veloces, no verdades; pregunta llave: *"¿Qué prueba tengo de que esto sea cierto?"*.

## 8. Guardado y reset

`finish()` en `PensamientosAutomaticos.tsx` mapea todo el draft a las columnas (antiguas + nuevas), incluye `resolution_mode` derivado, navega al Hub y resetea.

## 9. Archivos

**Crear:**
- `src/components/pensamientos/steps/Step1Situacion.tsx` ... `Step8Resolucion.tsx` (8 archivos)
- `src/components/pensamientos/shell/PsicoeducacionModal.tsx`
- `src/components/pensamientos/shell/PasosDrawer.tsx`
- `src/components/pensamientos/ai/AiCompanionDrawer.tsx`
- `src/lib/pensamientos/bodySensations.ts`
- `src/lib/pensamientos/distortions.ts`
- `src/lib/pensamientos/stepHelp.ts`
- `supabase/functions/pensamientos-companion/index.ts`
- `supabase/functions/_shared/ai-gateway.ts` (helper si no existe)

**Editar:**
- `src/components/pensamientos/shell/WizardShell.tsx` — header con "?" y drawer pasos
- `src/lib/pensamientos/state.ts` — v5 + nuevos campos
- `src/lib/pensamientos/emotions.ts` — agregar subemociones por categoría
- `src/pages/pensamientos/PensamientosAutomaticos.tsx` — wiring 8 pasos, sin intro, FAB IA, save
- `supabase/config.toml` — registrar `pensamientos-companion` con `verify_jwt = false` si necesario

**Eliminar:**
- `src/components/pensamientos/intro/ModeloCognitivoIntro.tsx`
- `src/lib/pensamientos/intro.ts`
- Steps obsoletos: `Step1FiltroMental.tsx`, `Step2Captura.tsx`, `Step3Distorsion.tsx`, `Step4Evidencias.tsx`, `Step5Tratamiento.tsx`

## 10. Estética

- Mantener tokens RESMA actuales (resmaTeal #7cc2c8, resmaNavy #101927, resmaGold #facb60).
- Panel glass con `backdrop-blur-xl bg-white/75`.
- Títulos de paso en serif (Playfair/Lora) ya presentes; mantener consistencia con screenshots.
- FAB IA: círculo 56px teal con icono Bot navy, badge verde de notificación al cargar.
