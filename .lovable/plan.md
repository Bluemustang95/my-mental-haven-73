## Home Terapéutico RESMA — Rediseño premium

Rediseño completo de `src/pages/Dashboard.tsx` (ruta `/`) aplicando glassmorphism clínico, check-in circadiano de 3 pasos con nube/luna reactivas, módulo recomendado dinámico, propagación noche→mañana y modo edición iOS (jiggle + long-press).

### Tokens de diseño (`src/index.css` + `tailwind.config.ts`)
- Añadir variables RESMA: `--resma-navy #101927`, `--resma-teal #7cc2c8`, `--resma-gold #facb60`, `--resma-light-bg #f9f9fb`, `--resma-light-bg-2 #e8ebf3`.
- Clase `.glass-premium` (rgba blanco 0.45, backdrop-blur 28px, border blanco 0.6).
- Keyframes nuevos: `jiggle` (rotación ±1.2°, 180ms infinite alternate, delay aleatorio por instancia), `pop` (scale 1→1.15→1), `blob-float-a` y `blob-float-b` (40s/55s, direcciones inversas).
- Fondo global del Home: gradiente `#f9f9fb → #e8ebf3` + 2 orbes `.glow-blob` (teal y gold, blur 80px, opacity 0.35) posicionados absolutos animados.
- Fuentes: cargar Playfair Display + Lora (Google Fonts) en `index.html`; mapear `font-serif-elegant` en Tailwind. Mantener Inter/Montserrat existentes.

### Layout blindado (`src/pages/Dashboard.tsx`)
Reestructurar el shell así:
```text
<div fixed-fondo gradiente + orbes>
  <div max-w-md mx-auto h-full sm:h-[90vh] sm:max-h-[760px] flex flex-col relative>
    <Header />            // fijo arriba
    <WeekStripPremium />  // fijo
    <ScrollArea flex-1 overflow-y-auto no-scrollbar pb-28 smooth-scroll>
       Tu Progreso (Timeline 3 pasos) + ZonaDescanso + Pendientes + Widgets
    </ScrollArea>
    <BottomNav absolute bottom-0 />  // ya global, ocultar en este viewport y usar versión absoluta interna
  </div>
</div>
```
- Eliminar `pb-24` y dejar que la `ScrollArea` interna gestione el scroll para que la nav nunca tape contenido.

### Cabecera + Semana (`src/components/home/WeekStrip.tsx` rework)
- Tarjeta glass redondeada con 7 chips L–D (22–28). Día activo: chip vertical en `resmaNavy`, letra blanca, número grande, dot inferior `resmaGold`.
- Al cambiar día: `toast("Visualizando el progreso del [Día]")` (sonner) + actualiza `selectedDate`.

### Check-in circadiano (`src/components/modals/CheckinModal.tsx` rework completo)
Wizard 4 pantallas Mañana / 3 pantallas Noche, navegación con Framer Motion (slide horizontal). Persistir en `daily_checkins` (mode, sleep_score/day_score, emotions[], dream_text, thought_text, day_goal, highlight, next_day_focus).

Mañana:
1. **Slider sueño** 0–100, componente `ReactiveCloud`:
   - 0–25 ⛈️ tinte azul-grisáceo + "Pésimo descanso con tormenta mental"
   - 26–50 ☁️ "Normal, un poco gris y pesado"
   - 51–75 🌤️ "Buen descanso, cielo despejado"
   - 76–100 ☀️✨ "¡Excelente! Energizado y radiante"
2. **Grilla 3×3 emociones** (Agotamiento, Ansiedad, Alegría, Enojo, Tristeza, Calma, Motivado, Confuso, Cariño). Toggle multi, `animate-pop`, borde acento al activar.
3. **Diario mínima fricción**: ¿Soñaste? Sí/No. Si Sí ⇒ textarea autoexpandible (`framer-motion AnimatePresence`). Textareas opcionales: pensamiento + objetivo del día.
4. **Progreso semanal radial**: SVG circular (stroke `resmaTeal`), "n de 7 días".

Noche:
1. **Slider día** con `ReactiveMoon`: 🌑 / 🌙 / 🌗 / 🌕✨ + textos descritos.
2. Grilla emociones multi-select.
3. Textareas: "¿Qué destacarías?" y "¿Qué te gustaría mejorar mañana?" → guarda `next_day_focus`.

