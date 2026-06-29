# Plan aprobado — implemento ahora

Voy a ejecutar en este orden:

1. **Pedir 2 secrets** vía formulario seguro:
   - `APP_BRIDGE_KEY` (los 48 chars que generó el otro proyecto)
   - `BRIDGE_BASE_URL` (la URL base del backend de Resma+ Digital, ej. `https://xxxx.supabase.co`)

2. **Migración mínima**: agregar columna `bridge_last_state text` a `patient_app_profiles` para cachear el último estado.

3. **Edge function `bridge-proxy`** (`supabase/functions/bridge-proxy/index.ts`):
   - Valida JWT del usuario logueado (`getClaims`).
   - Acepta `{ action: "status" | "intake" | "confirm-contact", payload }`.
   - Reenvía a `${BRIDGE_BASE_URL}/functions/v1/app-bridge-<action>` con header `X-App-Bridge-Key`.
   - Devuelve la response tal cual. Maneja 401/429/500 con logging.

4. **Hook `useTherapyStatus(phone)`**:
   - `invoke("bridge-proxy", { action: "status", payload: { phone } })`.
   - Polling cada 60 s + refetch en `visibilitychange`.
   - Devuelve `{ state, found, professional, ...}` + `refetch()`.

5. **Componentes nuevos**:
   - `TherapyTrackingView.tsx`: vista visual de los 4 estados (`searching` / `assigned` / `coordinating` / `concretized`) con animaciones y datos del profesional cuando corresponde.
   - `ContactConfirmDialog.tsx`: modal "¿Ya te contactó?" con Sí (→ `confirm-contact`) y No (→ WhatsApp a `+54 9 11 3894-0804`).

6. **Refactor `TherapySyncModal.tsx`**:
   - Vista 1: form apellido + teléfono → al confirmar, llama `status`.
   - Si `found = false` → muestra CTA "¿Aún no empezaste tratamiento?" que abre la vista intake.
   - Si `found = true` → guarda `linked_phone` + `linked_last_name` y muestra `TherapyTrackingView`.
   - Vista intake: expandida con `country/modality/reason/description/email` → llama a `intake` del bridge en vez de insertar local.

7. **Smoke test** con `curl_edge_functions`: llamar a `bridge-proxy` con `action:"status"` y un teléfono dummy, verificar respuesta `200 { found:false }`.

## Archivos
- **Nuevos**: `supabase/functions/bridge-proxy/index.ts`, `src/hooks/useTherapyStatus.ts`, `src/components/modals/TherapyTrackingView.tsx`, `src/components/modals/ContactConfirmDialog.tsx`
- **Modificados**: `src/components/modals/TherapySyncModal.tsx`
- **Migración**: `bridge_last_state` en `patient_app_profiles`

## No se toca
Ningún otro módulo, ninguna otra edge function, ningún otro flujo de auth/RLS.

Arranco con el pedido de secrets en cuanto aprobes. Pegame el `APP_BRIDGE_KEY` y la URL base cuando se abra el formulario.
