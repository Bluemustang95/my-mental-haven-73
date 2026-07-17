# Rediseño PriorityStack → PriorityBento cuadrado

## Alcance
Reemplazar el comportamiento actual de `src/components/home/PriorityStack.tsx` por una única tarjeta **cuadrada tipo Bento** con glassmorphism premium y ciclo interactivo entre 3 fases fijas del día (Mañana / Medio día / Noche). Nada más se toca fuera de este componente y de los datos que `Dashboard.tsx` le pasa.

## Cambios

### 1. Simplificación de contenido
- Eliminar el botón "Siguiente prioridad →" del header interno.
- Eliminar los microtítulos ("Enfoque principal" / peek stack detrás).
- Ya no se apilan tarjetas "peek": queda **una sola tarjeta cuadrada** grande.
- El ciclo no es "undone first → done abajo"; ahora es un **carrusel de 3 fases fijas** que rota al tocar la tarjeta (tap = siguiente fase).

### 2. Contrato de datos
`Dashboard.tsx` ya arma `priorityCards` con 3 entradas (mañana / práctica / noche). Se mantiene el tipo `PriorityCard` existente para no romper el llamador. Internamente el nuevo componente:
- Toma las 3 primeras cards.
- Mapea cada una a una fase visual (`morning` | `midday` | `night`) por índice.
- Al tocar la tarjeta: si la card actual **no está `done`** → dispara `onAction()` (misma acción actual). Si ya está `done` **o** el usuario toca el indicador de puntos → avanza a la siguiente fase. Esto preserva el CTA principal sin necesidad de un botón visible.

### 3. Estilo glassmorphic
Tarjeta cuadrada con `aspect-square`, radio grande (rounded-[32px]) y:
```
background: rgba(255,255,255,0.45);
backdrop-filter: blur(25px);
border: 1px solid rgba(255,255,255,0.6);
box-shadow: 0 20px 60px -24px rgba(16,25,39,0.25);
```
Encima, un gradiente sutil interno por fase (ámbar / turquesa / índigo) al 15-20% de opacidad para que el "vidrio" tome color sin perder legibilidad.

### 4. Auras de fondo dinámicas (Aura Bleeding)
Detrás de la tarjeta (dentro del mismo componente, en `position:absolute` con `-z-10`, no toco los blobs globales del Dashboard) se dibujan **2 blobs difuminados grandes** cuyo color cambia por fase con `transition-colors duration-700`:
- Mañana: `#facb60` + `#fbbf24`
- Medio día: `#7cc2c8` + `#a7f3d0`
- Noche: `#818cf8` + `#4c1d95`

### 5. Máquina de estados (3 fases)
`useState<0|1|2>` para la fase activa. Config por fase:

| Fase | Tag | Clases del chip | Gráfico SVG | Animación |
|---|---|---|---|---|
| Mañana | "Prioridad Mañana" | `bg-amber-100/80 text-amber-800 border-amber-200/40` | Sol lineal (rayos) | `animate-[spin_25s_linear_infinite]` |
| Medio día | "Práctica Recomendada" | `bg-teal-100/80 text-teal-800 border-teal-200/40` | Espiral concéntrica | `animate-[float-slow_4s_ease-in-out_infinite]` |
| Noche | "Prioridad Noche" | `bg-indigo-100/80 text-indigo-900 border-indigo-200/40` | Luna creciente + estrellas titilantes | float + `animate-pulse` en estrellas |

Los 3 SVG se dibujan inline en el componente con `stroke-width` fino, sin dependencias nuevas.

### 6. Microinteracciones
- Al presionar la tarjeta completa: `active:scale-[0.96]` con `transition: transform .4s cubic-bezier(0.175,0.885,0.32,1.275)` (spring bounce).
- Transición de fase: `AnimatePresence` de framer-motion (ya usado en el archivo) con fade 500ms para título, chip, SVG y aura.
- Indicador de paginación **abajo a la izquierda** dentro de la tarjeta: 3 dots, el activo se expande a `w-6` con el color de marca de la fase (ámbar/turquesa/índigo); los inactivos `w-1.5 bg-black/15`. Clickeable para saltar a la fase.
- Se elimina el chip "hecho ✓" grande — si la card está `done` se muestra un pequeño check discreto junto al título.

### 7. Keyframes
Agregar en `tailwind.config.ts` (extend.keyframes/animation) si no existen:
- `spin-slow` (25s) — puede quedar como utility inline `animate-[spin_25s_linear_infinite]` (no requiere config).
- `float-slow` — traslación vertical ±6px, 4s ease-in-out infinite. Se agrega al config.
- `twinkle` — opacity 0.3↔1, 2s infinite, para estrellas.

### 8. Accesibilidad y reduced-motion
- La tarjeta es `<button>` con `aria-label` describiendo la fase actual.
- Con `prefers-reduced-motion: reduce` se desactivan spin/float/twinkle (usando `motion-safe:` prefixes).

## Archivos
- **Modificado**: `src/components/home/PriorityStack.tsx` — reescritura completa del componente (mismo export, misma firma `PriorityStack({ cards })`). Mantengo el tipo `PriorityCard` exportado para que `Dashboard.tsx` no cambie.
- **Modificado**: `tailwind.config.ts` — agregar keyframes `float-slow` y `twinkle` si faltan.
- **Sin tocar**: `Dashboard.tsx`, `WidgetsBoard.tsx`, el resto del sistema de widgets, glows globales.

## Detalles técnicos
- Componentes framer-motion ya presentes en el archivo (`motion`, `AnimatePresence`) — no hay dependencias nuevas.
- El componente sigue siendo mobile-first (~360px de ancho útil), la tarjeta cuadrada queda ~330×330 px en un iPhone estándar, con padding interno de 24px.
- Al tocar la tarjeta con card `done: true`, avanzamos fase (para no re-abrir un flujo ya completado). Si querés que siempre dispare `onAction`, se ajusta en implementación.

¿Confirmás para implementar?
