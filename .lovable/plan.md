# Plan — Mindfulness por fases · Fase 1: Respiración

Avanzamos por fases. Esta primera fase deja la **base reutilizable** (wrapper, SUDS, registro, calendario, audio) + el módulo de **Respiración** completo y muy pulido. Las fases siguientes (Observar, Describir) se construirán encima sin retrabajo.

## Alcance de la Fase 1

### A. Base reutilizable
1. **`<ExerciseShell>`** — wrapper genérico que envuelve cualquier ejercicio futuro:
   - Paso 1 · **Pre SUDS**: bottom sheet oscuro translúcido con slider 0–10 grande (estilo iOS), emoji dinámico que cambia según el valor, botón "Omitir". Pregunta: "¿Qué tan intenso sentís el malestar ahora mismo?".
   - Paso 2 · **Actividad** a pantalla completa con fondo `bg-[#0F172A]` forzado.
   - Paso 3 · **Post SUDS**: mismo slider, "¿Y ahora?".
   - Paso 4 · **Resumen**: comparativa Pre→Post con flecha (verde baja / ámbar igual / rojo sube), micro-sparkline de las últimas 5 sesiones del mismo `resourceKey`, y card de psicoeducación dinámica según el ejercicio. Botón "Finalizar y guardar".
   - Bloqueo de gestos durante la sesión: botón X único, swipe-back deshabilitado.

2. **Persistencia** en `exercise_sessions` (tabla ya existe): `resource_key`, `sub_mode`, `duration_seconds`, `pre_score` (0-10), `post_score` (0-10), `delta`, `voice_enabled`, `music_track`, `completed_at`. Migración: agregar columnas que falten (`pre_score`, `post_score`, `sub_mode`, `music_track`, `voice_enabled` si no están).

3. **Calendario + historial**:
   - `WeekStrip` reutilizable en la cabecera del recurso (puntito ámbar = parcial, verde = sesión completa registrada).
   - `calendarActivity.ts` enriquecido: cada sesión aparece como `{ type: "mindfulness", label, detail: "SUDS 7→3", time }` en `CalendarDay` y `SettingsHistory`.

4. **Audio engine compartido (`useMindfulAudio`)**:
   - Voz guía: `SpeechSynthesis` con `lang="es-AR"`, rate 0.88, pitch 1.02. Toggle on/off. Cleanup garantizado (`cancel()` en unmount). Arquitectura preparada para enchufar ElevenLabs en fase futura sin refactor.
   - Música ambiente: 3 loops cortos como assets CDN — `lluvia.mp3`, `ambient.mp3` y modo `silencio` (sin audio). Selector tipo píldoras. Volumen independiente de la voz. Loop con `<audio loop>` y fade-in/out de 1s al cambiar.

### B. Módulo Respiración (Fase 1 completo)

**Pantalla de configuración** (antes de iniciar):
- **Patrón de respiración** (cards seleccionables, no solo Box):
  - `Box 4-4-4-4` — regulación general
  - `4-7-8` — sueño/ansiedad alta
  - `Coherencia 5-5` — el más validado (6 rpm)
  - `Suspiro fisiológico` — baja ansiedad rápido
- **Duración**: presets 1 / 3 / 5 min + long-press en el botón para abrir slider 30s–20min.
- **Sub-modo visual**: Orbe Luminoso *o* Escáner Corporal (tabs píldora).
- **Toggles**: Voz guía, Vibración háptica.
- **Selector de música**: Lluvia / Ambient / Silencio.
- Botón grande "Comenzar".

**Sub-modo A · Orbe Luminoso**:
- Orbe central con `blur-3xl`, gradiente naranja cálido (inhala) / azul-índigo (exhala).
- Anillo de progreso SVG alrededor que se "vacía" en cada fase (da certidumbre temporal).
- Animación adaptativa al patrón elegido (los tiempos cambian, no solo 4-4-4).
- Vibración `navigator.vibrate`: pulsos cortos al inhalar, silencio al sostener, vibración larga al exhalar.
- Texto de fase grande + tiempo MM:SS.
- Tap en el orbe = pausa/reanudar con transición suave.

**Sub-modo B · Escáner Corporal**:
- Reusa `BodyMapSvg` ya existente. Highlight progresivo de 7 zonas (cabeza → mandíbula → cuello → pecho → abdomen → piernas → pies).
- 30–45s por zona configurable según duración total.
- Texto + voz por zona: "Llevá la atención a tu mandíbula…".

