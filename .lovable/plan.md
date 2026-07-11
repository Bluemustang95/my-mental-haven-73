## Objetivo

1. Que aparezca **un solo Resmita** por pantalla en Mindfulness, Pensamientos, Grounding, Rumination y demás pantallas que ya tienen un Resmita "de escena".
2. Reescribir el **guion de audio de cada ejercicio de mindfulness** para que sea una narración acompañante (no un "inhalá / exhalá") con pausas reales, útil de escuchar mientras se sigue la pantalla.
3. Arreglar el bug de **voz duplicada** al entrar a algunos ejercicios.
4. Dejar todo **desplegado** (edge functions + config de AI features).

---

## 1) Un solo Resmita por pantalla

Hoy conviven dos Resmitas en algunas pantallas: el Resmita "de escena" incrustado en la página (ej. Mindfulness, Grounding, Rumination, Emotional Regulation, ResourceIntro, Pensamientos con AiCompanion) **más** el FAB global.

**Cambio:** ampliar `HIDDEN_PREFIXES` en `src/lib/resmitaContextMap.ts` para ocultar el FAB en las rutas donde ya hay Resmita en la pantalla:

- `/mindfulness` (hub y todos los `/mindfulness/*`)
- `/grounding`
- `/rumination`
- `/emotional-regulation`
- `/recovery`
- `/resource-intro`
- `/diario/pensamientos` (usa `AiCompanionDrawer`)

En esas rutas queda visible el Resmita/companion de escena. En el resto (Inicio, Mi Proceso, Diario, Recursos, etc.) sigue apareciendo el FAB nuevo (chiquito, `#facb60`, izquierda).

No se toca ninguna página: solo la lista de prefijos ocultos.

---

## 2) Nuevos guiones de mindfulness (por ejercicio)

Hoy los textos que se pasan a `audio.speak(...)` son frases sueltas dentro de cada vista (`OrbView`, `BodyScanView`, `CloudsView`, etc.), estilo "inhalá 4, mantené 7". Reemplazo por scripts curados por ejercicio, con narración continua, pausas y foco sensorial (no instructivo).

### Ejercicios cubiertos

- **Respiración**
  - `478` — respiración 4-7-8
  - `sigh` — suspiro fisiológico
  - `box` — respiración caja
  - `coherence` — coherencia cardíaca 5-5
  - `bodyScan` — escaneo corporal guiado
- **Observar**
  - `clouds` — hojas en el arroyo / nubes
  - `senses` — 5-4-3-2-1
  - `leafPile` — pila de hojas
- **Describir**
  - `anatomiaEmocion` — anatomía de la emoción
  - `escanerNeutral` — escáner neutral
  - `hechosJuicios` — hechos vs juicios

### Formato del script

Nuevo módulo `src/lib/mindfulness/scripts.ts`:

```ts
export type NarrationSegment = { text: string; pauseMs: number };
export type MindfulScript = {
  id: string;
  intro: NarrationSegment[];      // se reproduce una vez al arrancar
  loop?: NarrationSegment[];      // opcional: se cicla mientras dura la práctica
  outro?: NarrationSegment[];     // al cerrar
};
export const SCRIPTS: Record<string, MindfulScript> = { /* uno por ejercicio */ };
```

Reglas de escritura de los guiones:
- Rioplatense, tuteo argentino, voz suave.
- **No es una guía "hacé X"**: es un acompañamiento que se escucha mientras la pantalla hace su trabajo (orb que crece, hoja que flota, escáner que baja). Frases sensoriales, ancladas al cuerpo o al entorno.
- Cada segmento corto (≤ 20 palabras) para que ElevenLabs cierre la entonación limpio.
- Pausas explícitas con `pauseMs` (silencio real entre segmentos) y `<break time="Xms"/>` embebido para pausas cortas dentro de una misma frase (ElevenLabs lo respeta con `eleven_multilingual_v2`).
- Los guiones se sincronizan con las fases visuales: en `OrbView` los tiempos coinciden con la animación de inhalar/exhalar; en `BodyScanView` con las zonas.

### Nuevo helper `useMindfulScript`

`src/hooks/useMindfulScript.ts` reproduce segmento tras segmento con `await speak(seg.text)` + `await wait(seg.pauseMs)`, cancelable con `stop()`. Reemplaza los `audio.speak(...)` sueltos dentro de las vistas.

