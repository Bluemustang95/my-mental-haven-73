# Plan: Selección de plan al registrarse + bloqueos visuales completos

## 1. Selección de plan en el Onboarding

Agregar un paso nuevo **antes del último** (después de crear cuenta o como paso final del wizard, justo antes de `navigate("/")`), llamado `step = 8: choose-plan`.

**UI:** dos tarjetas grandes estilo glass:
- **Gratuita** — "Empezá tu camino" (chip básico, sin estrella). Acceso a check-ins, diario básico, 1 categoría de psicoeducación.
- **Premium** — "Acceso completo" (estrella dorada). Lista de beneficios.

Botón inferior: `Continuar`.

**Lógica:**
- Si elige **Premium** → abrir `PaywallModal` (existente). Tras éxito (mock) → `navigate("/")`.
- Si elige **Gratuita** → guardar `plan = 'free'` en `patient_app_profiles` (o tabla `user_plans` ya existente) y `navigate("/mi-proceso#suscripcion")` para que aterrice en la **última sección de Mi Proceso** (gestión de suscripción / "Hazte Premium").

**Integración:**
- Modificar `handleEmailSignup` y el handler de Google en `src/pages/Onboarding.tsx`: tras `persistProfile`, en vez de `navigate("/")` setear `step = 8`.
- También para usuarios OAuth que vuelven con `pending`, mostrar el paso de plan antes de cerrar.

## 2. Anclaje en Mi Proceso

En `src/pages/MiProceso.tsx`:
- Agregar `id="suscripcion"` al bloque inferior de gestión/suscripción (o crear uno si no existe usando el patrón premium ya presente).
- `useEffect` que detecte `location.hash === "#suscripcion"` y haga `scrollIntoView({ behavior: "smooth" })`.

## 3. Bloqueos visuales (PremiumLock) en TODO el Inicio

Hoy en `src/pages/Dashboard.tsx` solo está blurreado el banner "Recursos de sueño avanzados". El usuario quiere que **todo el dashboard** se vea bloqueado para Free salvo los elementos verdaderamente gratuitos.

Aplicar `PremiumLock` (variant card/section) en:
- **WeekStrip** (calendario semanal) → lock.
- **Timeline completo** salvo el primer nodo "Valoración de la mañana" (check-in básico queda libre):
  - "Psicoeducación" → lock
  - "Tu práctica de hoy" + chips → lock
  - "Valoración de la noche" → lock
- Banner "Recursos de sueño avanzados" → ya está, mantener.

Implementación: envolver cada `TimelineNode` premium con `PremiumLock` o pasar prop `locked` al Timeline y renderizar overlay por nodo.

## 4. Confirmar bloqueos ya existentes (no tocar lógica, solo verificar visualmente)

- Diario: botón Herramientas ya con star — OK.
- Psicoeducación: categorías 2+ y podcasts — OK.
- MiProceso: Estadísticas + Evaluaciones — OK.
- Recursos: BentoGrid — OK.

## Detalle técnico

**Archivos a editar:**
- `src/pages/Onboarding.tsx` — nuevo step `choose-plan`, ruteo condicional.
- `src/pages/MiProceso.tsx` — `id="suscripcion"` + scroll por hash.
- `src/pages/Dashboard.tsx` — envolver WeekStrip y nodos premium del Timeline con `PremiumLock`.
- `src/components/home/Timeline.tsx` — soportar prop `locked` por nodo (renderizar overlay blur sobre el item sin romper el track lateral).

**Sin cambios de schema.** El plan free queda registrado en la tabla existente `user_plans` con `plan='free'` (insert vía supabase desde el paso del onboarding).

**Admin / Premium real:** `usePlan` ya devuelve `premium` para admins, por lo que `redsaludmentalarg@gmail.com` no verá ningún blur. Free users verán todo bloqueado excepto el check-in matinal.
