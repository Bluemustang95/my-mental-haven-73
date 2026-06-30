## Plan de ajustes: Reproductor Inmersivo (Bajar Ansiedad)

### Cambios
1. **Fondo pantalla completa**
   - En `ImmersivePlayer` (`src/pages/mindfulness/BreathingHome.tsx`), cambiar el contenedor raíz de `relative min-h-screen w-full` a `fixed inset-0 z-50` para garantizar que el fondo gradiente cubra toda la pantalla sin importar el layout padre (`AppLayout`) ni barras de navegación del sistema.

2. **Eliminar contador numérico de fase**
   - En el bloque inferior del `ImmersivePlayer`, remover el `<div>` que renderiza `secondsLeftInPhase` (el número grande debajo de "Inhalá"/"Exhalá"). Solo se conserva la etiqueta de texto de la fase (`phase.label`).

### Archivos a editar
- `src/pages/mindfulness/BreathingHome.tsx` (líneas del contenedor `ImmersivePlayer` y del bloque inferior de UI)

### Sin cambios en
- Lógica de respiración, timers, visualizadores SVG, ajustes de voz/ambiente, ni schema de base de datos.