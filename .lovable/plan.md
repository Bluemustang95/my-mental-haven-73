# Plan: Mejoras Acceso, Biometría, Widgets y Aclaraciones

## 1) Códigos maestros (Admin + Tester) en el Paywall

**Comportamiento:**
- En `PaywallModal.tsx`, agregar abajo a la derecha un link discreto: **"Tengo un código"**.
- Abre un input que acepta dos códigos:
  - `RESMA-ADMIN-2026` → otorga rol `admin` al usuario logueado + plan premium permanente.
  - `RESMA-TEST-2026` → otorga plan premium por 30 días (sin rol admin).
- Validación vía nueva edge function `redeem-access-code` (los códigos viven en env vars `ADMIN_ACCESS_CODE` y `TESTER_ACCESS_CODE`, fácil de rotar sin redeploy del frontend).
- La función llama a `admin_set_plan` + opcionalmente `admin_set_admin_role` con service role.

**Fix de seguridad relacionado:** Hoy en PWA un usuario gratuito ve accesos premium/dev. Auditar:
- `Settings.tsx`: el bypass actual `isAdmin → premium` se mantiene, pero el botón "Modo desarrollador" / acceso admin SOLO se renderiza si `isAdmin === true` (consultado a `user_roles` server-side vía `useAdminRole`), nunca por flag local.
- Eliminar cualquier `localStorage` flag tipo `devMode` que se esté usando como bypass.

## 2) Reset contraseña admin

- Ejecutar la edge function `seed-admin` (ya existe) para asegurar que `redsaludmentalarg@gmail.com` exista con password `RESMA2026` y rol admin.
- Si ya existe pero con otra password: agregar paso en `seed-admin` para llamar `admin.updateUserById` y forzar la password a `RESMA2026`.
- **Credenciales finales:** email `redsaludmentalarg@gmail.com` / password `RESMA2026`.

## 3) Aclaraciones (sin código, solo respuesta)

**Suscripciones reales:**
- Hoy NO hay billing real conectado. El toggle premium es interno (campo `plan` en `patient_app_profiles`).
- Para cobrar en producción: Apple usa **In-App Purchase obligatorio** para apps en App Store (no se puede usar Stripe). Google Play **también exige Google Play Billing** para contenido digital, aunque desde 2024 permite alternativas en EU/algunos casos.
- Para PWA pura (sin stores), se puede usar Stripe/Paddle directo. Lovable tiene integración nativa con Paddle/Stripe lista para activar cuando lo decidas.

**Firebase / Push:**
- FCM funciona en **PWA Android sin problema**, **PWA iOS 16.4+ instalada en home screen** (no en Safari abierto), y en **app nativa Capacitor** (Android e iOS).
- O sea: sirve para PWA Y para futura versión nativa. No es exclusivo de PWA.

## 4) Biometría auto-prompt en PWA

**Estado actual:** `biometricAuth.ts` existe + `Auth.tsx` ya pregunta si está habilitada. Falta el flujo de **activación inicial**.

**Cambios:**
- En `Auth.tsx`, tras login exitoso (email/password o Google):
  - Detectar si `isStandalone` (PWA instalada: `window.matchMedia('(display-mode: standalone)').matches`).
  - Si soporta WebAuthn (`isBiometricSupported()`) y NO está aún habilitada → mostrar modal de bienvenida: *"¿Querés desbloquear RESMA con Face ID / huella la próxima vez?"* con botones Sí / Ahora no / No volver a preguntar.
  - Al aceptar, llamar `registerBiometric()` y guardar flag en localStorage.
- En `Settings.tsx` (Preferencias del sistema): asegurar que el toggle "Acceso biométrico" sea visible y funcional con el mismo helper. Si no existe, agregar fila.

## 5) Drag & drop widgets en Inicio

**Problema:** `WidgetsBoard.tsx` usa framer-motion `Reorder` pero no responde a touch en mobile.

**Fix:**
- Reemplazar con `dnd-kit/sortable` + `PointerSensor` con `activationConstraint: { delay: 250, tolerance: 5 }` → activa drag tras long-press de 250ms, evita conflicto con scroll.
- Cada widget envuelto en `useSortable` con handle = el widget completo en modo edición.
- Haptic feedback (`navigator.vibrate(20)`) al activar drag.
- Persistir orden en `home_layouts` (ya existe la tabla).

## Aspectos técnicos

**Nuevos archivos:**
- `supabase/functions/redeem-access-code/index.ts` — valida código vs env, llama RPCs admin con service role.
- `src/components/modals/AccessCodeModal.tsx` — input + submit.
- `src/components/modals/BiometricSetupModal.tsx` — prompt inicial.

**Archivos modificados:**
- `src/components/modals/PaywallModal.tsx` — link "Tengo un código".
- `src/pages/Auth.tsx` — auto-prompt biometría tras login en PWA.
- `src/pages/Settings.tsx` — asegurar toggle biométrico visible + remover bypass dev mode no-admin.
- `src/components/home/WidgetsBoard.tsx` — migrar a dnd-kit.
- `supabase/functions/seed-admin/index.ts` — forzar reset de password si user ya existe.

**Secrets nuevos a configurar:** `ADMIN_ACCESS_CODE=RESMA-ADMIN-2026`, `TESTER_ACCESS_CODE=RESMA-TEST-2026` (vía set_secret).

**Dependencias:** `@dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities` (ya puede estar instalado, verificar).

## Lo que NO se toca

- Sistema de billing real (queda para después según decidas Paddle/Stripe/IAP).
- Firebase setup (lo estás haciendo en paralelo).
- Lógica de `usePlan` existente.
