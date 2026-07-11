# Consentimiento claro + borrar todo + avatar cuerpo completo + indicador in-chat

## 1. Modal de consentimiento explícito (`ResmitaSnapshotConsentModal`)

Nuevo componente `src/components/resmita/ResmitaSnapshotConsentModal.tsx` basado en el `Dialog` de shadcn.

Contenido:
- **Qué guardamos**: último check-in (ánimo/sueño), tendencia de ánimo 7d, racha, cantidad de medicaciones activas (no los nombres), si hay un registro CBT abierto, último resultado numérico de test.
- **Qué NO guardamos**: texto del diario, pensamientos completos, cartas, notas de sesión, plan de seguridad, nombres de medicaciones.
- **Retención**: 90 días para eventos de uso; el resumen se recalcula en vivo (no se persiste como copia).
- **Control**: se puede desactivar o borrar todo cuando el usuario quiera.
- **Cifrado + agregación**: los datos viajan cifrados y el equipo clínico solo ve métricas agregadas/anónimas.
- Botones: **Cancelar** / **Activar** (icon buttons, alto contraste).

Se dispara desde dos lugares:
- Primera apertura del FAB (reemplaza el `showConsent` inline actual).
- Al intentar activar el toggle "Compartir resumen de mi actividad" en Ajustes.

Log de `consent_granted` / `consent_declined` en `resmita_context_events` se mantiene.

## 2. Ajustes: borrar historial + cancelar recolección

Editar `src/pages/Settings.tsx` (grupo "Privacidad de Resmita"):

- El toggle `shareSnapshot` no aplica directo: abre el modal y solo persiste al confirmar (si cancela, vuelve a false).
- Reemplazar el botón actual "Borrar historial de Resmita" por **"Borrar historial y cancelar recolección"** (rojo, icono `Trash2`):
  1. `AlertDialog` de confirmación explicando exactamente qué se borra (mensajes + eventos) y qué se apaga (`contextConsent`, `shareSnapshot`, `storeHistory`).
  2. Estado `isDeleting` con `Loader2` en el botón mientras corre.
  3. Ejecuta: `delete from resmita_messages`, `delete from resmita_context_events`, y `updatePrefs({ contextConsent:false, shareSnapshot:false, storeHistory:false })` — todos scoped al `user_id`.
  4. Toast de éxito ("Historial y datos borrados") o error específico.
- Badge de estado arriba de los toggles: "Recolección activa" (verde) / "Recolección pausada" (gris) según `contextConsent`.
- Enlace/botón secundario "Ver qué se guarda" que abre el mismo modal en modo informativo.

## 3. Avatar Resmita cuerpo completo (no cortado)

Editar `src/components/resmita/ResmitaFAB.tsx`:

- **FAB flotante**: subir el círculo a `h-16 w-16`; el `<img>` pasa a `h-14 w-14 object-contain` (sin recorte). Se mantiene el borde/glow teal, el punto de estado verde y el `ping`.
- **Header del sheet**: contenedor `h-11 w-11 rounded-2xl bg-[#7cc2c8]/15`; `<img>` `h-10 w-10 object-contain`.
- Verificar con Playwright (viewport 390×844) que se ve el bot entero, no la cara recortada. Si el PNG viene sin margen suficiente, regenerar con `imagegen` (transparente, con aire arriba/abajo) y reemplazar el asset JSON.

## 4. Indicador in-chat de contexto (transparencia continua)

Nuevo chip debajo del header del sheet en `ResmitaFAB.tsx`:

- Muestra en tiempo real qué está viendo Resmita:
  - Si `shareScreen` off → "Modo privado" (candado gris).
  - Si `shareScreen` on y `shareSnapshot` off → "Ve: pantalla actual" (icono ojo, teal).
  - Si ambos on → "Ve: pantalla + resumen".
- Es táctil: al tocar abre el modal de consentimiento en **modo informativo** (mismo componente, muestra el detalle de qué se está compartiendo con los toggles actuales y un enlace "Cambiar en Ajustes").
- Se oculta cuando `showConsent` inicial está abierto para evitar redundancia.

## Archivos afectados

- **Nuevo**: `src/components/resmita/ResmitaSnapshotConsentModal.tsx`
- **Editar**: `src/pages/Settings.tsx`, `src/components/resmita/ResmitaFAB.tsx`
- **Posible**: regenerar `src/assets/resmita-bot.png` + `.asset.json` si el crop actual no deja ver el cuerpo con `object-contain`.