**Cierre de sesión**: al completarse el timer, el `ExerciseShell` toma el control y dispara Post → Resumen → guardar.

### C. Detalles UX que respetan reglas del proyecto
- Fondo oscuro **solo durante el flujo del wrapper**; el resto del recurso usa el tema claro habitual.
- Sin gamificación agresiva: el resumen muestra "5 sesiones este mes" en tono descriptivo, sin medallas/puntos.
- Bottom sheets suaves (Drawer), dismiss fácil.
- Banner discreto "Activá No Molestar" al iniciar (sin bloquear).
- "Respiro de 1 minuto" como botón express en Home del recurso: salta Pre/Post y va directo a 4-7-8 × 4 ciclos.

## Fuera de alcance (fases siguientes)
- **Fase 2**: Módulo Observar (Nubes Pasajeras + Lupa de los Sentidos con la versión "Tocar real" en vez de canvas-scratch).
- **Fase 3**: Módulo Describir (Tinder Hechos/Juicios con banco editable desde admin + AI; Escáner Neutral con Gemini; Anatomía de la Emoción sobre `body_map_entries`).
- **Fase 4**: ElevenLabs (con cacheo en Storage), música generada, recordatorios de notificación.

## Detalle técnico

### Archivos nuevos
- `src/components/exercises/ExerciseShell.tsx` — wrapper Pre/Post/Resumen.
- `src/components/exercises/SudsSlider.tsx` — slider 0-10 con emoji dinámico.
- `src/components/exercises/SessionSparkline.tsx` — mini-gráfico últimas 5 sesiones.
- `src/components/exercises/PsychoCard.tsx` — card educativa dinámica por `resourceKey`.
- `src/hooks/useMindfulAudio.ts` — voz (SpeechSynthesis) + música (loops) + cleanup.
- `src/hooks/useHaptics.ts` — wrapper de `navigator.vibrate` con guards.
- `src/pages/mindfulness/BreathingHome.tsx` — landing del recurso con `WeekStrip`, botón express 60s, botón "Comenzar".
- `src/pages/mindfulness/BreathingConfig.tsx` — selección patrón/duración/visual/audio.
- `src/components/mindfulness/breathing/OrbView.tsx` — Sub-modo A.
- `src/components/mindfulness/breathing/BodyScanView.tsx` — Sub-modo B (reusa `BodyMapSvg`).
- `src/lib/breathingPatterns.ts` — definición de los 4 patrones (fases, tiempos, color, copy).
- Assets CDN: `lluvia.mp3`, `ambient.mp3` (vía `lovable-assets`).

### Archivos editados
- `src/pages/Mindfulness.tsx` — reemplazado por flujo nuevo basado en `BreathingHome` + `ExerciseShell`. Quitamos "Racha 5 días / +150 puntos Zen" para alinear con la regla de calma.
- `src/lib/calendarActivity.ts` — sumar entradas de `exercise_sessions` con detail `SUDS pre→post`.
- `src/pages/SettingsHistory.tsx` — filtro nuevo "Mindfulness" + render de sesiones.
- `src/pages/CalendarDay.tsx` — render del label nuevo.
- `src/integrations/supabase/types.ts` — regenerado tras migración.

### Migración Supabase
```sql
ALTER TABLE public.exercise_sessions
  ADD COLUMN IF NOT EXISTS pre_score smallint,
  ADD COLUMN IF NOT EXISTS post_score smallint,
  ADD COLUMN IF NOT EXISTS sub_mode text,
  ADD COLUMN IF NOT EXISTS music_track text,
  ADD COLUMN IF NOT EXISTS voice_enabled boolean DEFAULT false;
```
(No se crean tablas nuevas, así que no aplican nuevos GRANT/RLS.)

### Estado y cleanup
- Todos los `setInterval`/`setTimeout` y `SpeechSynthesis.cancel()` en cleanup de `useEffect`.
- `<audio>` con ref + pause+src=null en unmount para evitar leaks.
- Patrón visible en sesión deshabilita gestures de navegación (event listeners de `popstate`).

## Una vez aprobada la Fase 1
Entregamos Respiración funcionando end-to-end con calendario, historial y resumen clínico. Luego decidís si avanzamos a Observar (Fase 2) o ajustamos algo de la Fase 1 primero.
