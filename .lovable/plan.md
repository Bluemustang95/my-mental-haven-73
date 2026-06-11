
## Objetivo

1. Centralizar la voz de ElevenLabs en una **Configuración Global** del Admin (sin elegir voz por ejercicio).
2. Hacer **editables desde el Admin**: scripts del 5-4-3-2-1 y mensajes pre/post de "Las hojas pasar".
3. Renovar el ejercicio "Las hojas pasar" con **3 variantes visuales aleatorias** (nube / hoja / vagón) y pantallas de transición pre/post.
4. Auto-reproducir el script del 5-4-3-2-1 al pasar a `phase === 'script'`.

---

## Tarea 1 — Admin: nueva pestaña "Configuración" (Voz Global)

**Archivos:**
- `src/components/admin/AdminLayout.tsx` → agregar item nav `Configuración` (`/admin/configuracion`, icono `Settings`).
- `src/App.tsx` → ruta `/admin/configuracion` dentro de `AdminRoute`.
- **Nuevo**: `src/pages/admin/SystemSettings.tsx` con sección **"Voz Global del Sistema (ElevenLabs)"**:
  - `<select>` con presets: Elena (AR) / Jorge (ES) / Camila (MX) / etc., cada uno con `voiceId` real de ElevenLabs.
  - Campo opcional para `voiceId` custom.
  - Persistencia en `localStorage` clave `resma:admin:global_voice` (formato `{ label, voiceId }`).
- **Nuevo**: `src/lib/globalVoice.ts` — helpers `getGlobalVoice()` / `setGlobalVoice()` / `useGlobalVoice()` (hook con suscripción a `storage` events para sincronizar entre pestañas).

## Tarea 2 — Admin: Recursos → Mindfulness

**`src/pages/admin/ResourcesManager.tsx`**: agregar dos sub-pestañas más → `respiracion | body-scan | 54321 | mira-el-presente`.

**`src/pages/admin/mindfulness/BodyScanManager.tsx`**: eliminar la sección **"Voces por país"** (ya no aplica; voz heredada del global). Quitar campos relacionados de `BodyScan` y de `localStorage` (mantener compat: ignorar `voices` si vienen).

**Nuevo `src/pages/admin/mindfulness/Grounding54321Manager.tsx`**: editor con 5 textareas (Ver / Tocar / Escuchar / Oler / Saborear) para los scripts de reflexión que se muestran/recitan tras cada sentido. Persistir en `localStorage` clave `resma:admin:54321:scripts` (`{ see, touch, hear, smell, taste }`) con valores default sensatos.

**Nuevo `src/pages/admin/mindfulness/MiraElPresenteManager.tsx`** con dos tarjetas:
- **A. 5-4-3-2-1** — placeholder con link/botón que cambia el sub-tab a `54321` (o duplica un mini-resumen).
- **B. Las hojas pasar** — 2 textareas:
  - "Mensaje antes de iniciar"
  - "Mensaje al finalizar"
  - Botón "Guardar cambios" (también autosave). `localStorage` clave `resma:admin:hojas:messages` (`{ pre, post }`) con defaults.

## Tarea 3 — Usuario: 5-4-3-2-1 (`SensesView.tsx`)

- Quitar cualquier elección de voz local; usar `useGlobalVoice()`.
- Mantener el toggle de voz (`voiceEnabled`).
- Cargar scripts editados desde `localStorage` (`resma:admin:54321:scripts`); fallback a los actuales (`STEPS[i].voice`).
- Introducir **estado `phase`**: `input | script`. Al completar un sentido (botón "Siguiente"), pasar a `phase: 'script'` durante ~6–8 s mostrando el texto editado; luego avanzar al siguiente sentido (o `onComplete()` si es el último).
- `useEffect` que dispare automáticamente `audio.speak(scriptText, { voiceId: globalVoiceId })` cuando `phase === 'script'` y `voiceEnabled` esté activo.

## Tarea 4 — Usuario: "Las hojas pasar" (rebrand de `CloudsView`)

**`src/components/mindfulness/observar/CloudsView.tsx`** (o rename a `HojasPasarView.tsx`, manteniendo import en `ObservarHome.tsx`):

- Nuevo estado `phase`: `intro | playing | outro`.
  - **intro**: pantalla de transición a pantalla completa con `messages.pre` + botón "Empezar".
  - **playing**: animación actual + composer.
  - **outro**: al terminar el timer, mostrar `messages.post` + botón "Volver" → `onComplete()`.
- Leer `pre/post` de `localStorage` (`resma:admin:hojas:messages`) con defaults.

**Componente nuevo `ThoughtBubble`** (dentro del mismo archivo o `src/components/mindfulness/observar/ThoughtBubble.tsx`):
- Props: `{ text, paused }`.
- Al montar, elige aleatoriamente `variant: 'cloud' | 'leaf' | 'train'` (almacenado en el objeto `Cloud` al crearse, no en cada render).
- **cloud**: comportamiento actual (deriva horizontal con `framer-motion`).
- **leaf**: SVG simple de hoja (path), cae verticalmente con balanceo lateral (`keyframes` Tailwind custom `sway` + animate `y: 0 → 110vh`).
- **train**: rectángulo con dos círculos (ruedas) que cruza horizontalmente en línea recta a velocidad constante; el texto va dentro del vagón.

**Tailwind config**: agregar keyframes `sway` (rotación + translateX en péndulo) y `train` (translateX lineal) en `tailwind.config.ts` para casos donde framer-motion no aplique.

## Tarea 5 — Limpieza de selectores de voz en usuario

- `BreathingActivity` / `VisualizerBodyScan` / cualquier `useMindfulAudio`: revisar y eliminar selección por país; pasar `voiceId` desde `useGlobalVoice()` al hook de TTS.
- **No tocar** el toggle de volumen (`voiceEnabled`) — se mantiene tal cual.

## Detalles técnicos varios

- `useMindfulAudio.speak()`: si la firma actual no acepta `voiceId`, extenderla con un parámetro opcional `{ voiceId?: string }` que se pase al endpoint de ElevenLabs (edge function existente o nueva). Si actualmente usa SpeechSynthesis del browser, dejarlo y agregar TODO de migración a ElevenLabs (sin romper).
- Toda la persistencia admin sigue en `localStorage` (consistente con `BodyScanManager` actual). No requiere migración SQL.

## Fuera de alcance

- Reemplazar `localStorage` por tabla Supabase para los recursos admin (puede ser una iteración futura).
- Implementar el endpoint real de ElevenLabs si aún no existe — si falta, dejamos el `voiceId` propagado y el TODO marcado.
