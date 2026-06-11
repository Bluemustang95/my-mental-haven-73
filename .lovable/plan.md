## Problema

En "Las hojas pasar" (`CloudsView`) el botón flotante **+** y el panel para escribir un pensamiento están posicionados en `bottom-0`, pero la barra inferior `SessionToolbar` (Voz / Silencio / Finalizar) también ocupa el `bottom-0` con `z-20`, así que **el + queda tapado** y no se puede tocar.

`ObservarHome` envuelve la actividad con `pb-32`, pero `CloudsView` usa `absolute inset-0`, así que ese padding no lo separa de la toolbar.

## Cambios

**Archivo:** `src/components/mindfulness/observar/CloudsView.tsx`

1. Subir el contenedor del FAB / composer para que quede por encima de la `SessionToolbar` (la toolbar mide ~120px de alto con `p-6 + rounded-t-[32px]`).
   - Cambiar el wrapper de `absolute inset-x-0 bottom-0 z-20 p-4 pb-8` a algo como `absolute inset-x-0 bottom-28 z-30 p-4` (queda holgadamente sobre la toolbar y por encima en z-index).
2. Asegurar que el composer (textarea + botones Cancelar/Soltar) también respete ese offset (mismo wrapper, así que ya queda resuelto).
3. Verificar que en las fases `intro` y `outro` el botón "Empezar" / "Volver" no se vea afectado — esos no usan la SessionToolbar (la toolbar sólo aparece envuelta en `ObservarHome` durante `playing`, pero técnicamente está montada siempre; conviene además ocultar la SessionToolbar en `intro`/`outro` o dejar el botón principal por encima — el botón ya está centrado verticalmente, no debería chocar, pero validamos en preview).

## Verificación

- Abrir `/herramientas/mindfulness/observar` → Nubes pasajeras → empezar.
- Confirmar que el "+" es tocable y que al abrir el composer, los botones Cancelar/Soltar quedan visibles sobre la toolbar.

## Fuera de alcance

- No se tocan `SensesView` ni `BentoSetupScreen` (su layout es `flex flex-col` y no presentan el solapamiento).
- No se modifica la SessionToolbar.
