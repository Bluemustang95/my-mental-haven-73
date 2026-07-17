
## Plan app-side (RESMA+ bridge ya arreglado)

Todo esto es 100% read-only respecto de RESMA+. La app sigue haciendo solo `action: "status"`.

---

### A) Consumir el nuevo contrato del profesional

**`src/hooks/useTherapyStatus.ts`:**
- Actualizar el tipo `Professional`:
  ```ts
  type Professional = {
    full_name: string | null;
    license: string | null;
    specialty: string | null;
    phone: string | null;
    email: string | null;
  } | null;
  ```
- Al recibir `professional` en el response, persistir en `patient_app_profiles`:
  `therapist_name = full_name`, `therapist_phone = phone`, `therapist_email = email`, `therapist_license = license`. Así la card se pinta en frío en el próximo mount sin esperar al bridge.
- Consumir tanto en `state === "assigned"` como en `"concretized"`.

**`src/components/proceso/ProfessionalCard.tsx` (y `TherapyMiniTracker.tsx`):**
- Leer `full_name` con fallback a `therapist_name` persistido.
- Si `license` o `specialty` vienen null, ocultar esas líneas (no mostrar "Matrícula: —").
- Botones "Llamar" y "WhatsApp" solo si `phone` está presente.
- Botón "Email" solo si `email` está presente.
- Si `professional` viene null estando en `assigned/concretized`: mostrar solo "Profesional asignado" sin botones (fallback defensivo).

---

### B) Mover CTA "Enviar resumen" a `/mi-proceso/resumen`

- **Quitar** `ShareSummaryCard` de la vista principal de `/mi-proceso`.
- En `MiProcesoResumen.tsx` (la pantalla del screenshot con "Enviar al profesional" / "Descargar copia"): el botón "Enviar al profesional" abre el flow WhatsApp pre-armado hacia el `therapist_phone`.
- **Gating** del botón:
  - `bridge_last_state === "concretized"`, Y
  - `next_session_at` está marcada, Y
  - `now` está dentro de `[next_session_at - 24h, next_session_at]`.
- Estados del botón:
  - Habilitado: color primario normal.
  - Deshabilitado por falta de `next_session_at`: gris + texto "Marcá tu próxima sesión para habilitar el envío 24hs antes."
  - Deshabilitado por estar fuera de ventana: gris + texto "El envío se habilita 24hs antes de tu próxima sesión ({fecha})."

---

### C) Próxima sesión semanal + notificación 24hs antes

**Migración `patient_app_profiles`:**
```sql
ALTER TABLE public.patient_app_profiles
  ADD COLUMN IF NOT EXISTS next_session_at timestamptz,
  ADD COLUMN IF NOT EXISTS session_weekly_recurring boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS session_day_of_week smallint,
  ADD COLUMN IF NOT EXISTS session_time time,
  ADD COLUMN IF NOT EXISTS last_session_notification_at timestamptz;
```
Sin nuevas policies (la tabla ya tiene RLS por `user_id`). Grants ya existen.

**Auto-avance semanal:**
- Función RPC `public.roll_next_session_forward()` (SECURITY DEFINER) que, para el `auth.uid()` actual, si `session_weekly_recurring = true` y `next_session_at < now()`, suma 7 días hasta quedar en el futuro y resetea `last_session_notification_at = null`.
- Se llama al montar `/mi-proceso`.

**UI `NextSessionCard`:**
- Selector día de la semana + hora.
- Toggle "Repetir cada semana" (default ON).
- Muestra: "🔁 Próxima: jueves 15/07 · 15:00 hs".
- Botón "Editar" / "Cancelar recurrencia".
- Toast al guardar: "Sesión guardada. Te avisamos 24hs antes."

**Notificación FCM 24hs antes:**
- Edge function nueva `notify-upcoming-session`:
  - Query: perfiles con `next_session_at BETWEEN now() + interval '23h45m' AND now() + interval '24h15m'` Y `(last_session_notification_at IS NULL OR last_session_notification_at < next_session_at - interval '24h')`.
  - Reusa el sender FCM existente (mismo path que otras notificaciones).
  - Título: "Sesión mañana con {therapist_name}"
  - Body: "A las {HH:mm}. ¿Preparamos tu resumen para el psico?"
  - Deep link: `/mi-proceso/resumen`.
  - Marca `last_session_notification_at = now()`.
- Cron `pg_cron` cada 15 min invoca la function vía `net.http_post` (patrón ya usado por `cron-push-dispatcher`).

---

### Archivos afectados

**Frontend:**
- `src/hooks/useTherapyStatus.ts` — tipos + persist profesional
- `src/components/proceso/ProfessionalCard.tsx` — nuevo contrato + campos condicionales
- `src/components/proceso/TherapyMiniTracker.tsx` — quitar ShareSummaryCard
- `src/components/proceso/NextSessionCard.tsx` — nuevo/refactor
- `src/pages/MiProcesoResumen.tsx` (o equivalente) — mover CTA WhatsApp + gating
- `src/components/proceso/ShareSummaryCard.tsx` — mover/refactor a Resumen

**Backend (Lovable Cloud):**
- Migración: 5 columnas en `patient_app_profiles` + RPC `roll_next_session_forward`
- Edge function nueva: `notify-upcoming-session`
- Cron `pg_cron` cada 15 min

**Sin cambios:**
- `bridge-proxy` (ya lo arregló la otra IA)
- `ContactConfirmDialog` (queda UI-only)
- Ninguna llamada nueva app → RESMA+

---

### Fuera de scope
- Cargar `license` / `specialty` de Sabrina en `profiles` (upstream, del lado RESMA+).
- Poblar `first_session_date` (upstream).
- Recurrencias distintas a semanal.

¿Le doy verde y avanzo a implementar?
