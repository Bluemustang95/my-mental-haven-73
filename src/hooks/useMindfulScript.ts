import { useCallback, useEffect, useRef } from "react";
import { getScript, type NarrationSegment } from "@/lib/mindfulness/scripts";

type Options = {
  /** Si false, no reproduce la narración (queda ambient/music). */
  voiceEnabled?: boolean;
  /** Se llama al terminar intro + N ciclos de loop (si no se aborta). */
  onComplete?: () => void;
  /** Cuántas veces ciclar el loop; por defecto infinito hasta stop(). */
  loopTimes?: number;
};

/**
 * Reproduce en serie un guion (intro + loop cíclico + outro),
 * segmento por segmento, con `pauseMs` de silencio entre segmentos.
 * Cancelable con `stop()`.
 */
export function useMindfulScript(scriptId: string, options: Options = {}) {
  const { voiceEnabled = true, onComplete, loopTimes } = options;
  const cancelRef = useRef<{ cancelled: boolean }>({ cancelled: true });
  const runningRef = useRef(false);

  const speakSegment = useCallback(async (seg: NarrationSegment, token: { cancelled: boolean }) => {
    if (token.cancelled) return;
    const mod = await import("@/lib/elevenLabsTTS");
    if (token.cancelled) return;
    // Estimación de duración: ~14 caracteres por segundo para es-AR, +500ms de cola.
    const approxMs = Math.max(2500, seg.text.replace(/<[^>]+>/g, "").length * 70 + 500);
    await mod.speak(seg.text);
    if (token.cancelled) return;
    await sleep(approxMs, token);
    if (token.cancelled) return;
    if (seg.pauseMs > 0) await sleep(seg.pauseMs, token);
  }, []);

  const start = useCallback(async () => {
    if (runningRef.current) return;
    if (!voiceEnabled) return;
    const script = getScript(scriptId);
    if (!script) return;

    // Renueva el token para esta corrida
    cancelRef.current.cancelled = true;
    const token = { cancelled: false };
    cancelRef.current = token;
    runningRef.current = true;

    try {
      for (const seg of script.intro) {
        if (token.cancelled) return;
        await speakSegment(seg, token);
      }
      if (script.loop && script.loop.length > 0) {
        const target = typeof loopTimes === "number" ? loopTimes : Infinity;
        let n = 0;
        while (!token.cancelled && n < target) {
          for (const seg of script.loop) {
            if (token.cancelled) return;
            await speakSegment(seg, token);
          }
          n++;
        }
      }
      if (!token.cancelled && script.outro) {
        for (const seg of script.outro) {
          if (token.cancelled) return;
          await speakSegment(seg, token);
        }
      }
      if (!token.cancelled) onComplete?.();
    } finally {
      if (cancelRef.current === token) runningRef.current = false;
    }
  }, [scriptId, voiceEnabled, loopTimes, onComplete, speakSegment]);

  const stop = useCallback(() => {
    cancelRef.current.cancelled = true;
    runningRef.current = false;
    import("@/lib/elevenLabsTTS").then((m) => m.stopSpeak()).catch(() => {});
  }, []);

  useEffect(() => {
    return () => { stop(); };
  }, [stop]);

  return { start, stop };
}

function sleep(ms: number, token: { cancelled: boolean }) {
  return new Promise<void>((resolve) => {
    if (token.cancelled) return resolve();
    const t = setTimeout(() => resolve(), ms);
    const interval = setInterval(() => {
      if (token.cancelled) {
        clearTimeout(t);
        clearInterval(interval);
        resolve();
      }
    }, 200);
  });
}