### Propagación noche→mañana
- En `loadToday` leer último `daily_checkins` con `mode=night` del día anterior y `next_day_focus`.
- Si existe y aún no hay check-in matutino: renderizar `<MorningCallback>` widget destacado al inicio de la Timeline: "Ayer querías mejorar: '…'. Hoy lo vamos a encarar juntos" con CTA que abre Mañana.
- Requiere columna `next_day_focus` (text) en `daily_checkins` — añadir vía migración si no existe.

### Módulo recomendado dinámico
- Reescribir nodo "psycho/practice" como **una sola tarjeta** `RecommendedResourceCard` (segundo nodo de la Timeline) que en cada montaje selecciona aleatoriamente desde `get_daily_recommendations` (ya existente) o pool fallback (Lectura TCC, Podcast DBT, Botón de Pánico). Muestra etiqueta tipo "PODCAST · DBT", título, duración y CTA "Comenzar recurso recomendado".

### Zona de Descanso
- Tarjeta gradiente violeta→navy debajo del nodo nocturno, navega a `/herramientas/sueno` (ya conectado, ahora glass + glow más profundo).

### Pendientes para vos
- 2 columnas compactas reusando `PendingBento` rediseñado: "Pack de activación" (estado dinámico de progreso) y "Te puede aliviar" (respiración 4-7-8, 3 min).

### Widgets activos + modo edición iOS
Nuevo componente `src/components/home/WidgetsBoard.tsx`:
- Estado persistido en `localStorage` (`home_widgets_v1`): `{ id, enabled, size: 'full'|'half', hidden }` para nodos timeline, pendientes, zona descanso y widgets (Mini Hábitos, Agradecimiento, Notas de Contención).
- Botón "+" junto a "Tu Progreso de Hoy" abre un sheet (Radix Sheet) con toggles para activar/desactivar widgets.
- **Long-press 800ms** (hook `useLongPress` con `mousedown`+`touchstart`) sobre cualquier widget → activa `editMode`:
  - Toast: "¡Personalización activada! Cambia de tamaños o quita elementos ✨"
  - Todas las tarjetas aplican `animate-jiggle` con delay aleatorio.
  - Aparece ✕ rojo arriba-izq (oculta), ↔️ arriba-der (toggle col-span-2 / col-span-1, layout grid 2 col que se reordena con transición `layout` de framer-motion).
  - Barra superior fija con "Restablecer Todo" y "Listo" (sale del modo).
- Widgets nuevos a renderizar cuando estén activos: **Mini Hábitos** (lee primer hábito activo del usuario, check rápido), **Agradecimiento** (textarea micro), **Notas de Contención** (textarea persistida en `journal_entries`).

### Base de datos (migración mínima)
```sql
ALTER TABLE public.daily_checkins
  ADD COLUMN IF NOT EXISTS next_day_focus text,
  ADD COLUMN IF NOT EXISTS dream_text text,
  ADD COLUMN IF NOT EXISTS thought_text text,
  ADD COLUMN IF NOT EXISTS highlight text,
  ADD COLUMN IF NOT EXISTS emotions text[];
```
(Sin nuevas tablas; RLS existente conserva.)

### Archivos a crear/modificar
- Modificar: `src/pages/Dashboard.tsx`, `src/components/home/WeekStrip.tsx`, `src/components/home/Timeline.tsx`, `src/components/home/PendingBento.tsx`, `src/components/modals/CheckinModal.tsx`, `src/index.css`, `tailwind.config.ts`, `index.html`.
- Nuevos: `src/components/home/ReactiveCloud.tsx`, `ReactiveMoon.tsx`, `RecommendedResourceCard.tsx`, `WidgetsBoard.tsx`, `MorningCallback.tsx`, `RadialWeekProgress.tsx`, `src/hooks/useLongPress.ts`, `src/lib/homeWidgets.ts`.
- Migración SQL para columnas extra en `daily_checkins`.

### Notas técnicas
- Reusar `sonner` para todos los toasts.
- Animaciones con `framer-motion` (ya instalado) — `layout` para reflow de grid en modo edición.
- Mantener Argentina UTC-3 con `localDateStr()` en lecturas/escrituras de `daily_checkins`.
- Conservar `PremiumLock` para usuarios free; admin (rol existente) sigue desbloqueado por el cambio previo en Settings.
