# Mindfulness: centrado, scripts, voz AR real y biblioteca de sonidos

## 1) Centrar la pantalla "Orbe" (IntentionSetupScreen)

Archivo: `src/components/mindfulness/breathing/IntentionSetupScreen.tsx`

- Envolver el contenido en un contenedor `min-h-[100dvh] flex flex-col items-center justify-center px-6 pb-32`.
- Title `text-center` (hoy queda corrida a la izquierda en mobile angosto).
- Grid 2×2 con `max-w-md mx-auto` y `gap-4`.
- Tarjetas: pasar la descripción a `line-clamp-2` para que no se corte ("Exhalación larga para…" se ve cortada) y subir el padding inferior del texto.
- Botón "Modo avanzado · ver patrones": separarlo de la bottom nav usando `mb-24` (hoy queda por debajo del downbar).
- Mismo tratamiento de centrado para `BreathingHome` (header tabs Orbe/Body Scan) y `BodyScan` setup screen.

## 2) Scripts por duración para TODOS los ejercicios

Reorganizar el admin de mindfulness con jerarquía **Categoría → Sub-categoría → Sub-sub categoría (duración / zona)** y guardar un script por cada combinación.

### Estructura final de admin (`/admin/mindfulness`)

```text
Mindfulness
├─ Respiración (Orbe)
│  ├─ Dormir mejor (4-7-8)         → scripts: 2/5/10/15 min
│  ├─ Bajar ansiedad (suspiro)     → scripts: 2/5/10/15 min
│  ├─ Concentrarme (caja 4-4-4-4)  → scripts: 2/5/10/15 min
│  └─ Equilibrar (coherencia 5-5)  → scripts: 2/5/10/15 min
├─ Body Scan
│  ├─ 5 min  → 1 script + marcadores por zona (cabeza, mandíbula, …)
│  ├─ 15 min → 1 script + marcadores
│  └─ 30 min → 1 script + marcadores
│  (cada zona del recorrido tiene su propio bloque de script:
│   Cabeza, Mandíbula, Cuello/hombros, Pecho, Abdomen, Brazos, Manos, Piernas, Pies)
├─ Observar — Mira el presente (5-4-3-2-1)
│  ├─ 3 min  → 5 scripts (uno por sentido: vista/oído/tacto/olfato/gusto)
│  ├─ 5 min  → 5 scripts
│  └─ 10 min → 5 scripts
└─ Describir — Poner en palabras
   ├─ Hechos vs Juicios     → scripts intro/cierre por nivel (suave/mixto/desafiante)
   ├─ Escáner Neutral       → scripts 3/5/10 min
   └─ Anatomía de la Emoción → scripts 3/5/10 min
```

### Cambios concretos

- Migrar las 4 managers existentes (`BodyScanManager`, `BreathingSoundsManager`, `Grounding54321Manager`, `MiraElPresenteManager`) bajo un único shell `/admin/mindfulness` con sidebar de 3 niveles.
- Cada hoja final = editor con `Textarea` grande "Script" + (cuando aplica) marcadores temporales y selector de zona.
- Persistencia: tabla nueva `mindfulness_scripts` en Lovable Cloud (con RLS admin-only) reemplazando los localStorage actuales (`resma:admin:*`). Estructura:

```text
mindfulness_scripts
  id uuid pk
  category text     -- 'respiracion' | 'body_scan' | 'observar' | 'describir'
  sub_key text      -- 'dormir' | 'ansiedad' | 'concentracion' | 'equilibrio'
                    -- | 'cabeza' | 'mandibula' | … (body scan)
                    -- | 'vista' | 'oido' | … (observar)
                    -- | 'hechos_juicios' | 'escaner' | 'anatomia'
  duration_min int  -- 2 | 5 | 10 | 15 | 30 | null
  script text
  markers jsonb     -- [{ second, zone }] (sólo body scan)
  updated_at timestamptz
  unique(category, sub_key, duration_min)
```
- Endpoint público de lectura para que las pantallas de ejercicio carguen el script correspondiente al iniciar (sin login).
- Seed inicial con borradores escritos por mí para todas las combinaciones (≈ 35 scripts) así no quedan vacíos.

### Uso en runtime

- `OrbView` carga `mindfulness_scripts` por `(respiracion, intencion, duracion)` y lo pasa al motor de voz en lugar de las frases genéricas actuales.
- `BodyScanView` carga `(body_scan, null, duracion)` + para cada marcador busca `(body_scan, zona, null)` y lo reproduce al llegar a esa zona.
- `SensesView` (5-4-3-2-1) carga 5 sub-scripts por duración.
- `EscanerNeutralView` / `AnatomiaEmocionView` / `HechosJuiciosView`: cargan su script y lo muestran/leen.

