## Fix "Bajar Ansiedad": fondo unificado a pantalla completa

**Problema**: el SVG de `VisualizerSigh` pinta su propio gradiente verde (`#0d1f1f → #1a3838`) sobre un rectángulo `340×280` con aspect ratio preservado, mientras el contenedor del player usa otro gradiente (`#0b2a2c → #14545a`). Resultado: una franja verde más clara con bordes verdes oscuros arriba y abajo.

### Cambios en `src/pages/mindfulness/BreathingHome.tsx`

1. **`VisualizerSigh`**: eliminar el `background` del `<svg>` y hacer que el SVG cubra todo el área disponible.
   - Contenedor wrapper `absolute inset-0` sin `flex/justify-center`.
   - `<svg>` con `width:"100%" height:"100%"` y `preserveAspectRatio="xMidYMid slice"` para que el viewBox se estire/cropee y no deje bandas.
   - Quitar el `style={{ background: ... }}` del SVG por completo (el fondo lo aporta el contenedor padre del player).

2. **`PATTERN_BG.sigh`** (línea 525): unificar al mismo verde profundo que usa el visualizador para que la transición sea imperceptible y sea un único tono. Nuevo gradiente vertical:
   `linear-gradient(180deg, #0d1f1f 0%, #16302f 60%, #0d1f1f 100%)`.

### Sin cambios
- Lógica de respiración, fases, halo, bola, máscara de fade.
- Otros visualizadores ni UI superpuesta.
