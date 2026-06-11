
# Animaciones Mindfulness — Naturaleza Orgánica + Lottie

Refactor visual de los 3 ejercicios (Respiración, Hojas que pasan, Body Scan) con una dirección estética coherente: agua, tinta acuarela, hojas reales, papel y luz cálida. Paleta `#0F172A / #10B981 / #FCD34D / #FDFCFB`.

## 1. Sistema de capas reutilizable (`OrganicStage`)

Componente base que todos los ejercicios envuelven. Apila 4 capas con `mix-blend` y blur controlado:

```text
┌─ Capa 4: Partículas (polen, polvo de luz)     ── pointer-events: none
├─ Capa 3: Objeto principal (orbe / hoja / cuerpo)
├─ Capa 2: Atmósfera (gradiente animado, niebla acuarela)
└─ Capa 1: Fondo (textura papel + degradado base)
```

- `src/components/mindfulness/stage/OrganicStage.tsx` — orquesta capas vía slots.
- `src/components/mindfulness/stage/PaperBackground.tsx` — SVG noise + gradiente animado lento (Framer Motion, 20s loop).
- `src/components/mindfulness/stage/InkAtmosphere.tsx` — 3 blobs acuarela en blend `multiply`/`screen` que respiran.
- `src/components/mindfulness/stage/Particles.tsx` — 12-20 motas SVG con drift suave (CSS transform, GPU-friendly).
- `src/components/mindfulness/stage/PhaseTransition.tsx` — wrapper `AnimatePresence` con cross-fade + scale para intro→play→outro (esto resuelve el "stack de transiciones").

## 2. Lottie/Rive — qué se anima con qué

Instalamos **`@lottiefiles/dotlottie-react`** (ligero, ~30kb, soporta `.lottie` comprimido). Rive solo si hace falta interactividad por estado.

| Ejercicio | Asset | Origen |
|---|---|---|
| Respiración Orb | Lottie "breathing orb" reactivo a fase (scale driven por prop) | Custom JSON sencillo en `src/assets/lottie/orb-breath.json` |
| Body Scan | Silueta humana con glow recorriendo zonas | Lottie en `src/assets/lottie/body-scan.json` |
| Hojas que pasan — hoja real | Hoja con nervaduras y rotación natural | Lottie `leaf-fall.json` |
| Hojas — agua de fondo | Ondas suaves al apilarse pensamientos | Lottie `water-ripple.json` |

Los `.json` se incluyen en el repo (Lottie pequeños, 5-20kb cada uno). Si el usuario prefiere, los puedo generar a mano con SVG + Bodymovin-compatible JSON simple, o sustituir por componentes SVG+Motion equivalentes para los que no encontremos asset libre.

## 3. Cambios por ejercicio

### Respiración (`OrbView` + visualizers)
- Sustituir orbe actual por `<DotLottiePlayer>` controlado: `speed` y `direction` ligados a `phaseId` (inhale/hold/exhale).
- Fondo: `OrganicStage` con `InkAtmosphere` en tono `#10B981` que pulsa al ritmo de la respiración (la atmósfera respira con el usuario — efecto inmersivo clave).
- `VisualizerBox/Coherence/Sigh/Sleep` conservan su lógica pero pasan a renderizarse sobre `OrganicStage` con partículas adaptadas a cada patrón.

### Hojas que pasan (`CloudsView`)
Cambios profundos para implementar **acumulación visual** (no solo pasar y desaparecer):

- Nueva pila inferior `LeafPile`: cada hoja al terminar su recorrido se "deposita" en el suelo con física suave (rotación + asentamiento), formando un montón que crece durante la sesión.
- Contador discreto "{n} pensamientos soltados" sobre la pila.
- Hoja activa = Lottie `leaf-fall` con sway natural (reemplaza el SVG actual).
- Fondo: agua con `water-ripple` Lottie en loop muy lento bajo todo.
- Variantes `cloud`/`train` se mantienen, pero renderizadas con la misma paleta naturaleza (nube = acuarela blanca translúcida, tren = papel kraft).

### Body Scan (`BodyScanView`)
- Silueta Lottie con glow que se desplaza por la zona indicada (cabeza→hombros→pecho…).
- Capa de partículas que se concentran en la zona activa.
- Onda expansiva sutil cuando cambia de zona (`PhaseTransition`).

## 4. Transiciones intro → ejercicio → outro

Hoy son cortes con fade simple. Se unifican vía `<PhaseTransition>`:
- Intro: texto sube + atmósfera entra desde abajo (acuarela floreciendo).
- Play: cross-dissolve, partículas heredan estado.
- Outro: objeto principal se disuelve hacia arriba en motas de luz dorada (`#FCD34D`).

## 5. Detalles técnicos

- Dependencia nueva: `@lottiefiles/dotlottie-react` (única). Sin Three.js, sin Rive por ahora.
- Lotties guardados en `src/assets/lottie/*.json` (importados como JSON, tree-shakeable).
- Respeto a `prefers-reduced-motion`: `OrganicStage` desactiva atmósfera/partículas y los Lottie quedan en frame estático.
- Mobile-first: las capas usan `transform`/`opacity` (compositor GPU). Partículas limitadas a 20 máx.
- No se toca lógica de timers, audio, voz, registro de sesión ni schemas. Solo presentación.

## Fuera de alcance

- Rive interactivo (queda como opción futura si querés estados complejos tipo "el orbe reacciona al micrófono").
- Three.js / WebGL.
- Rediseño de los menús de setup (PatternSetupScreen, TimeSetupScreen) — solo del ejercicio en sí.
- Generación de los Lottie JSON desde cero con detalle artístico de animador profesional; uso assets sencillos y los enriquezco con las capas Motion del stage.

## Archivos a crear

- `src/components/mindfulness/stage/OrganicStage.tsx`
- `src/components/mindfulness/stage/PaperBackground.tsx`
- `src/components/mindfulness/stage/InkAtmosphere.tsx`
- `src/components/mindfulness/stage/Particles.tsx`
- `src/components/mindfulness/stage/PhaseTransition.tsx`
- `src/components/mindfulness/stage/LottieLayer.tsx` (wrapper sobre dotlottie-react)
- `src/components/mindfulness/observar/LeafPile.tsx`
- `src/assets/lottie/orb-breath.json`, `body-scan.json`, `leaf-fall.json`, `water-ripple.json`

## Archivos a modificar

- `src/components/mindfulness/breathing/OrbView.tsx`
- `src/components/mindfulness/breathing/BodyScanView.tsx`
- `src/components/mindfulness/breathing/visuals/Visualizer{Box,Coherence,Sigh,Sleep}.tsx` (envoltura en OrganicStage)
- `src/components/mindfulness/observar/CloudsView.tsx` (acumulación + Lottie hoja)
- `package.json` (+ dotlottie-react)
