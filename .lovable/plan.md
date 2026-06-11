# Integración de Lottie reales en Mindfulness

Mapeo confirmado de los 4 JSON que adjuntaste:

| # | Archivo | Destino |
|---|---|---|
| 1 | `d49b58fa-...json` | **Respiración → Coherencia 5-5** (`VisualizerCoherence`) |
| 2 | `6c1c1530-...json` | **Respiración → 4-7-8** (visualizer del patrón `box`/`478`) |
| 3 | `1a80a862-...json` | **Body Scan** (`BodyScanView`) |
| 4 | `0fd8d976-...json` | **Hojas que pasan** (`CloudsView` – hoja activa) |

## 1. Dependencia

- Instalar `lottie-react` (ligero, runtime estable, compatible con JSON v4/v5 que enviaste).
- No uso `dotlottie` porque tus archivos son `.json` clásicos, no `.lottie` comprimidos.

## 2. Guardado de assets

Los JSON se guardan en el repo bajo:
```
src/assets/lottie/
├── breath-coherence-55.json   ← archivo 1
├── breath-478.json            ← archivo 2
├── body-scan.json             ← archivo 3
└── leaf-fall.json             ← archivo 4
```
Tamaños ~5–25 KB cada uno, OK para bundle directo (import as JSON).

## 3. Componente wrapper

Nuevo `src/components/mindfulness/stage/LottiePlayer.tsx`:
- Envuelve `<Lottie animationData speed loop />`.
- Props: `data`, `loop` (default true), `speed` (default 1), `className`, `style`.
- Respeta `prefers-reduced-motion` → renderiza primer frame estático.

## 4. Cambios por ejercicio

### Respiración – Coherencia 5-5
- `src/components/mindfulness/breathing/visuals/VisualizerCoherence.tsx`: reemplazar el círculo SVG actual por `<LottiePlayer data={breathCoherence55} />` centrado dentro del `OrganicStage` ya existente. Velocidad ligada al ciclo (10s total = speed ≈ duración nativa del Lottie / 10).

### Respiración – 4-7-8
- El visualizer 4-7-8 actual está en `VisualizerBox.tsx` / `VisualizerSigh.tsx` (uno por patrón). Hay que identificar cuál corresponde al patrón `478` en `src/lib/breathingPatterns.ts` y sustituir su animación principal por `<LottiePlayer data={breath478} loop speed={...} />`.
- El Lottie ya trae los textos INHALE/HOLD/EXHALE animados; ocultamos el label de fase redundante mientras está visible.

### Body Scan
- `src/components/mindfulness/breathing/BodyScanView.tsx`: el orbe/onda actual se reemplaza por `<LottiePlayer data={bodyScan} />` como capa principal dentro del `OrganicStage`. La lógica de zonas y timers no cambia.

### Hojas que pasan
- `src/components/mindfulness/observar/CloudsView.tsx`: la hoja activa (cuando `variant === "leaf"`) renderiza el Lottie `leafFall` en lugar del SVG actual. El Lottie ya hace la trayectoria de caída con sway natural, así que retiramos el `motion.div` que la animaba con `framer-motion` (mantenemos solo el wrapper de posición y el `onAnimationComplete` para enviar al `LeafPile`).
- Variantes `cloud` y `train` quedan como están.

## 5. Detalles técnicos

- Import JSON: `import data from "@/assets/lottie/breath-coherence-55.json"` (Vite lo maneja nativamente).
- `lottie-react` se agrega a `package.json` (única dependencia nueva).
- Sin cambios en backend, timers, audio ni schemas.
- Sin tocar `BodyScanManager.tsx` (admin) — los Lotties van hardcoded como assets del ejercicio, no como contenido editable. Si más adelante querés que el admin pueda swappearlos, lo planificamos aparte.

## Archivos a crear
- `src/assets/lottie/breath-coherence-55.json`
- `src/assets/lottie/breath-478.json`
- `src/assets/lottie/body-scan.json`
- `src/assets/lottie/leaf-fall.json`
- `src/components/mindfulness/stage/LottiePlayer.tsx`

## Archivos a modificar
- `package.json` (+ `lottie-react`)
- `src/components/mindfulness/breathing/visuals/VisualizerCoherence.tsx`
- Visualizer correspondiente al patrón 4-7-8 (a confirmar al abrir `breathingPatterns.ts`)
- `src/components/mindfulness/breathing/BodyScanView.tsx`
- `src/components/mindfulness/observar/CloudsView.tsx`

## Fuera de alcance
- Editor admin para subir/reemplazar Lotties.
- Sincronización frame-a-frame del Lottie con la fase exacta del timer (uso `speed` constante calibrado; basta para el efecto).
- Generar nuevos Lotties o modificar los que enviaste.
