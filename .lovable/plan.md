# Bloque C · Notificaciones

**Objetivo:** que las notificaciones lleguen bien, sean configurables por el usuario, gestionables desde el admin y trazables punta a punta.

> Nota: el **cron automático de Resma Research (Bloque B) queda pendiente** — se dispara solo con "Ejecutar ahora" hasta que definamos frecuencia.

---

## 1. Preferencias del usuario · `NotificationPreferences.tsx`

Reagrupar los toggles hoy sueltos en secciones claras:

- **Diarias** — sintonía mañana, balance nocturno (hora preferida por sección).
- **Ritual** — check-in, frase del día.
- **Hábitos** — toggle maestro + resumen "X hábitos con recordatorio".
- **Recordatorios clínicos** — medicación, sesión de terapia, tests pendientes.
- **Novedades y admin** — noticias nuevas destacadas y push manual del admin.

Agregar:
- Toggle maestro "Pausar todo por 24 h / 7 d".
- Preview: "Así se verá tu próximo recordatorio" (título + cuerpo).
- Detección de permiso del navegador/PWA + CTA de repermisar si está denegado.

---

## 2. Recordatorios por hábito

- Nueva columna `habits.reminder_days int[]` (0-6, domingo-sábado). Default `{1,2,3,4,5,6,0}` = todos los días.
- En `HabitDetailSheet` / `NewHabitSheet`: selector de días (chips L·M·M·J·V·S·D) + hora ya existente.
- Enganche en `cron-push-dispatcher`: filtra hábitos activos cuyo `reminder_time` cae en la ventana actual y `reminder_days` incluye el día de hoy en `America/Argentina/Buenos_Aires`.

---

## 3. Motor · `notificationEngine.ts` + `cron-push-dispatcher`

- Zona horaria: normalizar todos los cálculos a `America/Argentina/Buenos_Aires` con `localDateStr()`; hoy hay mezcla UTC / local.
- Ampliar `notification_log` con `reason text` (habit / ritual / admin / clinical / news) y `delivery_status text` (delivered / failed / no_token / skipped_prefs).
- Registrar cada intento (incluidos los skipped) para poder auditarlos.
- Idempotencia: chequear que no se envíe el mismo `(user_id, reason, target_key, day)` dos veces.

---

## 4. Admin · `NotificacionesAdmin.tsx`

Ya existe (311 líneas); lo extendemos:

- **Editor de reglas** (`notification_rules`) con visor "próximos 24 h" en **dry-run** (lista de qué usuarios recibirían qué, sin enviar).
- **Push manual con filtros**:
  - País (AR/otros).
  - Segmento: activos 7 d · con hábito X · sin check-in hoy · plan premium · onboarding incompleto.
  - Preview del payload + confirmación con conteo estimado.
- **Historial** (`notification_log`) con status FCM (delivered / failed / no_token) y filtros por motivo y fecha.

---

## 5. Runner cliente · `NotificationRunner.tsx` + `NotificationForegroundListener.tsx`

- Manejo de **token expirado**: si `getToken` devuelve error o cambio de token, re-registrar en `device_tokens` de forma transparente.
- Foreground listener: mostrar toast con acción "Abrir" que hace deep-link a la ruta del payload (`data.route`).
- Marcar en `device_tokens` los tokens no válidos (last_error, last_error_at) para que el dispatcher los ignore.

---

## Migraciones necesarias

```sql
ALTER TABLE public.habits
  ADD COLUMN IF NOT EXISTS reminder_days int[] NOT NULL DEFAULT '{0,1,2,3,4,5,6}'::int[];

ALTER TABLE public.notification_log
  ADD COLUMN IF NOT EXISTS reason text,
  ADD COLUMN IF NOT EXISTS delivery_status text,
  ADD COLUMN IF NOT EXISTS target_key text,
  ADD COLUMN IF NOT EXISTS log_date date;

CREATE UNIQUE INDEX IF NOT EXISTS notification_log_idempotency
  ON public.notification_log (user_id, reason, target_key, log_date)
  WHERE reason IS NOT NULL AND target_key IS NOT NULL AND log_date IS NOT NULL;

ALTER TABLE public.device_tokens
  ADD COLUMN IF NOT EXISTS last_error text,
  ADD COLUMN IF NOT EXISTS last_error_at timestamptz,
  ADD COLUMN IF NOT EXISTS invalid boolean NOT NULL DEFAULT false;
```

Todas con RLS por `auth.uid()` ya vigente (`notification_log`, `device_tokens`, `habits`).

---

## Pendientes anotados (fuera de este bloque)

- **Cron feed Resma Research** (Bloque B) — definir frecuencia (diaria / cada 12 h) y engancharlo con `pg_cron + pg_net` al edge function `resma-research-fetch`.

---

## Orden de ejecución sugerido

1. Migración (columnas + índice de idempotencia).
2. `reminder_days` en UI de hábitos + engancharlo al dispatcher.
3. Reagrupar `NotificationPreferences.tsx` + pausa 24 h/7 d.
4. Motor: zona horaria + `notification_log` ampliado + idempotencia.
5. Admin: dry-run del cron, push manual segmentado, historial FCM.
6. Runner: refresh de token + deep-links en foreground.

## Confirmación

¿Arrancamos con el orden completo o preferís priorizar algo concreto (ej. solo hábitos + preferencias, o solo admin push manual segmentado)?
