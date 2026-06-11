## Alcance

Mantener la est\u00e9tica actual de Home, Recursos, Mi Proceso y Diario. Tres frentes nuevos:

1. **Onboarding po\u00e9tico dark glassmorphism** que ocurre ANTES del signup.
2. **Auth con Google** habilitada adem\u00e1s de email/contrase\u00f1a.
3. **Algoritmo de recomendaci\u00f3n editable**: tablas + UI admin que vincula preguntas del Test de S\u00edntomas \u2192 recursos \u2192 sub-recursos, y modifica las pr\u00e1cticas y la psicoeducaci\u00f3n que aparecen en la Home cada d\u00eda.

Fuera de alcance: rebrand visual de Home/Recursos/Diario/Mi Proceso, cambio de bottom nav, modales de check-in nuevos, Pack de Actividades, modal de psicoeducaci\u00f3n din\u00e1mico (se reutiliza el que ya existe pero con contenido filtrado por algoritmo).

---

## 1) Onboarding antes del signup

**Flujo nuevo** (`/onboarding` p\u00fablica, sin requerir auth):

1. Splash: "Tu espacio seguro\u2026" \u2192 bot\u00f3n Comenzar.
2. Paso 1 \u2014 "Rompiendo el hielo": nombre/apodo + edad.
3. Paso 2 \u2014 "\u00bfQu\u00e9 br\u00fajula gu\u00eda tu viaje hoy?": selecci\u00f3n m\u00faltiple po\u00e9tica (8 opciones del PRD).
4. Paso 3 \u2014 "\u00bfQu\u00e9 maleta te gustar\u00eda aligerar?": selecci\u00f3n m\u00faltiple (6 opciones del PRD).
5. Pantalla final \u2014 "Crear\u00e1 tu rinc\u00f3n": tabs **Email** y **Google**.
   - Email \u2192 input email + password + confirmar \u2192 `supabase.auth.signUp` con `data: { display_name, age, brujula, maleta }` en metadata; tambi\u00e9n persiste a `patient_app_profiles` post-confirm.
   - Google \u2192 `lovable.auth.signInWithOAuth("google", { redirect_uri })`. Antes guarda las respuestas en `sessionStorage` y, al volver del callback, una rutina en `App.tsx` (`useEffect` que detecta `session && pending onboarding`) las vuelca a `patient_app_profiles`.
6. Redirect a `/`.

**Si ya hay sesi\u00f3n al entrar a `/onboarding`**: saltea directo a la persistencia y va a `/`.

**Est\u00e9tica dark glassmorphism aislada**: nueva clase `.onboarding-shell` con gradiente azul-marino/violeta, `backdrop-blur`, bordes blancos sutiles. Tipograf\u00eda display serif (Lora ya existe) para t\u00edtulos po\u00e9ticos. NO toca tokens globales \u2014 viven dentro de `src/pages/Onboarding.tsx` y un componente local `OnboardingShell`.

**Cambios en c\u00f3digo**:
- Reescribir `src/pages/Onboarding.tsx` con los 5 pasos + paso de auth.
- En `src/App.tsx`: ruta `/onboarding` p\u00fablica; `/auth` deja de ser el primer destino \u2014 si no hay sesi\u00f3n y no hay onboarding pendiente, redirigir a `/onboarding`. `/auth` se mantiene para login de usuarios existentes (bot\u00f3n "Ya tengo cuenta").
- `Auth.tsx`: agregar bot\u00f3n Google (mismo mecanismo).

---

## 2) Google sign-in

- Llamar `supabase--configure_social_auth` con `providers: ["google"]` (sin disable de email).
- Agregar bot\u00f3n "Continuar con Google" en `Auth.tsx` y en el paso final del onboarding usando `lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin })`.

---

## 3) Algoritmo de recomendaci\u00f3n (DB + admin + Home)

### 3.1 Schema nuevo (migration)

