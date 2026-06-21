
# Reorganización de la pestaña Herramientas

## Cambios en `src/components/recursos/BentoGrid.tsx`
Reemplazar los tiles del 2x2 y eliminar la fila intermedia de "Gestión de Pensamientos":

```text
┌─────────────┬─────────────┐
│ 🍃 Mindfuln │ ❤️ Reg. Emo │
├─────────────┼─────────────┤
│ 🧠 Pensam.  │ ⚡ Hábitos  │
└─────────────┴─────────────┘
       [ Pack de Actividades ]
```

- Sacar tiles `tolerancia-malestar` y `efectividad-personal`.
- Sumar tiles `pensamientos` (icono Brain, navega a `/diario-inteligente/gestion-pensamientos/pensamientos-automaticos`, subtítulo "Wizard de CBT") y `habitos` (icono Zap dorado, navega a `/diario-inteligente/gestion-pensamientos/habitos`, subtítulo "Habit Tracker").
- Borrar el botón ancho "Gestión de Pensamientos" del medio.
- Conservar el botón `Pack de Actividades` debajo, tal como está.
- Mantener el paywall (lock/PaywallModal) y la lógica de `priority` (si el priority del onboarding es `tolerancia-malestar`/`efectividad-personal`, se ignora silenciosamente).

## Eliminar página intermedia
- Borrar `src/pages/pensamientos/PensamientosHome.tsx`.
- En `src/App.tsx`:
  - Quitar `import PensamientosHome` y la ruta `/diario-inteligente/gestion-pensamientos`.
  - Mantener `/diario-inteligente/gestion-pensamientos/pensamientos-automaticos` y `/diario-inteligente/gestion-pensamientos/habitos`.

## No tocar
- Wizard CBT, módulo Hábitos, Pack de Actividades, ni rutas de Mindfulness/Regulación Emocional.
- `DiarioInteligente.tsx` (los slugs `tolerancia-malestar`/`efectividad-personal` quedan inalcanzables desde el bento, no hace falta limpiarlos ahora).
