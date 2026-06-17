# Plan: Visibilidad + Interactividad del Workspace DBT

## Problema confirmado

Estás en `/diario-inteligente/regulacion-emocional` (renderizado por `src/pages/DiarioInteligente.tsx`), que muestra un grid genérico de `algo_sub_resources` (fallback: Respiración consciente, Mira el presente, Ver los hechos). El módulo nuevo vive en `src/pages/EmotionalRegulation.tsx` (ruta `/herramientas/regulacion-emocional`), por eso desde el Diario no se ve. Hay que enlazarlo desde acá también.

---

## Fase 0 · Fix de visibilidad (rápido, primero)

**`src/pages/DiarioInteligente.tsx`**
- Cuando `slug === "regulacion-emocional"`, inyectar una tarjeta destacada arriba del grid: **"Cambiar respuestas emocionales · DBT Fichas 8–13"** con badge PREMIUM, gradiente teal/gold, que navega a `/herramientas/cambiar-respuestas`.
- Tarjeta secundaria: **"Habilidades STOP & TIPP"** → `/herramientas/regulacion-emocional`.
- El grid antiguo (ejercicios sueltos) queda debajo bajo el título "Otros ejercicios".

Sin migraciones; sólo UI condicional por slug.

---

## Fase 1 · Microinteracciones de calidad (base sensorial)

Aplican a todo el wizard de `CambiarRespuestas`:

- **Framer-motion entre pasos**: wrapper `<AnimatePresence mode="wait">` con slide+fade direccional (+x al avanzar, −x al retroceder). Direction tracked en el reducer.
- **Auto-save visual**: chip flotante "Guardado ✓" (esquina inf-der, fade 1.5s) cada vez que el reducer persiste a localStorage.
- **Estado "pensando" en IA**: reemplazar spinner por skeleton shimmer dentro de `AiResponseModal` mientras llega la respuesta.
- **Haptic mobile**: helper `vibrate(pattern)` en confirmaciones (`navigator.vibrate?.(15)` por paso, `[20,40,20]` al cerrar sesión).
- **Pulso dorado final**: en pantalla "Sesión guardada", anillo `radial-gradient` gold expandiéndose 1.2s + confetti suave (canvas-confetti dynamic import, sólo en ese momento).

Archivos: `src/hooks/useHaptics.ts` (nuevo), `src/components/dbt/SaveIndicator.tsx` (nuevo), `src/components/dbt/AiSkeleton.tsx` (nuevo), edits en `CambiarRespuestas.tsx` y `AiResponseModal.tsx`.

---

## Fase 2 · Visualización del proceso

- **Timeline de la sesión** (`src/components/dbt/SessionTimeline.tsx`):
  - Barra horizontal sticky bajo el header, nodos = pasos completados.
  - Tap en un nodo → reducer action `JUMP_TO_STEP` (mantiene datos posteriores, los marca como "necesita revisión" sin borrar).
  - Estados: completado (teal sólido), actual (gold con halo), futuro (gris).

- **Mapa de decisión animado para Ficha 9** (`src/components/dbt/DecisionTreeSVG.tsx`):
  - Reemplaza los botones actuales por SVG inline con 2 ramas (Problem Solving / Opposite Action).
  - Al elegir, la rama seleccionada se ilumina (stroke-dasharray animado) y la otra se atenúa.
  - Nodo final pulsa antes de auto-avanzar.

- **Comparador antes/después** (`src/components/dbt/BeforeAfterCompare.tsx`):
  - Nueva pantalla final con dos tarjetas glass lado a lado:
    - Tarjeta izquierda (rojiza): interpretación inicial + impulso original.
    - Tarjeta derecha (teal): hecho verificado + acción opuesta / solución elegida.
  - Botón "Compartir resumen" (genera imagen vía `html-to-image`, opcional fase posterior).

---

## Fase 3 · Rueda de emociones Plutchik

`src/components/dbt/EmotionWheelSVG.tsx` reemplaza `EmotionGrid`:

- SVG nativo, 8 sectores primarios (alegría, confianza, miedo, sorpresa, tristeza, asco, ira, anticipación) en 3 anillos de intensidad.
- Tap en sector primario → anima expansión y revela matices del anillo exterior (ira → frustración, resentimiento, fastidio, furia).
- Tap en matiz → confirma selección, escribe `selectedEmotion` + `emotionIntensity` (derivado del anillo) al reducer.
- Animación: `motion.path` con `pathLength` y rotación suave.
- Dataset estático en `src/lib/dbt/emotionWheel.ts` (~24 emociones con color HSL teal-to-coral).