- `algo_sub_resources` (id, resource_category_id FK, slug, name, route, weight, sort) \u2014 ej. "Mindfulness \u2192 Observar \u2192 Escaneo corporal". Se modela como recurso anidado: si necesita 2 niveles, usar `parent_sub_resource_id` self-FK.
- `algo_questions` (id, code, prompt, kind: 'symptom'|'personality', sort, active).
- `algo_options` (id, question_id FK, label, score 0\u20133, sort) \u2014 cada respuesta tiene peso.
- `algo_option_links` (id, option_id FK, sub_resource_id FK, weight) \u2014 vincula respuesta \u2192 sub-recurso (ej. "Irritabilidad alta" \u2192 Escaneo corporal, peso 3).
- `algo_user_answers` (id, user_id, question_id, option_id, answered_at) \u2014 \u00fanico por (user_id, question_id, date_trunc('week')).
- `algo_psycho_links` (id, sub_resource_id FK, psychoeducation_content_id FK, weight) \u2014 conecta sub-recursos con cards de psicoeducaci\u00f3n.

GRANTs: `authenticated` SELECT en todas (lectura del catalog); INSERT/UPDATE/DELETE solo en `algo_user_answers` (propio user_id). Catalog (questions/options/links/sub_resources/psycho_links) editable solo por `has_role(auth.uid(),'admin')`. `service_role` ALL. RLS habilitado en todas.

### 3.2 Funci\u00f3n de scoring

`get_daily_recommendations(_user_id uuid)` SQL SECURITY DEFINER que:
1. Toma las \u00faltimas respuestas de la semana del usuario.
2. Suma `option.score * link.weight` por `sub_resource_id`.
3. Devuelve top N sub-recursos + sus 3 cards de psicoeducaci\u00f3n vinculadas, con rotaci\u00f3n diaria (orden secundario por `(sub_resource_id + extract(doy))` para variar d\u00eda a d\u00eda).

### 3.3 Admin UI

Nueva pesta\u00f1a **Cuestionario** en `AdminDashboard.tsx` (o p\u00e1gina `/admin/cuestionario`):
- Listado de recursos (de `resource_categories`) \u2192 expandible a sub-recursos \u2192 CRUD anidado.
- Listado de preguntas con sus opciones; cada opci\u00f3n con multi-select de sub-recursos + peso.
- Tab adicional para vincular sub-recurso \u2194 cards de `psychoeducation_content`.
- Reutilizar shadcn Tabs / Accordion / Dialog ya existentes.

### 3.4 Home

`Dashboard.tsx`: el chip "Tu pr\u00e1ctica de hoy" consume `get_daily_recommendations` (RPC) y muestra los 3 sub-recursos top como chips. Click \u2192 navega a la ruta del recurso padre con `?focus=<slug>`. Si el usuario no respondi\u00f3 nunca el test, fallback a sus `areas_of_interest` del onboarding.

La card de Psicoeducaci\u00f3n usa el primer item devuelto por el mismo RPC en lugar del query gen\u00e9rico.

---

## Archivos a tocar

**Nuevos**
- `supabase/migrations/<ts>_algo_engine.sql` (tablas + RLS + GRANTs + funci\u00f3n RPC).
- `src/pages/admin/QuestionnaireManager.tsx`
- `src/components/onboarding/OnboardingShell.tsx`

**Modificados**
- `src/pages/Onboarding.tsx` \u2014 reescritura completa con auth incluida.
- `src/pages/Auth.tsx` \u2014 bot\u00f3n Google.
- `src/App.tsx` \u2014 ruta `/onboarding` p\u00fablica + redirect logic + handler post-OAuth para volcar `sessionStorage`.
- `src/pages/Dashboard.tsx` \u2014 consumir RPC para chips y psicoeducaci\u00f3n.
- `src/pages/admin/AdminDashboard.tsx` \u2014 nueva tab "Cuestionario".

**Tools / efectos secundarios**
- `supabase--configure_social_auth` con `providers: ["google"]`.
- 1 migration para todo el schema del algoritmo.

---

## Notas t\u00e9cnicas

- El bypass de auth en `/onboarding` requiere ajustar el guard actual; revisar c\u00f3mo `App.tsx` redirige sin sesi\u00f3n y agregar excepci\u00f3n para `/onboarding` y `/auth`.
- Cuando Google OAuth vuelve, la sesi\u00f3n se crea pero el perfil puede no existir; el handler `onAuthStateChange` debe revisar `sessionStorage.getItem('onboarding_pending')` y hacer el upsert a `patient_app_profiles`.
- Mantener la est\u00e9tica dark **solo** dentro del shell del onboarding usando clases locales \u2014 no tocar `index.css` ni `tailwind.config.ts` globales.
- No se borran datos existentes; el cat\u00e1logo de preguntas arranca vac\u00edo y se rellena desde el admin (o un seed opcional, a decidir despu\u00e9s).
