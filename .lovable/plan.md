## Problemas detectados

### 1) Círculo visible alrededor del Lottie (Coherencia 5-5 y 4-7-8)
En `OrbView.tsx` (líneas 147-161) hay un `<svg>` con dos `<circle>` (anillo guía + progreso) que se renderiza **siempre**, encima del Lottie. Por eso ves el círculo blanco tenue + el arco naranja en las dos pantallas.

### 2) Body Scan: los puntos rojos aparecen todos a la vez
El Lottie `body-scan.json` ya trae los 7 puntos rojos integrados en la animación y se repite en loop — no hay manera de sincronizarlos con el audio porque viven dentro del JSON.

### 3) Hojas que pasan: no aparecen hojas
El `LeafBubble` sí se monta (la variante se elige al azar 1/3 de las veces), pero el Lottie `leaf-fall.json` está dibujado con **trazos negros sobre fondo transparente**. Sobre el fondo oscuro del stage queda invisible. Además su contenedor (`h-16 w-16` = 64px) es muy chico y queda detrás de la burbuja. Por eso solo ves nubes y trenes.

---

## Cambios propuestos

### A) `OrbView.tsx` — ocultar el anillo cuando el patrón es "coherence" o "478"
Envolver el `<svg>` de los círculos en una condición:
```tsx
{pattern.id !== "coherence" && pattern.id !== "478" && (
  <svg className="absolute h-[280px] w-[280px] -rotate-90" …>…</svg>
)}
```
- Coherencia y 4-7-8 ya tienen su propia guía visual dentro del Lottie → el anillo es redundante.
- Box y Sigh lo mantienen (lo necesitan como referencia de fase).

También aplicar `style={{ filter: "drop-shadow(...)" }}` no es necesario; la halo de fondo se queda.

### B) `BodyScanView.tsx` — reemplazar el Lottie con silueta + puntos controlados
El Lottie de body scan no permite mostrar puntos uno por uno. Solución:

1. **Quitar** `<LottiePlayer data={bodyScanAnimation} />` y el import.
2. **Renderizar** una silueta SVG simple (la misma que ya existía antes) con un punto rojo por zona.
3. Mostrar **solo el punto de la zona activa** (`zoneIdx`), con animación de fade-in + pulse suave cada vez que cambia el `zoneIdx` (que ya está sincronizado con el `audio.speak(ZONES[zoneIdx].speech)`).
4. Los otros puntos quedan invisibles o con opacidad muy baja (0.1) para dar contexto de las zonas restantes.

Resultado: cuando la voz dice "Llevá la atención a tu cabeza", aparece **solo** el punto en la cabeza con un glow. Cuando pasa a "mandíbula", el punto de la cabeza se atenúa y se enciende el de la mandíbula.

Mantener el `motion.div` con el glow horizontal y el `OrganicStage`.

Eliminar `src/assets/lottie/body-scan.json` queda **fuera de scope** (no rompe nada; queda como asset huérfano por si se quiere usar después).

### C) `CloudsView.tsx` — hojas visibles
Reemplazar el Lottie invisible por un SVG inline de una hoja verde (con `fill` claro) dentro del `LeafBubble`. Mantengo:
- La caída vertical (`y: -15% → 115vh`)
- El sway pendular con framer-motion
- La burbuja `emerald-50` con el texto

Cambios concretos en `LeafBubble`:
- Quitar `<LottiePlayer data={leafFallAnimation} … />` y el import.
- Insertar un SVG inline `<svg viewBox="0 0 24 24"><path d="…leaf shape…" fill="#10B981" /></svg>` posicionado a la izquierda de la burbuja (h-10 w-10), con `drop-shadow` verde.
- Aumentar levemente el sway ya existente para que se sienta más orgánico.

El asset `leaf-fall.json` queda huérfano (fuera de scope eliminarlo).

---

## Archivos a modificar
- `src/components/mindfulness/breathing/OrbView.tsx` — condicional para el anillo
- `src/components/mindfulness/breathing/BodyScanView.tsx` — reemplazar Lottie por silueta SVG + dots por zona
- `src/components/mindfulness/observar/CloudsView.tsx` — reemplazar LeafBubble Lottie por SVG inline

## Fuera de scope
- Borrar los JSON huérfanos de Lottie.
- Cambiar Coherencia/4-7-8 (los Lotties se mantienen tal cual).
- Tocar el audio o los tiempos de zona del body scan.
