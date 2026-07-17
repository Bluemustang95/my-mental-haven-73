## Objetivo

1. Quitar de "Notas para terapia" todo lo que sugiera que la nota se envía o es leída por el terapeuta (hoy el botón sólo marca `shared_at` en DB, sin canal real de entrega).
2. Sumar una **segunda notificación push el mismo día de la sesión**, además de la ya existente 24hs antes.

---

## Cambio 1 — Notas para terapia (frontend)

**Archivo único: `src/components/journal/TherapyNotes.tsx**`

- Eliminar `shareAll`, el estado `sending` y el botón "Compartir con terapeuta".
- Eliminar la sección "HISTORIAL COMPARTIDO" y el chip verde "✓ LEÍDO POR TERAPEUTA".
- Unificar en una sola lista "Tus notas", ordenadas por `created_at desc`, con opción de eliminar.
- Limpiar imports sin uso (`Check`).

La tabla `therapy_prep_notes` y sus columnas `shared_at` / `resolved` quedan intactas (por si en el futuro se agrega un canal real de entrega).

---

## Cambio 2 — Notificación "Día de la sesión"

Agregar un segundo recordatorio push que se dispara **la mañana del día de la sesión** (además del recordatorio de 24hs antes ya funcionando). El recordatorio se dispara en la pp pero la notificacion deberia dispararse como notificacion tambien

&nbsp;

### Backend

**Migración** — nuevas columnas en `patient_app_profiles`:

- `session_day_notification_at timestamptz` — timestamp del último push "día de la sesión" enviado (guard anti-duplicado, análogo al `last_session_notification_at` actual).
- `session_day_notification_hour smallint DEFAULT 9` — hora local (0-23) en la que se dispara el aviso del día. Default 9 AM hora Argentina.

**Edge function `notify-upcoming-session**` — extender la lógica actual:

- Además de la ventana 23h45m–24h15m (recordatorio 24hs), agregar una segunda evaluación:
  - Si `next_session_at::date = today_AR` (en zona `America/Argentina/Buenos_Aires`)
  - Y la hora local actual ≥ `session_day_notification_hour`
  - Y `session_day_notification_at` es NULL o anterior a hoy
  - Y `next_session_at > now()` (todavía no pasó la sesión)
  → enviar push "Hoy tenés sesión a las HH:MM" con FCM y setear `session_day_notification_at = now()`.
- Ambos disparos usan el mismo cron `*/15 * * * *` ya activo (`notify-upcoming-session-15m`).

**Copy sugerido del push día-de**:

- Título: "Hoy tenés sesión"
- Cuerpo: "Tu sesión con {therapist_name} es hoy a las {HH:MM}."

### Frontend (mínimo)

- `NextSessionSheet.tsx`: si es simple, permitir elegir la hora del aviso "día de la sesión" (default 9 AM). Si querés algo más liviano, lo dejamos fijo en 9 AM y no exponemos control por ahora.

---

## Fuera de alcance

- No se toca el bridge con RESMA+ (sigue siendo sólo lectura vía `status`).
- No se toca la lógica de auto-avance semanal (`roll_next_session_forward`).
- No se agregan más recordatorios (ej. 1h antes) en este plan.

---

## Preguntas

1. La hora del aviso "día de la sesión", ¿la dejamos **fija en 9 AM (AR)** para todos, o exponemos un selector en `NextSessionSheet` para que el paciente elija?