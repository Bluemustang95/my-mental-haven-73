## Diario Clínico & Modo Zen AMOLED

Reescritura completa de `src/pages/Diario.tsx` (495 líneas → un solo archivo cohesivo) manteniendo la ruta `/diario` y la tabla `journal_entries` existente. Sin migraciones de DB. Solo trabajo de frontend + un helper de audio.

### Vistas (intercambio fluido SPA con `AnimatePresence`)

1. **Escritura (default)** — header Serif "Diario / Tu espacio seguro para escribir", iconos 🔓 (privacidad, visual) y 🕐 (historial) en la esquina.
2. **Historial** — lista de bitácoras pasadas con tarjetas glass, fecha, emoción con halo, triggers; CTA inferior "Escribir Diario".
3. **Modo Zen (AMOLED)** — el mismo lienzo pero la app entera se oscurece a `#050508`, la BottomNav global se desvanece, aparece "✕ Salir" arriba y el panel de Paisajes Sonoros debajo.

### Composición del lienzo de escritura

- Contenedor `max-w-md h-screen flex flex-col` con dos orbes glow animados de fondo (claro) y `pb-28` para respetar `BottomNav`.
- Glassmorphic panel con `textarea` Serif (Lora) + botón flotante **"Inspirame ✨"** en la esquina superior derecha que inserta uno de 3 prompts TCC/DBT/Estoicismo (Dicotomía de control, Visualización de lo peor, Gratitud somática), mostrados como banner desplegable sobre el textarea con botón ✕ para cerrar.
- **Barra de adjuntos** (4 botones pill): 📸 Cámara (`<input capture="environment">`), 🖼️ Foto (`accept="image/*"`), 📎 Archivo (libre), 🎙️ Audio (toggle).
- **Mosaico de previews**: grid auto-fill, thumbnails de cristal, botón rojo ✕ para eliminar. URLs vía `URL.createObjectURL` (solo cliente; no se sube nada en esta versión).
- **Grabadora de voz**: al activar Audio se despliega una barra con temporizador `mm:ss` y onda SVG de 12 barras animadas por `setInterval` (alturas aleatorias).
- **Acordeones lado a lado** (grid 2 cols): `SIENTO…` (Calma/Alegría/Tristeza/Ansiedad/Enojo/Agotamiento, single-select) y `CAUSAS…` (Trabajo/Pareja/Salud/Finanzas/Sueño, multi-select). Cada cabecera muestra el valor actual o "N sel.". Sólo uno abierto a la vez.
- Footer fijo dentro del shell: **Vaciar** (outline) + **Registrar Entrada** (sólido teal). Botón **"⚘ MODO ZEN"** al costado superior del footer.

### Modo Zen

- Toggle agrega clase `zen` al root → sobrescribe el background a `#050508`, oculta orbes, baja opacidad de header, agrega clase global `document.body.classList.add('zen-mode')` que desde `index.css` aplica `opacity-0 pointer-events-none` al selector de la `BottomNav` existente.
- Aparecen tarjeta "Paisajes Sonoros Binaurales" con 4 toggles: 528Hz Solfeggio, Lluvia suave, Ruido Marrón, Click Mecánico.
- Botón ✕ Salir arriba a la izquierda (revierte estado y clase).

### Helper de audio nuevo `src/lib/diarioAudio.ts`

Web Audio API, sin assets externos:
- `playSolfeggio()` — `OscillatorNode` sinusoidal a 528Hz + LFO `OscillatorNode` 0.5Hz → `GainNode` para vibrato.
- `playRain()` — buffer de ruido blanco loop + `BiquadFilter` lowpass, frecuencia modulada por LFO lento.
- `playBrown()` — generador de ruido Browniano (integrador) + lowpass 400Hz.
- `playKeyClick()` — disparable; oscilador square corto + envelope (5ms ataque, 30ms decay).
- `stopAll()` y `stop(track)`.

El textarea en Zen, si "Click Mecánico" está activo, llama `playKeyClick()` en `onChange` para cada keystroke nuevo.

### Historial

- Query `select * from journal_entries where user_id = auth.uid() order by created_at desc`.
- Tarjeta glass: fecha (es-AR), chip de emoción con halo teal, tags de causas, content truncado a 3 líneas, mini-reproductor placeholder si la entrada incluye marcador `[audio]` en content.

### Guardado

- Insert en `journal_entries`: `content`, `entry_date = localDateStr()`, `emotion_tags = [emoción, ...causas]`, `prompt` = el inspirame usado (si lo hubo).
- Los adjuntos y la nota de voz quedan en el cliente (futuro: storage bucket). El spec no exige persistencia esta vuelta.
- Toast "Guardado con éxito" + reset del lienzo + posibilidad de saltar al historial.

### Tokens / estilo

- Colores fijos del spec por consistencia clínica: `#f9f9fb` light bg, `#050508` zen bg, `#101927` resmaNavy, `#7cc2c8` teal, `#facb60` gold. Hardcoded sólo dentro de este módulo para asegurar el look AMOLED puro del Zen.
- Glass: `bg-white/45 backdrop-blur-2xl border-white/60` (claro) / `bg-white/[0.04] backdrop-blur-xl border-white/10` (zen).
- Animaciones orb 18-22s loop con `@keyframes orb-1/orb-2` añadidos a `index.css` (single import, sin tocar tailwind config).

### Archivos

- ✏️ `src/pages/Diario.tsx` — reescritura.
- ➕ `src/lib/diarioAudio.ts` — síntesis Web Audio.
- ✏️ `src/index.css` — keyframes `orb-1`, `orb-2`, `.zen-mode .resma-bottom-nav { opacity:0; pointer-events:none }` (verifico el selector real del BottomNav antes de escribir).

### Fuera de alcance

- Subida real de adjuntos/audio a Storage.
- Edición de entradas existentes.
- Recomendaciones dinámicas por keywords del Diario actual (se remueven para limpiar el flujo según el nuevo diseño).
