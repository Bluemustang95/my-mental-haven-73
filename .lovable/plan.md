## 1. Inicio — todo más chico

En `src/pages/Dashboard.tsx`:
- **Zona de descanso** (rectángulo): bajar altura de `h-[150px]` a `h-[110px]`. Ícono en caja 9x9 (era 11x11), label `text-[14px]`. Glyph decorativo detrás más chico (~80).
- **Bentos cuadrados** (Pack de activación / Mini hábitos / etc.): reemplazar `aspect-square` por altura fija `h-[130px]` para que queden proporcionalmente más chicos y no se estiren con el ancho de columna.
  - En `PendingBento.tsx`: cambiar `aspect-square` → `h-[130px]`, reducir gap a `gap-2` y padding a `p-3`; ícono en caja 9x9; label `text-[13px]`.
  - En `WidgetVisual.tsx` (variante `tile` que usa Mini hábitos): mismo cambio — `aspect-square` → `h-[130px]`, padding `p-3.5`, ícono caja 10x10, label `text-[14px]`. Esto afecta solo tiles compactos (Mini hábitos, Gratitud, Notas de contención).

## 2. Mi Proceso — bentos más chicos + reordenar

En `src/components/proceso/TherapyMiniTracker.tsx` y `NextSessionCard.tsx`:

### Nuevo orden (2×2)
```
┌──────────────┐ ┌──────────────┐
│ Próx. Sesión │ │ Medicación   │
└──────────────┘ └──────────────┘
┌──────────────┐ ┌──────────────┐
│ Resumen Psico│ │ Notas Sesión │
└──────────────┘ └──────────────┘
```
Cambiar el orden en ambos grids (bloque `contactConfirmed` y bloque normal): `NextSessionCard` → `Medicación` → `Resumen Psico` → `Notas de Sesión`.

### Tamaño
- `MiniBento`: quitar `aspect-square`, poner `h-[120px]`, `gap-2`, `p-3`, ícono `size={26}`, label `text-[13px]`.
- `NextSessionCard`: mismo tratamiento — `h-[120px]`, `gap-2`, `p-3`, ícono `size={26}`, label `text-[13px]`.
- Grid: `gap-2.5` está bien.

## Alcance
Solo presentación. Archivos: `src/pages/Dashboard.tsx`, `src/components/home/PendingBento.tsx`, `src/components/home/WidgetVisual.tsx`, `src/components/proceso/TherapyMiniTracker.tsx`, `src/components/proceso/NextSessionCard.tsx`.
