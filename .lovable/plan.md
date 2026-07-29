
# Fase 1 — Home: tarjeta de Sintonía

Archivos: `src/components/home/PriorityStack.tsx`, `src/pages/Dashboard.tsx`.

## 1. Flecha en la esquina inferior derecha

Hoy la cápsula con la flecha está arriba a la izquierda (bloque `chip-${phaseKey}` dentro del contenedor `flex-col justify-between`).

- Se saca del flujo superior y se posiciona en absoluto en la **esquina inferior derecha** de la tarjeta (`absolute bottom-5 right-5`), manteniendo el estilo de vidrio (`bg-white/70`, borde blanco, blur) y el color de flecha según la fase.
- Tamaño levemente mayor (40px) para que sea un target táctil cómodo; conserva la animación de entrada por fase.
- Los puntos de paginación quedan abajo a la izquierda, sin chocar con la flecha (padding derecho reservado).
- El título sube al espacio liberado; sigue con `font-display` como el resto de la app.

## 2. Avance automático a la fase nocturna

Hoy `phaseIdx` arranca siempre en 0 (mañana), así que al completar la Sintonía la tarjeta se queda en la fase de mañana.

- La fase inicial pasa a calcularse a partir del estado del día:
  - Mañana pendiente → fase 0 (mañana)
  - Mañana completada y noche pendiente → fase 2 (noche)
  - Ambas completadas → fase 1 (práctica recomendada)
- Ese cálculo se recalcula cuando cambian los flags `done` de las tarjetas (al volver del ritual y refrescarse la Home), salvo que la persona haya cambiado de fase manualmente en esa sesión (se respeta la elección manual con un flag interno).
- Se mantiene la persistencia de fases visitadas para el calendario clínico.

## Notas

Solo cambios de UI/estado en la Home; sin tocar base de datos ni la lógica de guardado de los rituales.
