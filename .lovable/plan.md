## Problemas detectados

1. **Pantalla en blanco al entrar al ejercicio.** El reproductor inmersivo se monta como `fixed inset-0` dentro de `<>` y, junto con la clase `zen-mode` que oculta el BottomNav, queda renderizado pero los visualizadores `absolute inset-0` colapsan a 0×0 cuando el contenedor no tiene altura efectiva en algunos navegadores (especialmente PWA standalone). La capa visible queda solo el gradiente suave de la cápsula móvil exterior → se ve cremita/azul sin nada.
2. **La voz no es ElevenLabs.** Hoy `ImmersivePlayer` usa `window.speechSynthesis` (voz del sistema operativo). Ya existe la edge function `mindfulness-tts` con la voz argentina **Nadia (`9rvdnhrYoXoUt4igKpBw`)**, pero el cliente no la invoca.

## Cambios

### A. Reproductor inmersivo visible (`src/pages/mindfulness/BreathingHome.tsx`)

- Quitar el `fixed inset-0 z-[60]` del `ImmersivePlayer` y montarlo como un layout normal `min-h-screen w-full` con el gradiente del patrón. Así hereda el flujo del documento y los visualizadores `absolute inset-0` siempre tienen tamaño.
- Asegurar que cada visualizador esté dentro de un contenedor con altura explícita (`flex-1 relative` en la capa 0), de modo que `<VisualizerSleep/>` etc. tengan caja con la que llenar.
- Mantener safe-area en el header y los controles glass.
- Quitar el wrapper `<>` redundante; el `HelpModal` se renderiza dentro del mismo árbol.

### B. Voz ElevenLabs (Nadia, Argentina)

Reemplazar el bloque `speechSynthesis` del `ImmersivePlayer` por una pequeña utilidad cliente que llama a la edge function existente:

- Nuevo `useElevenLabsCue(text, enabled)` dentro del archivo (sin nuevos archivos):
  - Cache en memoria `Map<string, string>` con `URL.createObjectURL(blob)` para cada frase única → no recobra el mismo cue varias veces.
  - Mantiene un único `<audio>` reusable; al cambiar de frase hace `audio.pause()`, asigna `src`, `audio.play()`.
  - `await supabase.functions.invoke("mindfulness-tts", { body: { text, voiceId: "9rvdnhrYoXoUt4igKpBw", speed: 0.9 } })` y construye blob `audio/mpeg`.
  - Si la function falla (`error` o red), hace fallback silencioso a `speechSynthesis` para no romper la sesión.
- En el `useEffect` por fase: si `voice && !paused` ejecuta el hook con `phase.cue`. Al desmontar pausa el audio.
- Pre-cachear las frases del patrón al entrar al player (kick-off en paralelo) para que la primera fase suene inmediata.

### C. Verificación

- Build + tsgo.
- Playwright headless: navegar a `/herramientas/mindfulness/respiracion`, seleccionar "Bajar ansiedad", "Comenzar práctica", screenshot del player → confirmar gradiente oscuro + animación + tipografía visible.
- Revisar que la network request a `mindfulness-tts` devuelva 200 con `audio/mpeg`.

## Detalles técnicos

```ts
// dentro de ImmersivePlayer
const audioRef = useRef<HTMLAudioElement | null>(null);
const cacheRef = useRef<Map<string, string>>(new Map());

async function speakCue(text: string) {
  try {
    let url = cacheRef.current.get(text);
    if (!url) {
      const { data, error } = await supabase.functions.invoke("mindfulness-tts", {
        body: { text, voiceId: "9rvdnhrYoXoUt4igKpBw", speed: 0.9 },
      });
      if (error || !(data instanceof Blob)) throw error ?? new Error("no audio");
      url = URL.createObjectURL(data);
      cacheRef.current.set(text, url);
    }
    if (!audioRef.current) audioRef.current = new Audio();
    audioRef.current.src = url;
    audioRef.current.play().catch(() => {});
  } catch {
    // fallback voz sistema
    if ("speechSynthesis" in window) {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-AR"; u.rate = 0.9;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    }
  }
}
```

`supabase.functions.invoke` en este SDK devuelve `Blob` cuando el response es `audio/mpeg`; si en runtime llega `ArrayBuffer`, lo envolvemos en `new Blob([data], { type: "audio/mpeg" })` antes de `createObjectURL`.

## Fuera de scope

- No se tocan los demás módulos (Diario, Hábitos, Pensamientos).
- No se cambia el diseño de las tarjetas de intención ni el setup.
- No se agregan nuevas pantallas ni sonido ambiente (se mantiene como toggle existente).
