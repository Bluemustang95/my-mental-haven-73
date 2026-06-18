## Objetivo

1. Cargar un **script profesional, extenso y específico** para cada hoja del árbol de Mindfulness (respiración, body scan general + zonas, observar 5-4-3-2-1, describir).
2. Para Body Scan, además del script general por duración, dejar pre-cargados **marcadores de timeline** (segundo → zona) que se usan para iluminar la silueta.
3. Arreglar **pausa y finalizar** durante una respiración (hoy la sesión no responde).
4. En la barra de sesión, permitir **elegir sonido ambiente + volumen de ambiente + volumen de la voz** (Nadia), de forma independiente.

---

## 1) Seed de scripts (datos en `mindfulness_scripts`)

Usaré `supabase--insert` (no es cambio de schema) con `upsert` por la unique key `(category, sub_key, duration_min)`.

Total de hojas a poblar (según `MINDFULNESS_TREE`):

- **Respiración** — 4 intenciones × 4 duraciones = **16 scripts** (dormir / ansiedad / concentrarme / equilibrar × 2,5,10,15 min).
- **Body Scan generales** — **3 scripts** (5/15/30 min) + `markers` jsonb con 9 zonas distribuidas en el tiempo.
- **Body Scan por zona** — **9 bloques** (cabeza, mandíbula, cuello/hombros, pecho, abdomen, brazos, manos, piernas, pies). Texto que la voz lee al iluminarse esa zona.
- **Observar 5-4-3-2-1** — 5 sentidos × 3 duraciones = **15 scripts**.
- **Describir** — Hechos vs Juicios × 3 niveles + Escáner Neutral × 3 duraciones + Anatomía × 3 duraciones = **9 scripts**.

**Total: 52 scripts + 9 bloques de zona = 61 filas**, todas con texto largo, voz Nadia (voseo argentino, tono terapéutico, pausas con `...`), aptos para ElevenLabs `eleven_multilingual_v2`.

### Marcadores de Body Scan (en `markers jsonb`)

Para cada script general de Body Scan precalculamos `[{second, zone}, ...]` repartiendo las 9 zonas linealmente sobre la duración:

```text
5 min  → cada ~33 s una zona
15 min → cada ~100 s
30 min → cada ~200 s
```

`BodyScanView` ya tendrá que leer estos marcadores desde Supabase para iluminar la zona correspondiente en lugar de calcular sobre 7 zonas hardcodeadas.

---

## 2) Fix de Pausa / Finalizar en respiración

Problema: en `OrbView` el botón central llama a `setRunning(r => !r)` pero:

- El `useEffect` de voz dispara `audio.speak()` que abre un `await canplaythrough` largo; el siguiente `speak` no cancela al pausar.
- `SessionToolbar` (z-20, posición absoluta abajo) tapa el botón pequeño de pause y el "Finalizar" no detiene la voz en curso.

Cambios:

- `OrbView` / `BodyScanView`: al cambiar `running` a `false`, llamar `audio.stopSpeech()` y `audio.pauseMusic()`; al reanudar, `audio.resumeMusic()`.
- Al `onAbort` (Finalizar): `stopSpeech()` + `stopMusic()` antes de salir.
- Asegurar que el botón central de pausa quede por encima de `SessionToolbar` (z-index / padding inferior del contenedor).
- En `useMindfulAudio` agregar `pauseMusic` / `resumeMusic` (delegan a `useAmbientPlayer`).

---

## 3) Volumen de voz independiente + sheet de ambiente

- `elevenLabsTTS.ts`: exponer `setSpeechVolume(v: number)` y aplicar a `currentAudio.volume`. Persistir en `localStorage` (`resma_voice_volume`).
- `useMindfulAudio`: agregar `setVoiceVolume` / `getVoiceVolume`.
- `AmbientSoundSheet`: añadir un **segundo slider "Voz (Nadia)"** arriba del slider de ambiente, con su propio %.
- `SessionToolbar`: pasar `voiceVolume` + `onVoiceVolumeChange` al sheet, además del ya existente ambiente.
- Mantener la decodificación/elección de sonido tal cual (la grilla por categoría ya existe).

---

## 4) Archivos afectados

**Datos (sin migración de schema, solo INSERT/UPSERT):**

- `mindfulness_scripts` — 61 upserts vía `supabase--insert`.

**Código:**

- `src/lib/elevenLabsTTS.ts` — volumen + getter.
- `src/hooks/useMindfulAudio.ts` — `pauseMusic`, `resumeMusic`, `setVoiceVolume`, `getVoiceVolume`.
- `src/hooks/useAmbientPlayer.ts` — `pause`/`resume` si no existen.
- `src/components/mindfulness/AmbientSoundSheet.tsx` — slider de voz.
- `src/components/mindfulness/breathing/SessionToolbar.tsx` — propagar volumen de voz.
- `src/components/mindfulness/breathing/OrbView.tsx` — pausar/reanudar voz+música; z-index.
- `src/components/mindfulness/breathing/BodyScanView.tsx` — ídem + leer `markers` desde Supabase para iluminar zonas.

---

## Fuera de alcance

- Cambios visuales mayores en los ejercicios.
- TTS de hombre / voces extra (queda como follow-up cuando agregues la voz masculina).
