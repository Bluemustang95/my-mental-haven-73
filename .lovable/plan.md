# Corrección crítica: la app NO modifica RESMA+

**Principio inviolable:** Ninguna acción del paciente en la app debe enviar señales, mutaciones ni cambios de estado a RESMA+. La app es **solo lectora** del estado de la derivación. RESMA+ es la única fuente de verdad.

## Cambios al plan del Bloque 3 (Tracker de 3 esferas)

### 1. Eliminar la acción `confirm-contact` del bridge desde la app

- **NO** llamar a `bridge-proxy` con `action: "confirm-contact"`.
- **NO** setear `coordination_started_at` desde la app.
- **NO** persistir la respuesta del paciente en `patient_app_profiles` ni en ninguna tabla que sincronice con RESMA+.
- El estado `coordinating` deja de existir como transición disparable desde la app. Si RESMA+ lo emite por su cuenta (porque el profesional marca contacto en su panel), la app lo refleja pasivamente. Si no, la esfera 2 se queda en "Asignado" hasta que RESMA+ pase a `concretized`.

### 2. Rediseño de `ContactConfirmDialog` — puramente informativo

El diálogo aparece a las 24 h de `bridge_assigned_at` (lógica local, sin tocar backend). Presenta dos botones que **solo muestran feedback en la UI**, sin efectos colaterales:

**Botón "Sí, ya me contactó"**
- Muestra mensaje: *"¡Bien! Ya podés coordinar una sesión con el profesional."*
- Cierra el diálogo.
- Guarda en `localStorage` (no en la base) un flag `contactConfirmDialogDismissed:<userId>` para no volver a mostrarlo. Es UI-only, no viaja a RESMA+.

**Botón "Todavía no"**
- Muestra mensaje: *"Podés comunicarte con nosotros para que te ayudemos."*
- Abre `https://wa.me/<numero-resma>?text=<mensaje-pre-armado>` en nueva pestaña (número de soporte de RESMA+ — usar el mismo que ya tenemos configurado en la app para soporte; si no existe, dejarlo como constante `RESMA_SUPPORT_WHATSAPP` en `src/lib/constants.ts` con placeholder para que lo confirmes).
- Cierra el diálogo. También marca dismissed en `localStorage`.

Ninguna de las dos respuestas envía requests al backend ni al bridge.

### 3. Tracker visual — esfera 2 sin badge de "contacto confirmado"

Como la app no sabe (ni debe saber) si el paciente coordinó, la esfera 2 muestra solo **"Asignado"** con los datos del profesional. Se retira el subestado "contacto confirmado ✓" del diseño. La esfera 2 se mantiene activa hasta que RESMA+ emita `concretized`.

### 4. Limpieza de código

- Quitar cualquier referencia a `confirm-contact` en `useTherapyStatus` / `bridge-proxy` client-side.
- Quitar el mapeo del estado `coordinating` como algo que la app pueda inducir. Si el bridge lo devuelve, se trata igual que `assigned` visualmente (esfera 2 activa, esfera 3 pendiente).

## Lo que se mantiene del plan original

- Bloque 1 (toggles admin de recursos): sin cambios.
- Bloque 2 (reordenar bento 2×2 de Mi Proceso): sin cambios.
- Bloque 3, resto:
  - Tarjeta del profesional (nombre, matrícula, teléfono) visible cuando el estado es `concretized`.
  - Botones "Llamar" y "WhatsApp" al profesional.
  - `ShareSummaryCard` con CTA para enviar link al Resumen Psico por WhatsApp al profesional.

## Archivos afectados por esta corrección

- `src/components/proceso/ContactConfirmDialog.tsx` — reescribir sin llamadas al bridge, solo mensajes + link WhatsApp de soporte.
- `src/components/proceso/TherapyMiniTracker.tsx` — quitar el badge "contacto confirmado" de la esfera 2.
- `src/hooks/useTherapyStatus.ts` (o donde esté la llamada) — remover la acción `confirm-contact`.
- `src/lib/constants.ts` — agregar `RESMA_SUPPORT_WHATSAPP` si no existe.

## Fuera de alcance

- Cualquier escritura desde la app hacia RESMA+ sobre el estado de la derivación.
- Persistir la respuesta del paciente en la base de datos compartida.
