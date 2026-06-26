# Plan: Rediseño Mindfulness & Respiración Consciente

Reescribir el flujo `/herramientas/mindfulness/respiracion` (y el hub `/herramientas/mindfulness`) como una experiencia mobile-first de gama premium tipo Calm/Apple Health, manteniendo el sistema de tokens RESMA ya presente (`resmaNavy`, `resmaTeal`, `resmaGold`, glassmorphic, orbes animados, fuentes Inter/Montserrat/Playfair).

Las capturas adjuntas muestran que la base estética ya existe. El rediseño se enfoca en: blindar el layout, refinar los 3 pasos, mejorar los 4 visualizadores y unificar controles globales.

## 1. Shell del módulo (blindado elástico)

Nuevo wrapper `MindfulnessShell` reutilizable para las 3 pantallas:

```text
┌─ relative max-w-md mx-auto h-full sm:h-[90vh] sm:max-h-[760px] ─┐
│  Background: gradiente claro + 2 orbes animados (orb-1/orb-2)   │
│  ┌─ Header sticky (MINDFULNESS · RESMA · back · ?) ──────────┐  │
│  ├─ flex-1 overflow-y-auto no-scrollbar pb-28 smooth-scroll  │  │
│  │   → Pantalla 1 / 2 / 3                                    │  │
│  └─ BottomNav absolute bottom-0 w-full (3 botones)           │  │
│  Floating: botón IA (drawer chatbot)                          │  │
└──────────────────────────────────────────────────────────────────┘
```

- Oculta la `BottomNav` global (clase `zen-mode` o flag local) para evitar doble barra.
- Botón "?" abre `BreathingEducationModal` (modal centrado, serif, nervio vago / amígdala).
- Botón flotante IA abre `BreathingAiDrawer` (Sheet bottom, historial pre-renderizado).

## 2. Pantalla 1 — Intención

- Segmented control premium `Respiración | Body Scan` (pill navy activa, blanco glass inactivo).
- Body Scan → estado vacío estético "Módulo clínico en desarrollo" (icono + serif).
- Grid 2×2 de tarjetas glass para los 4 pilares con icono coloreado, título, descripción corta y estrella favorito:
  - Dormir mejor (4-7-8) · luna lila
  - Bajar ansiedad (Suspiro Fisiológico) · onda teal
  - Concentrarme (Box 4-4-4-4) · diana verde
  - Equilibrar (Coherencia 5-5) · símbolo gold

## 3. Pantalla 2 — Ajuste de sesión

- Card resumen del ejercicio elegido (icono + nombre + patrón).
- Slider 1–20 min con marcadores (1, 5, 10, 15, 20), label "TIEMPO DE PRÁCTICA" + valor grande.
- Panel glass con dos toggles:
  - Activar Voz de Guía (subtítulos dinámicos).
  - Sonido de Fondo (lluvia tenue, vía WebAudio sintetizado existente o silencio si no disponible).
- CTA navy full-width `Comenzar práctica →`.

## 4. Pantalla 3 — Reproductor activo

Cada ejercicio renderiza su visualizador singular (SVG + framer-motion, sin libs nuevas):

- **Dormir 4-7-8**: fondo nocturno profundo, orbe translúcido que late siguiendo fase (escala 0.7↔1.15), partículas de luz estelar (10–14 puntos) flotando lento de abajo→arriba.
- **Suspiro fisiológico**: onda sinusoidal SVG; bola brillante recorre la curva: sube pendiente 1 (inh1), micro-salto (inh2), desliza largo y suave por la pendiente descendente (exh).
- **Box 4-4-4-4**: cuadrado de líneas finas; nodo de luz viaja por el perímetro exacto en 4 segmentos de 4s.
- **Coherencia cardíaca 5-5**: Flor de la vida (7 círculos entrelazados) que expande hacia afuera 5s (inh) y se pliega al centro 5s (exh), continuo sin pausas.

Soporte:
- Subtítulos dinámicos serif (instrucciones cortas por fase).
- Timer cuenta regresiva grande.
- Controles `Pausar/Reanudar` y `Detener` (pills glass).
- Hook `useBreathingCycle(pattern)` que centraliza fases (inh/hold/exh/holdEmpty) y dura­ciones.

## 5. Controles globales

- `BreathingEducationModal`: explicación clínica del entrenamiento respiratorio (nervio vago, amígdala) con tipografía Playfair/Lora.
- `BreathingAiDrawer`: Sheet inferior con burbujas de chat pre-renderizadas (guía empática "voseo") + input deshabilitado o conectado a edge function existente si la hay; si no, simulado.
- Mini-navbar absoluta de 3 botones (Inicio módulo, Configurar, Reproductor) para saltar entre pasos cuando hay sesión activa.

## 6. Archivos

Crear / reescribir:
- `src/pages/mindfulness/BreathingHome.tsx` (orquesta los 3 pasos con estado local).
- `src/components/mindfulness/breathing/MindfulnessShell.tsx` (shell blindado).
- `src/components/mindfulness/breathing/IntentionScreen.tsx`
- `src/components/mindfulness/breathing/SetupScreen.tsx`
- `src/components/mindfulness/breathing/PlayerScreen.tsx`
- `src/components/mindfulness/breathing/visuals/VisualizerSleep.tsx` (rediseño)
- `src/components/mindfulness/breathing/visuals/VisualizerSigh.tsx` (rediseño)
- `src/components/mindfulness/breathing/visuals/VisualizerBox.tsx` (rediseño)
- `src/components/mindfulness/breathing/visuals/VisualizerCoherence.tsx` (rediseño)
- `src/components/mindfulness/breathing/BreathingEducationModal.tsx`
- `src/components/mindfulness/breathing/BreathingAiDrawer.tsx`
- `src/lib/mindfulness/breathingPatterns.ts` (catálogo + fases).
- `src/lib/mindfulness/useBreathingCycle.ts` (hook fase/tick).

Sin cambios de DB ni edge functions. Sin libs nuevas (framer-motion ya presente).

## 7. Verificación

- Typecheck del build.
- Revisar visualmente las 3 pantallas con Playwright (390×809) y capturar 1 screenshot por paso + 1 por visualizador para verificar que nada queda tapado por la nav fija.
