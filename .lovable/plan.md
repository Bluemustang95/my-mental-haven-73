
# Ajustes de Inicio y Mi Proceso

## 1. Inicio (`src/pages/Dashboard.tsx`)

### 1.1 Restaurar viñetas guía (camino del día)
Volver a incluir el bloque "Tu camino de hoy" como lista de checklist con viñetas circulares (`○` vacía / `●` llena con check) y línea conectora vertical, que guíe al usuario por el flujo recomendado:

```text
●───  Valoración de la mañana          [Hecho / Comenzar]
│
○───  Recurso recomendado
│
○───  Valoración de la noche
```

- Renderizar arriba de la grid de widgets (no reemplaza widgets, los complementa como índice).
- Cada viñeta es tappable y baja al widget correspondiente o abre el modal directo.
- Estado `done` se calcula con `morningDone`, `nightDone` y un check sobre `recommended_resource_log` para el recurso del día.

### 1.2 Tipografía
Revertir el header a la escala anterior, más sobria:
- Saludo: `text-[11px]` mayúscula tracking normal, sin `font-semibold` agresivo.
- Nombre: `font-serifElegant text-[22px] font-medium` (no `26px font-bold`).
- Etiquetas de sección ("Tu progreso de hoy", "Pendientes para vos"): `text-[10px] tracking-[0.16em]` y color `text-muted-foreground` regular (sin el `/70` apagado).
- Títulos de TimelineCard: `font-display text-[14px] font-semibold` (no serif bold 16).

Objetivo: bajar el "peso" visual general, recuperar elegancia tipo iOS Health.

### 1.3 Modo edición — `src/components/home/WidgetsBoard.tsx` y `src/index.css`
**Mover widgets de lugar (lo que falta):**
- Reemplazar `WidgetCell` por items con `framer-motion` `Reorder.Group` / `Reorder.Item` para permitir arrastrar y soltar tarjetas en modo edición.
- Persistir el orden en `localStorage` (extender `WidgetState` con `order: number` y serializar el array reordenado).
- Render: en modo normal sigue siendo `grid grid-cols-2 gap-3`; en modo edición se usa `Reorder.Group` con el mismo layout grid.

**Vibración más sutil:**
- Suavizar las keyframes `animate-jiggle` y `animate-jiggle-alt` en `index.css`: bajar rotación de `±1.2deg` actual a `±0.4deg`, duración `0.6s` → `1.4s`, easing `ease-in-out`.
- Eliminar la variante "alt" desfasada para que el movimiento sea más uniforme y menos nervioso.
- Botones `X` / resize: pasarlos de fondo rojo/azul fuertes (`bg-rose-500`, `bg-resma-navy`) a un estilo más suave: círculo blanco con borde fino y glyph color, sombra ligera — coherente con iOS.

### 1.4 Top bar de edición
- `EditTopBar`: pasar de los chips actuales (`bg-resma-navy`, uppercase tracking 0.16em) a un pill blanco translúcido más fino con texto en sentence-case. "Restablecer" en gris, "Listo" en color de marca.

## 2. Mi Proceso (`src/pages/MiProceso.tsx` + componentes)

Reducir la escala global sin tocar el diseño:

- Contenedor: `pt-12` → `pt-7`, `pb-32` → `pb-24`, mantener `max-w-md`.
- H1 "Mi Proceso": `text-[26px]` → `text-[20px]`, subtítulo `text-[14px]` → `text-[12px]`.
- Etiquetas de sección uppercase: `text-[11px]` → `text-[10px]`, iconos `size={14}` → `size={11}`.
- Espaciados: `mt-7` entre bloques → `mt-5`; `my-8 h-px` divisor → `my-6`.
- `WellbeingCardV2`: bajar padding interno (`p-6` → `p-4`), score gigante de `text-[64px]` (revisar) a `text-[44px]`, sparkline altura `64` → `44`.
- `PsychometryCarousel`: tarjetas de `min-w-[260px]` → `min-w-[210px]`, alto reducido proporcionalmente, SVG arte interior con `viewBox` mantenido pero contenedor más bajo.
- `BigFiveCard`: padding e ícono reducidos un 15-20%.
- Bento 2x2 de terapia: `p-4` → `p-3.5`, icono `h-9 w-9` → `h-8 w-8`, título `text-[14px]` → `text-[12.5px]`, subtítulo `text-[11px]` → `text-[10.5px]`, gap `gap-3` → `gap-2.5`.
- Tarjeta del terapeuta Lic. Pereyra: avatar `h-12 w-12` → `h-10 w-10`, padding `p-4` → `p-3.5`, fuentes -1px.
- Sección suscripción: H2 `text-[22px]` → `text-[18px]`, padding del card `p-5` → `p-4`, ícono Crown chip `h-12 w-12` → `h-10 w-10`.

Resultado: todo el `/mi-proceso` se ve un ~15-20% más compacto, jerarquía y ritmo visual se conservan.

## Archivos a editar

- `src/pages/Dashboard.tsx` — viñetas guía + escala tipográfica.
- `src/components/home/WidgetsBoard.tsx` — `Reorder.Group`, botones X/resize suaves, orden persistido.
- `src/index.css` — keyframes `animate-jiggle` más sutiles.
- `src/pages/MiProceso.tsx` — escala compacta general.
- `src/components/proceso/WellbeingCardV2.tsx` — reducir card.
- `src/components/proceso/PsychometryCarousel.tsx` — tarjetas más chicas.
- `src/components/proceso/BigFiveCard.tsx` — padding/iconos.

## Detalles técnicos

- `Reorder.Group` de `framer-motion` necesita un array `values` y `onReorder`; pasaremos los widgets visibles. Para grid 2-col mantenemos `as="div"` y CSS grid; el drag funciona con `layout` automático.
- Persistencia de orden: añadir helper `setOrder(ids: WidgetId[])` que reescribe `widgets` ordenados antes de guardar en `localStorage`.
- Long-press para entrar a edit mode se mantiene (`useLongPress` 800ms); al estar dentro, tap normal no acciona la card (ya implementado por el `{...(!editMode ? lp : {})}`).
