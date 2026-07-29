## Qué me parece

Me gusta mucho la dirección: la ilustración zen + tarjetas flotantes comunica el producto (sueño, cuidado clínico, índice de bienestar) mucho mejor que el isotipo solo que hay hoy. Tres observaciones antes de construir:

1. **El "contenedor móvil" (`max-w-md`, `rounded-[40px]`, `shadow-2xl`) es el marco del mockup, no la pantalla.** La app ya corre en móvil dentro de `OnboardingShell`, así que si lo aplico literal vas a ver una tarjeta flotando con bordes redondeados dentro de la pantalla del celular. Propongo aplicar el degradado pastel a la pantalla completa y dejar el marco solo para desktop (donde sí se ve bien).
2. **Las métricas de las tarjetas son ficticias** ("82 pts", "Equilibrio 78/100"). Está bien como ilustración de producto, pero en la primera pantalla, antes de registrarse, puede leerse como un dato real del usuario. Sugiero mantener los números (venden bien) y que las tarjetas se sientan claramente como una muestra visual, no un dashboard: sin interacción, ligeramente rotadas y flotando, como en tu mockup.
3. **Coherencia de marca**: hoy el splash usa el isotipo RESMA grande. Con el nuevo diseño el isotipo pasa a la píldora del header (más chico). Me parece bien, pero perdemos presencia de marca; lo compenso con el `ResmaIsotipoMark` existente dentro de la píldora en lugar de un ícono nuevo.

Todo lo demás (paleta, tipografía, animaciones, CTA, footer legal) lo tomo tal cual lo describís.

## Alcance

Solo la **primera pantalla del onboarding** (`SplashIntro`). No se tocan las slides de valor, el wizard, ni el algoritmo.

## Cambios

**1. `src/components/onboarding/IntroScreens.tsx` — reescribir `SplashIntro`**

- **Fondo**: degradado `from-[#f3fafb] via-white to-[#e6f4f5]` a pantalla completa; en desktop, contenedor `max-w-md rounded-[40px] shadow-2xl`.
- **Header**: píldora flotante `bg-white/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border-[#7cc2c8]/40`, con `ResmaIsotipoMark` chico, texto "RESMA" en Serif mayúsculas y punto verde con `animate-ping`.
- **Área visual (~280px)**, en capas:
  - Aura ambiental menta/turquesa con `animate-pulse-aura`.
  - SVG orgánico: forma fluida de fondo, sol `#fef08a` con pulso suave, colinas rodantes, brote/planta verde central.
  - Tarjeta sup-izq (Sueño): glass `bg-white/95 backdrop-blur-md`, borde violeta claro, ícono `Moon`, "Sueño Reparador" / "82 pts • Higiene ok", rotación `-3°`, `animate-card-1`.
  - Tarjeta inf-der (Métrica): `bg-slate-900/90 text-white`, ícono `Sparkles` con pulso, "MI SINTONÍA • Al día" / "Equilibrio 78/100", rotación `2°`, `animate-card-2`.
  - Badge sup-der: píldora esmeralda con `ShieldCheck` + "Cuidado Activo".
- **Frase central**: `text-base sm:text-lg text-slate-800`, centrada, interlineado holgado, texto sin cambios.
- **CTA**: `w-full rounded-2xl bg-[#7cc2c8] hover:bg-[#63b3b9] active:scale-[0.99]`, "COMENZAR MI VIAJE" + `ArrowRight` que se desplaza en hover.
- **Footer legal**: `text-[10px] text-slate-600` + los dos enlaces subrayados, siguen leyendo los links configurables desde `loadLegalLinks()` (admin) tal como ahora.

**2. `src/index.css` — nuevos keyframes**

- `floatCard1`: 0 → -9px con micro-rotación -2° → 0°.
- `floatCard2`: flotación desfasada con rotación 2° → 3°.
- `pulseAura`: respiración con `scale` + blur.
- Clases `.animate-card-1`, `.animate-card-2`, `.animate-pulse-aura`, todas desactivadas bajo `prefers-reduced-motion` (ya hay ese bloque en el archivo).

**3. `src/components/onboarding/OnboardingShell.tsx`** — ajuste mínimo si el shell impone padding/fondo que choque con el nuevo degradado a pantalla completa.

## Detalles técnicos

- La ilustración se hace en SVG inline (sin imágenes generadas), para que escale nítido y se anime por CSS.
- Animaciones por CSS puro (no framer-motion) para las tarjetas flotantes; se mantiene framer-motion solo para la entrada inicial escalonada.
- Los colores nuevos (`#2c7a80`, `#fef08a`) se usan localmente en esta pantalla de marca; no se agregan como tokens globales salvo que los quieras reutilizar después.
