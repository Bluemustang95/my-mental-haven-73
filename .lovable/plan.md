# Reducir un poco la altura del PriorityBento

## Cambio
En `src/components/home/PriorityStack.tsx`, la tarjeta usa `aspect-square` (100% alto vs ancho). Vamos a bajarla levemente para que quede un pelín más corta de largo, manteniendo el look cuadrado.

**Reemplazo:** `aspect-square` → `aspect-[1/0.88]` (≈12% menos alto).

Nada más cambia: contenido, auras, animaciones, dots y padding se mantienen. Si querés aún más corto ajustamos a `1/0.82`.
