## Rediseño de `VisualizerSigh` (en `src/pages/mindfulness/BreathingHome.tsx`, líneas 926–999)

Reemplazar la implementación actual (onda seno repetida + bola con `xRaw % W`) por una **campana gaussiana única, centrada, que respira en sincronía con la bola**.

### Cambios precisos

1. **Eliminar** `cyclesRef`, `prevPhaseRef`, el `useEffect` que cuenta ciclos, `xInCycle`, `xRaw`, `ballX` y la lógica `% W`. La bola queda fija en `cx = W/2`.

2. **Curva gaussiana centrada** (en lugar de seno):
   ```ts
   y(x) = midY − amp · exp(−(x − midX)² / (2σ²))
   ```
   con `σ ≈ 70`, `midX = W/2`, `midY ≈ H/2 + 30` (baseline algo abajo del centro para que la cresta tenga aire arriba).

3. **Amplitud y `cy` interpolados juntos** con el mismo easing:
   ```ts
   const easeInOutSine = (t) => -(Math.cos(Math.PI*t) - 1) / 2;
   let t = 0;
   if (phase.id === "inhale")  t = easeInOutSine(progress);
   else if (phase.id === "hold")    t = 1;          // fijo, sin drift
   else if (phase.id === "exhale")  t = easeInOutSine(1 - progress);
   const amp   = restAmp + (peakAmp - restAmp) * t;  // restAmp≈6, peakAmp≈78
   const ballY = midY - amp;
   const haloR = 22 + 26 * t;
   ```
   El path se recalcula vía `useMemo([amp])` cada frame que cambia la amplitud, así la onda "infla/desinfla" con la bola.

4. **Máscara de fade lateral** (no clip):
   - `<linearGradient id="sighFadeMask">` con stops `0→#000, 0.18→#fff, 0.82→#fff, 1→#000`.
   - `<mask id="sighMask">` con un `<rect>` que usa ese gradiente.
   - Aplicar `mask="url(#sighMask)"` al grupo que contiene la curva y el área de relleno.

5. **Área de relleno bajo la curva**:
   - Path cerrado: `pathD + " L W H L 0 H Z"`.
   - Relleno con `<linearGradient id="sighArea" y1=0 y2=1>` de `#7cc2c8 @ 0.12` a `#7cc2c8 @ 0`.

6. **Halo radial detrás de la bola**:
   - `<radialGradient id="sighHalo">` (`#bfeef1@0.55 → #7cc2c8@0.18 → #7cc2c8@0`).
   - `<circle cx={W/2} cy={ballY} r={haloR}>` con `fill="url(#sighHalo)"`. Sin animación CSS — el radio se actualiza por estado, sin parpadeo.

7. **Stroke de la curva**: `strokeWidth={1.8}`, `strokeLinecap="round"`, color `#7cc2c8` con opacidad ~0.9. Se elimina el `linearGradient` horizontal del stroke (la opacidad lateral la da la máscara).

8. **Bola**: `<circle cx={W/2} cy={ballY} r={9}>` con `fill="url(#sighBall)"` (mantener radialGradient blanco→turquesa) y `filter: drop-shadow(0 4px 14px rgba(124,194,200,0.55))`. Quitar la `transition` CSS sobre `cx/cy` — ya no hace falta porque `progress` se actualiza suavemente.

9. SVG container: `viewBox="0 0 360 200"`, `className="w-[100%] h-[80%]"` (un poco más alto para que entre la cresta).

### Lo que NO cambia
- Patrón 4-2-6 (inhala-sostén-exhala) en `PATTERNS`.
- Voz, cues, layout del player (header, timer, pausar/detener, ajustes).
- Sonidos ambientales y los demás visualizadores (`VisualizerSleep`, `VisualizerBox`, `VisualizerCoherence`).
- Cualquier otro archivo del proyecto.

### Resultado
Una única curva tipo "colina" centrada, con bordes que se desvanecen suavemente. La bola flota anclada al centro, subiendo durante los 4s de inhalación, quedando perfectamente quieta en la cresta durante los 2s de sostén, y bajando despacio durante los 6s de exhalación, acompañada por un halo difuso que respira con ella.