---

## Fase 4 · Interacción guiada por IA

### 4.1 Sugerencias inline (hechos vs. juicios)
- Hook `src/hooks/useFactJudgmentHighlight.ts`: debounce 800ms sobre el textarea de "Descripción del evento" e "Interpretaciones".
- Llama a `dbt-ai` con nueva task `highlight-judgments` (devuelve array `{start, end, kind: "judgment"|"interpretation", reason}`).
- Render: overlay div con mismo line-height, spans con `bg-yellow-200/40 underline decoration-dotted`, tooltip on hover/tap mostrando `reason`.

### 4.2 Reformulación de un toque
- Junto a cada span destacado: botón flotante `✨ Reformular como hecho`.
- Llama task `rephrase-as-fact` → reemplaza el span en el textarea con la versión neutra; queda en undo stack 5s.

### 4.3 Chat socrático lateral
- `src/components/dbt/SocraticDrawer.tsx`: panel deslizable derecha (Sheet de shadcn), trigger "Hablar con la guía" disponible en pasos clave (descripción, interpretaciones, elección de solución).
- Edge function nueva `dbt-socratic` con `streamText` (AI SDK + Lovable Gateway, `google/gemini-3-flash-preview`) que conduce 2–3 turnos de preguntas antes de devolver un cierre estructurado (`{question?, summary?}` por turno).
- Al cerrar el drawer, opción "Usar este resumen" inserta el texto destilado en el campo del paso.

**Backend**: actualizar `supabase/functions/dbt-ai/index.ts` para los 2 tasks nuevos. Nueva función `dbt-socratic` para streaming.

---

## Fase 5 · Continuidad entre sesiones

### 5.1 Reabrir borrador
- En `CambiarRespuestas` al montar: si existe `localStorage["dbt-change-response-draft"]` con `updatedAt` > 1h y < 30d, mostrar banner sticky "Tenés una sesión sin terminar de hace X, ¿continuar?" con [Continuar] [Empezar nueva].

### 5.2 Patrones detectados
- Query agregada en `EmotionalRegulation` (sólo si user premium y completed_sessions % 5 === 0):
  - Lee últimas 5 filas de `dbt_emotion_sessions`.
  - Llama task `detect-patterns` en `dbt-ai`.
  - Render: tarjeta "Resmita observa…" con el insight (ej. "En 4 de 5 sesiones la emoción fue ira ante crítica de pareja").
- Persiste el insight en columna nueva `insight_text` de `patient_app_profiles` (o tabla `dbt_insights` simple) para no recalcular.

**Migración**: tabla nueva `dbt_insights (id, user_id, generated_at, insight_text, session_ids jsonb)` con RLS + GRANTs estándar.

---

## Orden de implementación sugerido

```text
F0 (fix visibilidad)           ← 1 archivo, 5 min
F1 (microinteracciones)        ← base sensorial, mejora todo
F2 (timeline + decision tree + before/after)
F3 (rueda Plutchik)            ← reemplaza grid actual
F4 (IA inline + socrático)     ← edge functions nuevas
F5 (borrador + patrones)       ← migración + insight
```

Podés aprobar todo el plan o pedirme avanzar sólo por fases (ej. "F0 + F1 primero").

## Detalles técnicos

- **AI SDK**: `streamText` con Lovable Gateway provider para el chat socrático; `generateText` + `Output.object` (Zod) para `highlight-judgments`, `rephrase-as-fact`, `detect-patterns`. Schemas mínimos (Gemini odia enums largos).
- **Reducer**: agregar acciones `JUMP_TO_STEP`, `SET_DIRECTION`, `SET_EMOTION_INTENSITY`, `APPLY_REPHRASE`.
- **Sin lucide para los nuevos íconos clínicos** (mantengo regla previa): SVG inline en `dbt/icons.tsx`.
- **Confetti**: `canvas-confetti` lazy-import sólo en pantalla final.
- **Premium gating**: ya cubierto por `PremiumLock` en la ruta; las nuevas tarjetas en Diario muestran candado para free.
- **No tocar**: `client.ts`, `types.ts`, `.env`, `config.toml`.