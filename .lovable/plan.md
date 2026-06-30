# Mindfulness: Hub unificado + Reproductor Inmersivo

## 1) Entrada a Mindfulness → directo a Respiración (sin Body Scan)

**Ruta**: `/herramientas/mindfulness` redirige a `/herramientas/mindfulness/respiracion`.

- `src/App.tsx`: cambiar el `Route` del hub por un `<Navigate to="/herramientas/mindfulness/respiracion" replace />`. Quitar import de `MindfulnessHub`.
- Eliminar también referencias a `/observar` y `/describir` del hub (las rutas siguen existiendo por compatibilidad pero ya no son accesibles desde Mindfulness).
- En `BreathingHome.tsx`:
  - Quitar el segmented control "Respiración / Body Scan" del `IntentionScreen` (eliminar `tab` y `BodyScanEmpty`).
  - El header ya muestra "MINDFULNESS · RESMA" como en imagen 2 → mantener.

## 2) Cards de intención con estilo "inventarios"

Las 4 tarjetas (Dormir mejor / Bajar ansiedad / Concentrarme / Equilibrar) pasan al estilo de los tests psicométricos (`AllTests.tsx`):

- Fondo blanco sólido limpio (no glass translúcido), bordes redondeados `rounded-3xl`, sombra suave.
- Icono circular pastel arriba a la izquierda (manteniendo los colores actuales por patrón).
- Título en bold y descripción en gris claro, **sin truncar** el detalle del patrón ("4-7-8", "Suspiro fisiológico", etc.) como segunda línea.
- Estrella de favorito chiquita arriba a la derecha (se conserva).

## 3) Reproductor Inmersivo (Full-Screen)

Reescribir `PlayerScreen` dentro de `BreathingHome.tsx` para ocupar **toda la pantalla** sobre el gradiente del ejercicio (sin contenedores blancos, sin module-nav inferior, sin orbs, sin scroll). Mientras `step === "player"`, el shell del módulo entra en modo inmersivo:

- Ocultar `ModuleNav` y el botón flotante de IA durante el player.
- Ocultar los orbs decorativos y el `Header` global; el player renderiza su propio header.
- Contenedor: `fixed inset-0 z-50` con el gradiente por patrón (el oscuro de "Dormir" se extiende al resto, adaptando el accent).

### Capas (z-index)

**Capa 0 — Fondo**: gradiente full-screen del patrón + animación SVG/motion centrada (los 4 visualizadores actuales `VisualizerSleep / Sigh / Box / Coherence` se mantienen tal cual, escalados a `absolute inset-0`).

**Capa 1 — UI superpuesta** (`relative z-10 flex flex-col h-full justify-between p-5`):

- **Header (arriba)**:
  - Izquierda: botón circular glass con `ChevronLeft` (vuelve a setup).
  - Centro: columna con
    - título del ejercicio en `text-[10px] uppercase tracking-[0.2em] text-white/50` (ej. "BAJAR ANSIEDAD").
    - debajo, **píldora glassmorphic** (`bg-white/10 backdrop-blur-md rounded-full px-4 py-1.5`) con el tiempo restante de la sesión (`4:47`) en blanco semibold.
  - Derecha: botón circular glass con `HelpCircle`.

- **Centro libre** (`flex-1`): vacío, deja respirar la animación.

- **Bloque inferior** (apilado, centrado):
  - Instrucción grande: `text-5xl font-light` en el color de acento del patrón (`pattern.accent`), animada con fade entre fases ("EXHALÁ", "INHALÁ", "SOSTENÉ"…).
  - Contador de fase debajo: número grande en blanco/serif claro (`text-6xl font-light text-white/90`) con los segundos restantes de la fase actual (`Math.ceil(phase.seconds - phaseElapsed)`).
  - Guion de soporte (cue) en `text-sm italic text-white/70` debajo del número.
  - Botonera base: dos píldoras glass (`bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-5 h-11`) → **Pausar/Reanudar** y **Detener**.

- Sin caja para los subtítulos ni timers separados — todo flota directo sobre la animación.

### Gradientes por patrón

| Patrón | Gradiente fondo | Accent texto |
|---|---|---|
| 478 (Dormir) | `#0c1530 → #162447` | `#A7D8A3` |
| Sigh (Ansiedad) | `#0b2a2c → #14545a` | `#7CC2C8` |
| Box (Concentrar) | `#0e2418 → #1F3B26` | `#7FCB8E` |
| Coherence (Equilibrar) | `#2b1d05 → #4a3210` | `#F5C56A` |

## 4) Detalles técnicos

- `BreathingHome.tsx`:
  - Nuevo render condicional: si `step === "player"`, devolver un fragmento `<ImmersivePlayer />` aparte (fuera del shell mobile) usando `createPortal` o simplemente un `<div className="fixed inset-0 z-50">` antes del shell normal.
  - Mover `useBreathingCycle` y los 4 `Visualizer*` al nuevo `ImmersivePlayer`. Eliminar `<div className="absolute bottom-3 ...">` con label+segundos (ahora viven en el bloque inferior).
  - Conservar `voice` (TTS por fase) y `ambient` tal como están.
  - Mantener `HelpModal` y `AiDrawer`; en modo player, el botón de ayuda abre el `HelpModal` por encima del fullscreen (`z-[60]`).
  - Mantener `document.body.classList.add("zen-mode")` para ocultar la `BottomNav` global.

- `src/App.tsx`: añadir `import { Navigate } from "react-router-dom"` y reemplazar el route del hub.

## 5) Fuera de alcance (no se toca)

- Rutas `/observar` y `/describir` se dejan en código (no se borran archivos) pero quedan huérfanas.
- Animaciones de respiración: misma matemática y SVGs, solo escalados a fullscreen.
- Setup screen (intención → minutos → voz/ambiente) sin cambios visuales.
