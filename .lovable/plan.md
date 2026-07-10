## Objetivo
Cuando el signup en Onboarding devuelve `data.session = null` (modo "email confirmations on"), redirigir automáticamente al usuario a `/auth` en modo login con el email prellenado, en lugar de mostrar sólo el mensaje "Iniciá sesión para entrar."

## Cambios

### 1. `src/pages/Onboarding.tsx` — rama sin sesión del `handleEmailSignup`
- Guardar `PENDING_KEY` en `sessionStorage` (ya se hace).
- Guardar también el email pendiente en `sessionStorage` bajo `onboarding_pending_email`.
- Mostrar un toast breve ("Revisá tu correo para confirmar. Te llevamos al login…") y hacer `navigate("/auth?prefill=<email>&fromOnboarding=1", { replace: true })` tras ~800 ms.
- Mantener el fallback `setAuthMessage` por si `navigate` falla.

### 2. `src/pages/Auth.tsx`
- Al montar, leer `?prefill=` (o `sessionStorage.onboarding_pending_email`) y:
  - Forzar la vista de **login** (no signup).
  - Prellenar el campo email.
  - Si `fromOnboarding=1`, mostrar un banner suave arriba del form: "Confirmá tu correo y volvé acá para entrar. Tu plan te está esperando."
- Al loguearse correctamente, si existe `PENDING_KEY` en sessionStorage, redirigir a `/onboarding` (el `useEffect` existente ahí ya detecta el pending y persiste + siembra + navega a `/`). Si no, redirigir a `/`.

### 3. QA manual rápido
- Rehacer el E2E: llenar onboarding → signup con email nuevo → verificar que redirige a `/auth` con email prellenado y banner.
- Login manual → confirmar que aterriza en `/` con Home personalizada y `home_layouts` sembrado.

## Fuera de alcance
- No se cambia la config de confirmación de email de Cloud.
- No se toca el flujo de Google OAuth (ya redirige solo).
- No se altera el algoritmo ni el seeding.
