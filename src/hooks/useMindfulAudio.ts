import { useCallback, useEffect } from "react";
import { useAmbientPlayer } from "@/hooks/useAmbientPlayer";

/**
 * Backwards-compatible alias. Ambient sounds are now identified by string IDs
 * from the ambient library (see `@/lib/ambientLibrary`). The legacy values
 * "silence" | "rain" | "ambient" are mapped at runtime.
 */
export type MusicTrack = string;

const LEGACY_MAP: Record<string, string> = {
  silence: "off",
  rain: "rain_soft",
  ambient: "drone_pad",
};

function resolveAmbientId(id: string): string {
  return LEGACY_MAP[id] ?? id;
}

/**
 * Mindful audio engine.
 * - Voice: ElevenLabs via edge function (es-AR, Nadia voice by default), with
 *   browser speechSynthesis fallback.
 * - Music: full ambient library (rain/wind/water/nature/abstract drones).
 */
export function useMindfulAudio() {
  const ambient = useAmbientPlayer();

  const playMusic = useCallback((track: MusicTrack) => {
    ambient.setSound(resolveAmbientId(track));
  }, [ambient]);

  const stopMusic = useCallback(() => {
    ambient.stop();
  }, [ambient]);

  const setMusicVolume = useCallback((v: number) => {
    ambient.setVolume(v);
  }, [ambient]);

  const getMusicVolume = useCallback(() => ambient.getVolume(), [ambient]);

  const speak = useCallback((text: string) => {
    import("@/lib/elevenLabsTTS").then((m) => m.speak(text)).catch(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-AR";
        u.rate = 0.92;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch { /* noop */ }
    });
  }, []);

  const stopSpeech = useCallback(() => {
    import("@/lib/elevenLabsTTS").then((m) => m.stopSpeak()).catch(() => {});
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, []);

  useEffect(() => {
    return () => {
      stopSpeech();
    };
  }, [stopSpeech]);

  return { playMusic, stopMusic, setMusicVolume, getMusicVolume, speak, stopSpeech };
}