## 3) Voz por defecto Argentina + ElevenLabs real

Hoy la voz suena robótica porque `useMindfulAudio` usa `speechSynthesis` del navegador. Pasamos a ElevenLabs.

- Conectar el connector **ElevenLabs** (`standard_connectors--connect`).
- Edge function nueva `mindfulness-tts`:
  - Input: `{ text, voiceId? }`
  - Llama a `POST https://api.elevenlabs.io/v1/text-to-speech/{voiceId}?output_format=mp3_44100_128` con `model_id: eleven_multilingual_v2`.
  - Devuelve audio binario (MP3) con cache HTTP fuerte por hash de `(text, voiceId)`.
- Hook nuevo `useElevenLabsTTS` que recibe frases y devuelve `play(text)` reproduciendo el blob; reemplaza al `speechSynthesis` actual en `OrbView`, `BodyScanView`, `SensesView`, `HechosJuiciosView`, `EscanerNeutralView`, `AnatomiaEmocionView`.
- `globalVoice.ts`: cambiar el `DEFAULT` a `{ label: "Argentina (Nadia)", voiceId: "9rvdnhrYoXoUt4igKpBw" }` y agregarla a `VOICE_PRESETS` como primera opción.
- En `/admin/configuracion`: dejar claro que la voz aplica a **todos** los ejercicios (respiración, body scan, observar, describir) y agregar botón "Probar voz" que llama al edge function con una frase de muestra.
- Cache cliente: `IndexedDB` para guardar MP3 ya generados por (text, voiceId) y evitar re-pagar generación en cada sesión.

## 4) Biblioteca de sonidos ampliada

Hoy `sleepAudio.ts` sólo sintetiza "waves" y "rain". Vamos a ampliarla.

### Catálogo nuevo (todos sintetizados Web Audio, sin assets pesados)

```text
Lluvia
  ├─ Lluvia suave
  ├─ Lluvia fuerte
  ├─ Lluvia con truenos lejanos
  └─ Lluvia sobre techo
Viento
  ├─ Brisa
  ├─ Viento en bosque
  └─ Viento de montaña
Agua
  ├─ Olas suaves
  ├─ Olas fuertes
  ├─ Río
  └─ Cascada lejana
Naturaleza
  ├─ Bosque al amanecer (pájaros + brisa)
  ├─ Noche de grillos
  └─ Fogata (crepitar)
Abstractos
  ├─ Ruido blanco
  ├─ Ruido rosa
  ├─ Ruido marrón
  └─ Drone meditativo (pad)
```

### Cambios técnicos

- Reescribir `src/lib/sleepAudio.ts` como `src/lib/ambientLibrary.ts` con un registro `{ id, label, category, build(ctx, volume) }` por sonido (cada `build` combina ruido + filtros + LFOs + osciladores).
- `SessionToolbar` y `BodyScan`: reemplazar el ciclo de 3 (`silence/rain/ambient`) por un sheet con la biblioteca completa agrupada por categoría, búsqueda y favoritos (reusar `useMindfulnessFavorites`).
- `/admin/configuracion`: nueva sección "Sonidos ambientales" que permite habilitar/deshabilitar sonidos del catálogo y elegir el sonido por defecto por categoría de ejercicio (respiración / body scan / observar). Persistencia en `system_settings` (tabla existente).

## Detalles técnicos (resumen)

- **Archivos nuevos:** `supabase/functions/mindfulness-tts/index.ts`, `src/hooks/useElevenLabsTTS.ts`, `src/lib/ambientLibrary.ts`, `src/pages/admin/mindfulness/MindfulnessAdminShell.tsx`, `src/pages/admin/mindfulness/ScriptEditor.tsx`, `src/components/mindfulness/AmbientSoundSheet.tsx`.
- **Migraciones:** crear `mindfulness_scripts` con grants + RLS (lectura pública, escritura sólo admin via `has_role`).
- **Connector:** ElevenLabs (App connector).
- **Archivos modificados:** `IntentionSetupScreen.tsx`, `BreathingHome.tsx`, `OrbView.tsx`, `BodyScanView.tsx`, `SensesView.tsx`, `Hechos/Escaner/AnatomiaView.tsx`, `SessionToolbar.tsx`, `SystemSettings.tsx`, `globalVoice.ts`, `App.tsx` (rutas admin).
- **Fuera de alcance:** subir samples reales de audio (todo se sintetiza), traducir scripts a otros idiomas, descargas offline de MP3 generados.
