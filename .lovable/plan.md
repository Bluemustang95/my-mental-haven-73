## Cambios a aplicar

### 1. Mindfulness · Pantalla de Intención (BreathingHome.tsx)
- Eliminar el título "¿Qué necesitás ahora?" y el subtítulo.
- Simplificar `PatternCard`: dejar solo el **icono + título** (quitar descripción y tag "PATRÓN 4-7-8"/etc.).
- Dar a cada card una **identidad de color propia**: fondo tintado usando el `iconBg` del patrón (lavanda para Dormir, aqua para Bajar ansiedad, verde para Concentrarme, dorado para Equilibrar), con borde sutil del mismo tono y mantener la estrella de favorito.

### 2. Voz ElevenLabs — corregir fallback robótico
Causa: `supabase.functions.invoke` con respuesta binaria no siempre devuelve `Blob`/`ArrayBuffer` en este SDK; cae al `catch` y usa `speechSynthesis`.
- Reemplazar `supabase.functions.invoke` por un `fetch` directo al endpoint de la edge function `mindfulness-tts` con `Authorization` del usuario y leer `response.arrayBuffer()` → `Blob({type:"audio/mpeg"})`. Usar el voice del hook `useUserVoice` (Argentina por defecto).
- Quitar el fallback a `speechSynthesis` (o dejarlo en silencio): si falla ElevenLabs, no hablar — nunca usar voz robótica.

### 3. Reproductor inmersivo · Ajustes durante la práctica
- Agregar botón **engranaje** en el header (junto a Ayuda) que abre un **panel deslizante** con:
  - Toggle Voz de guía (on/off).
  - Toggle Sonido ambiente (on/off).
  - **Selector de ambiente** (pills): Silencio, Lluvia, Bosque, Olas, Ruido blanco.
- Implementar reproducción real del audio ambiente con `HTMLAudioElement` en loop a bajo volumen (usar pistas existentes en `src/lib/ambientLibrary.ts` o `sleepAudio.ts`; reusar `useAmbientPlayer` si encaja). Al cambiar de ambiente, cross-fade simple.
- Tipografía del centro inferior más compacta: `Inhalá/Exhalá` de `text-5xl` → `text-2xl`, contador de `text-6xl` → `text-4xl`, ocultar el `cue` italic largo (que generaba el bloque "Exhalá largo" enorme).

### 4. Patrón "Bajar ansiedad" — onda continua 4s / 6s
- Cambiar las phases a: `inhale 4s` + `exhale 6s` (eliminar `inhale2`).
- Reescribir `VisualizerSigh` como **onda sinusoidal scrolleante** infinita:
  - Path SVG con varios ciclos de seno que se desplazan horizontalmente (transform translateX animado, loop).
  - Bolilla fija en el centro horizontal; su `y` sube durante inhale y baja durante exhale siguiendo la curva visible — la onda continúa desplazándose hacia la izquierda "saliendo de pantalla" dando efecto de continuidad.
  - Mantener cycle.phaseProgress como driver de la posición vertical de la bolilla.

### 5. Hábitos · Constancia mes actual (HabitCard.tsx)
- Cambiar el grid de constancia: usar **todos los días reales del mes actual** (28–31) en vez de los primeros 20.
- Grid responsive: `grid-cols-7` (formato calendario) en lugar de `grid-cols-10`.
- Confirmar que al tildar el botón principal de hoy, el círculo correspondiente al día de hoy también queda coloreado con `habit.color` (el estado ya viene de `doneSet`, así que con el fix del rango y el re-render por `completions` debería pintarse automáticamente; verificar visualmente).

## Detalles técnicos

- Archivos modificados:
  - `src/pages/mindfulness/BreathingHome.tsx` — intención, fetch TTS, panel ajustes, tipografía player, nuevo VisualizerSigh, phases sigh.
  - `src/components/habitos/HabitCard.tsx` — `monthCells()` ya devuelve los días reales; quitar `.slice(0, 20)` y cambiar a `grid-cols-7`.
- Sin cambios de schema. Sin nuevas dependencias.
- Voz: reutilizar `useUserVoice()` para respetar la elección por país.
