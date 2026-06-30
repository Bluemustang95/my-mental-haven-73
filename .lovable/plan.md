## Plan: Push Notifications con Firebase Cloud Messaging (Fase 2)

Tengo todo lo necesario: config web, VAPID key y service account JSON. Avanzo con la integración completa.

### 1. Secrets a guardar
- `FIREBASE_VAPID_KEY` = `BOpIpQkztzuz9PE0_XRQMxGbWQu7nb03KQGjsiPXFMNGe8xiluon5UxiAvJUTkBzFZVw5-_qUA3mADyLNlV5aDI`
- `FIREBASE_SERVICE_ACCOUNT` = JSON completo (privado, solo backend)
- Config web (apiKey, projectId, etc.) → va en código del cliente (son públicas)

### 2. Cliente / PWA
- `bun add firebase`
- `src/lib/firebase.ts` — inicializa app + messaging con la config web.
- `public/firebase-messaging-sw.js` — service worker dedicado a FCM (separado del PWA), maneja `onBackgroundMessage` y muestra notificación nativa.
- `src/lib/pushNotifications.ts` — helpers: `requestPermissionAndRegister()` que pide permiso, obtiene token con la VAPID key, y lo guarda en backend.
- Hook `usePushSetup()` que después del login pregunta al usuario si quiere activar notificaciones (modal suave, una sola vez).
- Toggle en `Settings.tsx` → "Notificaciones push" para activar/desactivar.

### 3. Backend (Lovable Cloud)

**Tabla `device_tokens`:**
```
id uuid pk, user_id uuid fk auth.users, token text unique,
platform text, user_agent text, created_at, last_seen_at
```
Con RLS: usuario solo ve/borra sus tokens; service_role acceso completo. GRANTs estándar.

**Tabla `notification_preferences`:**
```
user_id uuid pk, checkin_enabled bool, checkin_time time default '09:00',
medication_enabled bool, habits_enabled bool, admin_enabled bool,
quiet_hours_start time default '22:30', quiet_hours_end time default '07:30'
```

**Tabla `notification_log`:** registro de envíos (user_id, kind, title, body, sent_at, status) para evitar duplicados y auditoría.

**Edge functions:**
- `register-push-token` — guarda/upserta token del usuario actual.
- `unregister-push-token` — borra token al desactivar.
- `send-push` — recibe `{user_ids|segment, title, body, data}`, busca tokens, autentica contra Google con el service account (JWT → OAuth2 access token), llama FCM HTTP v1 API (`https://fcm.googleapis.com/v1/projects/resma-app/messages:send`). Solo invocable con service_role o por admin autenticado.
- `cron-push-dispatcher` — corre cada minuto vía pg_cron, evalúa qué usuarios deben recibir notificación ahora (check-in diario, medicación pendiente, hábitos en su horario), respeta quiet hours y preferencias, llama internamente a `send-push`, escribe en `notification_log`.

**pg_cron:** programar `cron-push-dispatcher` cada minuto.

### 4. Admin
Nuevo tab en `AdminDashboard.tsx` → **"Notificaciones manuales"**:
- Selector de destino: usuario específico (search por email), segmento (país, plan free/premium), o broadcast a todos.
- Campos título + cuerpo + URL de destino opcional.
- Botón "Enviar" → invoca `send-push`.
- Lista de envíos recientes desde `notification_log`.

### 5. UI en perfil/preferencias
En `Settings.tsx`:
- Toggle maestro "Notificaciones push" (pide permiso al activar).
- Sub-toggles por categoría (check-in / medicación / hábitos / mensajes del equipo).
- Selector de hora preferida para check-in diario.
- Configuración de quiet hours.

### 6. Notas técnicas
- iOS: solo funciona si la PWA está instalada en pantalla de inicio (iOS 16.4+). Android funciona sin esa condición.
- El service worker FCM (`firebase-messaging-sw.js`) es independiente del PWA shell, no interfiere con la guía anti-stale-cache.
- FCM HTTP v1 requiere OAuth2 access token firmado con el service account JWT; lo genero dentro de `send-push` sin librerías externas (crypto.subtle para RS256).
- Recordatorio de medicación: leo `medications.schedule` (ya existe) cruzado con `medication_logs` para no notificar tomas ya marcadas.
- Recordatorio de hábitos: leo `habits.reminder_time` cruzado con `habit_completions` del día.

### 7. Verificación
- Build sin errores de tipos.
- Probar registro de token desde el preview publicado (Android Chrome).
- Enviar push manual desde admin a mi propio usuario y validar recepción.

¿Avanzo?
