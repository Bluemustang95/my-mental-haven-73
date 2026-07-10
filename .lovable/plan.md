## 1. Inicio — layout tal cual la imagen

Estructura fija (como en la captura):

```
┌───────────────────────────────┐
│   Zona de descanso  (rect)    │  ← full-width, alto reducido (no tan grande como ahora)
└───────────────────────────────┘
┌──────────────┐ ┌──────────────┐
│ Pack activ.  │ │ Mini hábitos │  ← dos cuadrados iguales
└──────────────┘ └──────────────┘
```

Cambios en `src/pages/Dashboard.tsx`:
- El primer widget (Zona de descanso) sigue siendo `size: "full"` **rectangular**, pero con **altura acotada** (ej. `h-[180px]` o `aspect-[16/9]`) en lugar de expandirse tanto como ahora. Ese es el tamaño "de antes" que pide el usuario.
- Los siguientes tiles se renderizan en una grilla `grid-cols-2 gap-3` donde cada uno es `aspect-square`. Ahí caen Pack de activación (`PendingBento`) y Mini hábitos (`MiniHabitsWidget`), del mismo tamaño.
- Case `mini_habits`: quitar el wrapper de "widgets activos" y renderizar `<MiniHabitsWidget />` como tile plano cuadrado (sin header ni borde extra).
- `PendingBento` ya está en `aspect-square` — mantener.

## 2. Quitar "Enfoque prioritario" duplicado en modo edición

En `Dashboard.tsx` `PriorityStack` se renderiza dos veces:
- Línea ~373: `<PriorityStack cards={priorityCards} />` (siempre visible)
- Línea ~405: dentro de `EditSlots` como prop `priority={<PriorityStack …/>}`

Fix: dejar solo el render externo (siempre visible, arriba). Eliminar la prop `priority` que se pasa a `EditSlots` y su render interno, para que en modo edición no aparezca dos veces.

## Alcance
Solo `src/pages/Dashboard.tsx` (y ajuste menor en `EditSlots.tsx` si la prop `priority` era requerida — hacerla opcional / omitirla).
