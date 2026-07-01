# Ajustes de UI: BottomNav y tipografía del Home

## 1. Botón SOS separado (flotante a la derecha)
Archivo: `src/components/layout/BottomNav.tsx`
- Sacar el botón de crisis del contenedor pill del BottomNav.
- Renderizarlo como un FAB independiente dentro del mismo `<nav>` fijo, alineado a la derecha con `margin-right` (respetando `env(safe-area-inset-right)`) y a la misma altura vertical que el pill.
- Estilo: círculo `h-11 w-11`, fondo `bg-red-500/90` con `backdrop-blur`, borde blanco sutil, sombra suave. Mantener `CrisisSheet` y accesibilidad ("Línea de crisis").

## 2. Downbar un poco más grande y Psicoeducación al mismo nivel
Archivo: `src/components/layout/BottomNav.tsx`
- Pill: aumentar padding a `px-3 py-2.5`, iconos de tabs a `h-10 w-10` (icono `size={22}`).
- Botón central de Psicoeducación:
  - Quitar `-mt-4`, el borde blanco grueso, el `shadow-primary-glow` y el fondo contrastante.
  - Igualarlo al resto: mismo tamaño (`h-10 w-10`), mismo tratamiento activo/inactivo que las demás tabs (activo = pill blanco con icono primary; inactivo = icono blanco).
- Resultado: 5 tabs uniformes + SOS flotante afuera.

## 3. Tipografía consistente y tamaños ajustados
Los items de "Tu camino de hoy" usan el estilo de `RecommendedResourceCard` (título `font-display font-bold` + subtítulo `text-muted-foreground`). Unificar:

- **Camino de hoy** (`RecommendedResourceCard.tsx` y variantes morning/night que usen misma card): subir título de `text-base` a `text-[17px]` y subtítulo a `text-[13px]` para que sea "un poco más grande".
- **Card central "Santuario del sueño"** (Zona de descanso, en `PendingBento.tsx` o donde se defina): reducir el título a la misma escala que el resto de las cards del camino (`text-[17px] font-display font-bold`), quitar el tamaño destacado actual. Mantener el gradiente violeta pero con tipografía homogénea.
- Revisar que todas las cards del home usen `font-display` para títulos y `font-sans`/muted para subtítulos — sin excepciones.

## Verificación
- Preview mobile 390px: SOS visible a la derecha sin tapar el pill, downbar equilibrado sin "burbuja" central, tarjetas del home con jerarquía tipográfica uniforme.
