## Refactor visual — Ola 1

Aplicar el sistema "Light Glassmorphism + Dark Violeta para Auth/Onboarding" a la base de la app, sin tocar (todavía) las ~70 pantallas internas. El Pack BA queda como está.

### Estrategia

- Toda la paleta vive en **tokens semánticos HSL** (`index.css` + `tailwind.config.ts`). Las clases en componentes usan `bg-primary`, `bg-accent`, `text-foreground`, `bg-card/80`, etc. — no `bg-[#7cc2c8]` repartidos.
- Esto permite que **al cambiar un solo token, toda la app responda** y mantiene compatibilidad con shadcn/ui.
- Dark mode se mantiene: defino la versión oscura de cada token nuevo.
- Poppins se agrega como `font-display` y `font-sans`; Lora queda como `font-body` para textos largos del Diario.

### 1. Sistema de tokens (`src/index.css` + `tailwind.config.ts`)

Redefinir variables en `:root`:

```text
--background: 0 0% 95%          (#f2f2f2)
--foreground: 220 43% 11%       (#101927)
--card: 0 0% 100% / con bg-card/80 para glass
--primary: 185 39% 64%          (#7cc2c8 teal)
--primary-foreground: 220 43% 11%
--accent: 40 93% 68%            (#facb60 oro)
--accent-foreground: 220 43% 11%
--muted: 220 4% 85%             (#d8d9db)
--muted-foreground: 220 10% 40%
--border: 220 43% 11% / 0.05
--ring: 185 39% 64%
```

Sombras y radios como utilities reutilizables:

```text
--shadow-glass: 0 8px 32px rgba(16,25,39,0.04)
--shadow-primary-glow: 0 20px 40px rgba(124,194,200,0.3)
--shadow-accent-glow: 0 15px 35px rgba(250,203,96,0.25)
--radius: 1.5rem (base 24px; cards usan rounded-[32px])
```

Agregar al `tailwind.config.ts`: `boxShadow.glass`, `boxShadow.primary-glow`, `boxShadow.accent-glow`, y `fontFamily.display: ["Poppins", ...]`. Importar Poppins (300/400/500/600/700) en el `@import` de `index.css`. Dejar Montserrat y DM Serif Display por compatibilidad con el Pack BA y los headers existentes.

