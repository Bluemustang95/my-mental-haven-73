# Plan: Personalidad + Onboarding + Admin IA

## 1. Fix pantalla en blanco de Personalidad

**Causa:** `BigFiveProfileModal` deja `loading=true` para siempre cuando `useAuth()` todavía no resolvió el usuario (early return sin `setLoading(false)`). Además el modal es `fixed inset-0` y depende de `AnimatePresence` con `open={true}`; al montar sin user, no dispara `loadLatest`.

**Cambios en `src/components/proceso/BigFiveProfileModal.tsx`:**
- Si `!user`: mantener `loading=true` pero no bloquear el retorno. En vez del early return, `setLoading(false)` cuando termine `useAuth` sin sesión y mostrar CTA de login.
- Añadir un `useEffect` que dependa de `user` (no solo de `open`) para reintentar `loadLatest` cuando la sesión llega tarde.
- Envolver `loadLatest` en try/catch + `finally { setLoading(false) }` (así el error "Load failed" de la consola no deja loading infinito).

## 2. Rediseño del onboarding

### 2.1 Splash con Resmita (`SplashIntro` en `IntroScreens.tsx`)
- Nueva imagen: `src/assets/resmita-bot.png` (ya copiada del proyecto Mente Activa).
- Tarjeta glass central `max-w-[220px]` con `backdrop-blur-xl`, borde blanco translúcido y sombra profunda; dentro va Resmita (`<img src={resmita}>`) con `onerror` que oculta y muestra el SVG isotipo actual como fallback.
- Detrás de la tarjeta, aura circular `resmaTeal` con animación **breath-vagal** (6s: inhale 3s / exhale 3s, escala 0.95→1.45, opacidad 0.28→0.65, blur ~40px). Definida en `tailwind.config.ts` como keyframe `breath-vagal`.
- La tarjeta usa animación **float-weightless** (5s, translateY -8px + rotate 0.5deg, ease-in-out infinite).
- Frase itálica en `font-mindful`/serif: "Tu mente, a tu propio ritmo…" con animación **fade-up cascade** (delay 300ms).
- Botón CTA con degradado `from-resmaTeal to-#a5dcdf`, sombra teal, `active:scale-[0.98]`.

### 2.2 Pantalla "Diseñado para ser tu refugio" (`ValueSlides`)
- **Quitar** el título "Diseñado para ser tu refugio".
- **4 pilares** (antes 3), tarjetas más chicas (`p-3.5`, icono `h-10 w-10`, título `text-[14px]`, body `text-[12px]`):
  1. **Ciencia, no magia** — icono Brain, tinte teal.
  2. **Paso a paso personalizado** — icono Navigation, tinte gold.
  3. **Resmita, tu compañera IA** — mini-avatar de `resmita-bot.png` en el círculo del icono. Copy: "Una IA entrenada con tu progreso que te guía, escucha y sugiere prácticas cada día."
  4. **Privado y Seguro** — icono ShieldCheck, tinte teal.
- Animación de aparición en cascada (framer-motion `staggerChildren: 0.12`, `y: 14 → 0`, `opacity: 0 → 1`, `duration: 0.6`, `ease: [0.22, 1, 0.36, 1]`).
- Botón CTA sin cambios de copy.

### 2.3 Tokens de animación
Añadir en `tailwind.config.ts` (dentro de `theme.extend`):
```
keyframes: {
  'breath-vagal': { '0%,100%': { transform:'scale(.95)', opacity:'.28', filter:'blur(30px)' }, '50%': { transform:'scale(1.45)', opacity:'.65', filter:'blur(50px)' } },
  'float-weightless': { '0%,100%': { transform:'translateY(0) rotate(0)' }, '50%': { transform:'translateY(-8px) rotate(.5deg)' } },
}
animation: {
  'breath-vagal':'breath-vagal 6s ease-in-out infinite',
  'float-weightless':'float-weightless 5s ease-in-out infinite',
}
```

## 3. Admin › nueva sección "Inteligencia Artificial"

