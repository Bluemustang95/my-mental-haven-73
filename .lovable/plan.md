## Objetivo
Reemplazar la tarjeta "Soporte RESMA" del bento grid en `TherapyMiniTracker.tsx` por una tarjeta interactiva "Próxima Sesión" con modal Bottom Sheet para configurar día, hora, modalidad (presencial/virtual) y ubicación/link.

## Cambios

**1. Nuevo componente `src/components/proceso/NextSessionCard.tsx`**
- Tarjeta blanca `rounded-[24px]` con icono calendario azul, badge "Próxima", título Día + Hora, bloque condicional (MapPin+dirección con `line-clamp-2` o Video+"Link de la llamada" subrayado), footer con "Agendar" y "Editar".
- Toda la tarjeta clickeable → abre el Bottom Sheet.
- Estado vacío: "Agendar próxima sesión" si no hay datos.

**2. Nuevo componente `src/components/proceso/NextSessionSheet.tsx`**
- Bottom Sheet (overlay `bg-slate-900/40 backdrop-blur-sm`, contenedor `rounded-t-[32px] p-6`, animación slide-in from bottom con framer-motion).
- Segmented control Presencial/Virtual (activo con fondo blanco + `text-blue-600 shadow-sm`).
- Grid 2 cols: `<input type="date">` + `<input type="time">` con `bg-slate-50 rounded-2xl p-3.5`.
- Textarea condicional: "Dirección del consultorio" o "Link de la videollamada".
- Botón guardar `w-full py-4 bg-[#101927] text-white rounded-2xl`.
- Botón cerrar "✕" superior derecha.

**3. Persistencia (localStorage)**
- Guardar en `localStorage` key `resma:next-session` con `{ date, time, modality, location }`. Simple, sin tocar backend (Fase 1 similar a otros módulos).

**4. Toast**
- Al guardar: `toast.success("Sesión actualizada correctamente")` usando `sonner` (ya disponible en el proyecto).

**5. Editar `src/components/proceso/TherapyMiniTracker.tsx`**
- Reemplazar la tarjeta "Soporte RESMA" (línea 133 y línea 220) por `<NextSessionCard />` en ambos lugares (estado buscando y estado asignado).
- Mantener las otras 3 tarjetas del bento (Resumen Psico, Notas, Medicación) intactas.

## Detalles técnicos
- Usar `sonner` toast (ya integrado): `import { toast } from "sonner"`.
- Framer-motion para la animación del sheet (patrón ya usado en el proyecto).
- Formato de fecha display: "Jueves 15\n14:00 hs" usando `Intl.DateTimeFormat("es-AR", { weekday: "long", day: "numeric" })` + capitalización.
- Sin cambios de backend ni schema.
