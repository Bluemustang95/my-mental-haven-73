## 1) Eliminar el "Continuar" duplicado del hub
En `src/pages/mindfulness/MindfulnessHub.tsx` quitar el bloque `{resuming && (...)}` (la tarjeta naranja "CONTINUAR · Respiración · 4-7-8") y el cálculo de `resuming`. La práctica abierta sigue mostrándose solo abajo, en `OpenMindfulnessList`.

## 2) Sliders y selector de sonido dentro de la práctica
Rediseñar `SessionToolbar.tsx` para que todos los controles vivan en la pantalla activa, sin tener que abrir un sheet para ajustar volumen:

- Fila superior siempre visible con dos sliders compactos:
  - 🎙 Voz (Nadia) — 0–100%
  - 🔊 Ambiente — 0–100%
- Fila inferior con tres acciones:
  - Chip "Sonido: <nombre actual>" → abre `AmbientSoundSheet` solo como **selector** de pista.
  - Botón Voz on/off.
  - Botón Finalizar.

En `AmbientSoundSheet.tsx` quitar los sliders internos (ya no se necesitan, viven en la pantalla) y dejar únicamente la grilla por categorías para elegir pista.

Aplica a `OrbView.tsx` y `BodyScanView.tsx`, que ya usan `SessionToolbar`.

## 3) Arreglar voz y sonido ambiente que no se escuchan
La causa raíz es el bloqueo de autoplay del navegador: el primer `play()` ocurre en un `useEffect` después de navegar, no dentro del click del usuario, así que `AudioContext` y `HTMLAudioElement` quedan suspendidos.

Cambios:

- `src/hooks/useAmbientPlayer.ts`: exponer `prime()` que cree/reanude el `AudioContext` y reproduzca un buffer silencioso de 1 frame.
- `src/lib/elevenLabsTTS.ts`: exponer `primeAudio()` que cree un `HTMLAudioElement` silenciado y haga `.play()` para "armar" el canal de TTS.
- `src/hooks/useMindfulAudio.ts`: re-exportar un único `prime()` que llame a ambos.
- En los botones "Comenzar" de los setups (`IntentionSetupScreen`, `PatternSetupScreen`, `TimeSetupScreen` y equivalentes de Observar / Describir / Body Scan): llamar `prime()` **sincrónicamente** dentro del onClick antes de navegar al `OrbView` / `BodyScanView`.
- En `OrbView` y `BodyScanView`: si el primer `audio.play()` falla con `NotAllowedError`, mostrar overlay "Tocá para activar el sonido" que reintenta `prime()` y reproduce la frase actual.
- Añadir `console.warn` en los `catch` de `speak`, `setSound` y `audio.play` para confirmar la causa si todavía no suena.

## 4) Verificación
En `/herramientas/mindfulness/respiracion`:
- Iniciar 4‑7‑8 → debe escucharse Nadia y la pista ambiente.
- Mover sliders en vivo → cambia volumen sin reiniciar la pista.
- Abrir el sheet y elegir "Olas" / "Lluvia suave" → cambia al instante.
- Pausar/Reanudar/Finalizar → corta y retoma audio correctamente.
- Volver al hub → solo aparece la tarjeta "Práctica abierta" abajo, no la barra naranja de arriba.

## Archivos a modificar
- `src/pages/mindfulness/MindfulnessHub.tsx`
- `src/components/mindfulness/breathing/SessionToolbar.tsx`
- `src/components/mindfulness/AmbientSoundSheet.tsx`
- `src/components/mindfulness/breathing/OrbView.tsx`
- `src/components/mindfulness/breathing/BodyScanView.tsx`
- `src/components/mindfulness/breathing/IntentionSetupScreen.tsx`
- `src/components/mindfulness/breathing/PatternSetupScreen.tsx`
- `src/components/mindfulness/breathing/TimeSetupScreen.tsx`
- `src/hooks/useAmbientPlayer.ts`
- `src/hooks/useMindfulAudio.ts`
- `src/lib/elevenLabsTTS.ts`
