# Quitar franja blanca al pie

## Causa
`AppLayout` envuelve cada página con `min-h-screen bg-background pb-20`. Las páginas internas (como Psicoeducación) ya son `min-h-screen` con su propio `pb-32` oscuro. El `pb-20` del layout agrega 80 px extra debajo de la página con el color `bg-background` (crema), que aparece como franja blanca detrás del BottomNav flotante al hacer scroll.

## Cambio
En `src/components/layout/AppLayout.tsx`:
- Quitar `pb-20` del wrapper (el BottomNav es `position: fixed`, no necesita reservar espacio; cada página ya define su propio padding inferior).
- Cambiar `bg-background` a `bg-[#0B0B10]` para que, si alguna página no llena el alto, el fondo coincida con el dark mode de la app y no se vea crema.

## Fuera de alcance
- No tocar páginas individuales.
- No tocar BottomNav.

## Archivo
- `src/components/layout/AppLayout.tsx`