Cada vista de ejercicio pasa a:
```ts
const { start, stop } = useMindfulScript("478");
useEffect(() => { start(); return stop; }, []);
```

Las líneas hardcodeadas actuales en las vistas se borran; la sincronización con la animación se hace por segmentos, no por frase única por ciclo.

---

## 3) Arreglar audio duplicado

Causas actuales en `src/lib/elevenLabsTTS.ts` + `useMindfulAudio.ts`:

- `speak()` hace `stopSpeak()` y **después** `await synthesize(...)`. Si dos llamadas casi simultáneas (StrictMode, cambio de fase, re-render) entran en paralelo, ambos `fetch` resuelven y ambos `.play()` corren → dos voces encimadas.
- El `.catch()` del dynamic import en `useMindfulAudio.speak` cae al `SpeechSynthesisUtterance` del browser. Si la promesa del import se rechaza tarde (raro, pero pasa en Safari), termina hablando el browser encima de ElevenLabs.
- `stopSpeech()` no aborta el `fetch` en vuelo: solo pausa el `<audio>` actual. Un segundo `speak()` mata al primero pero **no cancela** su fetch, y cuando ese fetch termina se ejecuta `play()` fuera de orden.

Cambios:

1. **Token monotónico** en `elevenLabsTTS.ts`. Cada `speak()` incrementa `playToken`; después de `await synthesize`, si `playToken` cambió, se descarta el resultado y no se reproduce.
2. **AbortController** en `synthesize()`; `stopSpeak()` aborta el fetch en curso además de cortar el `<audio>`.
3. Quitar el fallback `SpeechSynthesisUtterance` del `.catch` en `useMindfulAudio.speak` (redundante con el fallback interno de `elevenLabsTTS.speak`). Deja un único camino de voz.
4. `useMindfulScript` serializa segmentos con `await`, así se elimina por diseño la posibilidad de solapamiento entre segmentos del mismo ejercicio.
5. Cleanup fuerte en cada vista: al desmontar o cambiar de ejercicio → `stop()` (aborta fetch + corta audio + limpia cola de segmentos pendientes).

---

## 4) Config del prompt en la DB

`ai_feature_configs.mindfulness_tts` sigue siendo "no-LLM" (ElevenLabs directo). No hay system prompt, pero sí actualizo la **descripción** para que documente:
- Que los textos vivos ahora se cargan desde `src/lib/mindfulness/scripts.ts`.
- Voz global y volumen configurables desde Ajustes.
- Formato aceptado por la edge function (`text` puede incluir `<break time="Xms"/>`).

Si más adelante querés editar los guiones desde el admin, hace falta migrarlos a una tabla (`mindfulness_scripts`); no lo incluyo en este plan salvo que lo pidas.

---

## 5) Publicación

- Edge function `mindfulness-tts`: sin cambios de lógica, se redeploya solo si toco headers/CORS. Si no la toco, no la redeployo.
- Nada de DB migrations obligatorias (los guiones son código). Solo un `UPDATE` a `ai_feature_configs.mindfulness_tts.description`.

---

## Archivos a crear / editar

**Crear**
- `src/lib/mindfulness/scripts.ts` — guiones por ejercicio.
- `src/hooks/useMindfulScript.ts` — reproductor secuencial cancelable.

**Editar**
- `src/lib/resmitaContextMap.ts` — extender `HIDDEN_PREFIXES`.
- `src/lib/elevenLabsTTS.ts` — token monotónico + AbortController.
- `src/hooks/useMindfulAudio.ts` — quitar fallback duplicado del browser.
- `src/components/mindfulness/breathing/OrbView.tsx`
- `src/components/mindfulness/breathing/BodyScanView.tsx`
- `src/components/mindfulness/observar/CloudsView.tsx`
- `src/components/mindfulness/observar/SensesView.tsx`
- `src/components/mindfulness/observar/LeafPile.tsx`
- `src/components/mindfulness/describir/AnatomiaEmocionView.tsx`
- `src/components/mindfulness/describir/EscanerNeutralView.tsx`
- `src/components/mindfulness/describir/HechosJuiciosView.tsx`

**DB**
- `UPDATE ai_feature_configs SET description = ... WHERE feature_key = 'mindfulness_tts'`.

## Fuera de alcance (para confirmar)

- Editor de guiones desde el admin (tabla `mindfulness_scripts`) — sumar sólo si lo pedís.
- Cambio de voz por ejercicio — hoy la voz es global; puedo permitir override por ejercicio si querés.