Dark mode: mismos tokens redefinidos en `.dark` (primary mantiene tono, background va a #0B0B10, card translúcida sobre fondo oscuro).

### 2. `AmbientGlows` global

Mover/promover `src/components/pack/AmbientGlows.tsx` a `src/components/layout/AmbientGlows.tsx` y montarlo dentro de `AppLayout.tsx` (detrás de `<Outlet/>`) para que el efecto de refracción aparezca en toda la app principal. AppLayout pasa de `bg-[#0B0B10]` a `bg-background`.

### 3. BottomNav teal protagonista (`src/components/layout/BottomNav.tsx`)

- Contenedor: `bg-primary/95 backdrop-blur-3xl border border-white/20 rounded-[32px] mx-4 mb-4 shadow-primary-glow` en vez del actual `bg-card/75`.
- Tab activa: `text-foreground` (azul noche) con peso `font-bold` y leve scale.
- Tab inactiva: `text-white/70`.
- Botón central de Psicoeducación: mantengo el gradiente naranja (es el sello del módulo), pero ajusto el ring para que conviva con el teal.

### 4. Dashboard / Home (`src/pages/Dashboard.tsx` + `WeekStrip` + `Timeline`)

- Fondo: `bg-background` (los glows vienen del AppLayout).
- Header: `font-display font-bold text-2xl text-foreground` para "Buen día, {nombre}".
- `WeekStrip`: día actual → círculo `bg-accent/20 text-foreground font-bold` + punto naranja debajo. Días inactivos: `text-muted-foreground`.
- `Timeline`: línea vertical `bg-muted/50`, nodos `border-2 border-muted bg-card`.
- Tarjetas de tareas: `bg-card/80 backdrop-blur-3xl border border-foreground/5 rounded-[32px] shadow-glass p-5`. Ícono circular izquierdo: `bg-accent/20` o `bg-primary/20` según tipo. Chips de subopciones: `bg-background text-foreground rounded-full px-3 py-1 text-xs`.

No toco la lógica de Dashboard (estados, fetchs, modals) — solo clases.

### 5. Auth oscuro violeta (`src/pages/Auth.tsx`)

- Fondo: `bg-gradient-to-br from-[#101927] via-[#1d163b] to-[#2a1758]` con dos blobs absolutos `bg-[#4c2889] blur-[120px] opacity-50`.
- Cards e inputs: `bg-[#101927]/40 backdrop-blur-xl border border-white/10 shadow-inner rounded-[24px]` con `text-white` y `placeholder:text-white/40`.
- Botones primarios: `bg-white/10 hover:bg-white/20 text-white rounded-full` para acciones secundarias; el CTA principal "Iniciar sesión / Crear cuenta" usa `bg-[#8b79f2] hover:bg-[#9d8df5] text-foreground rounded-full font-bold`.
- Tabs login/signup/forgot: pill switch translúcido `bg-white/5 border border-white/10`.
- Botón Google: mantiene el branding pero sobre fondo `bg-white text-foreground rounded-full`.
- Mensajes de error: `bg-rose-500/15 border border-rose-400/30 text-rose-200`.

### 6. Onboarding violeta (`src/components/onboarding/OnboardingShell.tsx`)

Ya está oscuro indigo — lo paso a la paleta solicitada:
- Fondo radial: `from-[#2a1758] via-[#1d163b] to-[#101927]`.
- Step dots: paso activo `bg-[#8b79f2]`, inactivos `bg-white/15`.
- `GlassInput` / `GlassChoice`: borde `border-white/10`, fondo `bg-[#101927]/40 backdrop-blur-xl`, focus `border-[#8b79f2]/60`.
- `GlassPrimaryButton`: `bg-white/10 hover:bg-white/20 text-white rounded-full` + variante "next-step" `bg-[#8b79f2] text-white shadow-[0_15px_40px_-15px_rgba(139,121,242,0.8)]`.

### 7. Recursos — solo el CTA Pack

En `src/components/recursos/BentoGrid.tsx`, el botón "Pack de Actividades" pasa de negro a `bg-primary text-foreground font-bold rounded-full`. El resto del grid de recursos **no se toca en esta ola** (queda para ola 2).

### Archivos modificados

```text
src/index.css                                    (tokens + Poppins)
tailwind.config.ts                               (fonts + shadows)
src/components/layout/AppLayout.tsx              (bg + AmbientGlows)
src/components/layout/AmbientGlows.tsx           (nuevo, movido de pack/)
src/components/layout/BottomNav.tsx              (teal protagonista)
src/components/home/WeekStrip.tsx                (día actual accent)
src/components/home/Timeline.tsx                 (nodos glass)
src/pages/Dashboard.tsx                          (clases → tokens)
src/pages/Auth.tsx                               (dark violeta full)
src/components/onboarding/OnboardingShell.tsx    (indigo → violeta #8b79f2)
src/components/recursos/BentoGrid.tsx            (solo el CTA Pack)
```

### Lo que **no** se toca en esta ola (queda para olas siguientes)

- Diario, Mi Proceso, Mindfulness, Psicoeducación, Recursos detalle, Tests, Profile, Settings, Admin Panel
- Modales (`CheckinModal`, `PsychoModal`, `SymptomsTestModal`, etc.)
- Pack BA (decisión del usuario: dejarlo como está)
- Iconografía: sigue `lucide-react` y `@phosphor-icons/react` donde ya están. No introduzco SVGs nativos salvo que aparezca un bug de compilación con `Plus`/`Target`.

### QA al cerrar la ola

Capturo screenshots en mobile (390×844) de: `/` (logged-in), `/auth`, `/onboarding` y `/herramientas`. Verifico contraste de texto sobre el teal del BottomNav y legibilidad del input oscuro en Auth. Confirmo que el dark mode sigue funcional cambiando el toggle (si existe en Settings).