### 3.1 Nueva tabla `ai_feature_configs`
```sql
create table public.ai_feature_configs (
  id uuid primary key default gen_random_uuid(),
  feature_key text unique not null,        -- 'resmita_chat', 'pensamientos_companion', 'dbt_ai', 'analyze_thought', 'suggest_evidence', 'suggest_behavior_plan', 'describe_neutral', 'mindfulness_tts', 'transcribe_voice', 'onboarding_algo'
  display_name text not null,
  description text,
  category text,                            -- 'chat' | 'analysis' | 'audio' | 'suggestion'
  model text not null default 'google/gemini-3-flash-preview',
  temperature numeric default 0.7,
  max_tokens integer,
  system_prompt text,
  active boolean default true,
  est_cost_per_call numeric,                -- USD estimado
  updated_at timestamptz default now(),
  updated_by uuid
);
grant select, insert, update, delete on public.ai_feature_configs to authenticated;
grant all on public.ai_feature_configs to service_role;
alter table public.ai_feature_configs enable row level security;
create policy "admin manage ai configs" on public.ai_feature_configs
  for all to authenticated using (public.has_role(auth.uid(),'admin')) with check (public.has_role(auth.uid(),'admin'));
```
Seed inicial con las 10 features conocidas (ver funciones edge existentes).

### 3.2 UI `src/pages/admin/AiFeaturesManager.tsx`
- Ruta `/admin/ia` con lista agrupada por categoría (Chat / Análisis / Audio / Sugerencia).
- Cada feature: card con badge de estado (Activo / Falta prompt / Falta modelo), modelo actual, temperatura, costo estimado, y **botón "Editar"** que abre un sheet con:
  - Textarea del `system_prompt` (grande, mono).
  - Select de modelo (poblado desde la lista de modelos permitidos del gateway).
  - Slider de temperatura + input de max_tokens.
  - Toggle Activo.
  - Muestra **últimos 20 requests** (tabla `ai_usage_log` filtrada por `feature_key`) con tokens y costo real cuando esté disponible.
- Sección "Faltantes": features que existen en el código pero no en la tabla (comparación estática contra un array `KNOWN_FEATURES`).

### 3.3 Consolidación
- Mover el editor de prompt de `OnboardingAlgoAdmin` (si lo tiene) y cualquier config IA de `SystemSettings.tsx` a esta nueva sección con enlace "deprecated → ver IA".
- Añadir entrada en `AdminDashboard.tsx` sidebar/tarjetas: "Inteligencia Artificial" con ícono Sparkles.

### 3.4 Edge functions leen desde la tabla
Cada función (`resmita-chat`, `pensamientos-companion`, `dbt-ai`, `analyze-thought`, `suggest-evidence`, `suggest-behavior-plan`, `describe-neutral`, `mindfulness-tts`) al iniciar hace un `SELECT` de su `feature_key` y usa `model` + `system_prompt` + `temperature` de la DB (fallback al hardcoded actual si la fila no existe o `active=false`).

## Detalles técnicos

**Archivos creados:**
- `src/assets/resmita-bot.png` (ya copiado)
- `src/pages/admin/AiFeaturesManager.tsx`
- `src/components/admin/AiFeatureEditor.tsx` (sheet)
- Migración SQL para `ai_feature_configs`

**Archivos editados:**
- `src/components/proceso/BigFiveProfileModal.tsx` (fix loading)
- `src/components/onboarding/IntroScreens.tsx` (splash + 4 pilares)
- `tailwind.config.ts` (keyframes)
- `src/App.tsx` (ruta `/admin/ia`)
- `src/pages/admin/AdminDashboard.tsx` (tarjeta IA)
- 8 edge functions (leer config desde DB con fallback)

**Sin cambios en:** algoritmo de onboarding, layout home, otras rutas.

## Fuera de alcance
- Chat de Resmita nuevo o cambios en su UI.
- Métricas históricas de costo (solo se muestra el estimado configurable + últimos 20 logs).
