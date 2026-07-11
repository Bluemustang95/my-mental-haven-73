import { useCallback, useEffect } from "react";
import { useAmbientPlayer } from "@/hooks/useAmbientPlayer";

export type MusicTrack = string;

const LEGACY_MAP: Record<string, string> = {
  silence: "off",
  rain: "rain_soft",
  ambient: "drone_pad",
};

function resolveAmbientId(id: string): string {
  return LEGACY_MAP[id] ?? id;
}

const VOICE_VOL_KEY = "resma:mindful:voice_volume";

function readVoiceVolume(): number {
  try {
    const v = Number(localStorage.getItem(VOICE_VOL_KEY));
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
  } catch { /* noop */ }
  return 1;
}

export function useMindfulAudio() {
  const ambient = useAmbientPlayer();

  const playMusic = useCallback((track: MusicTrack) => {
    ambient.setSound(resolveAmbientId(track));
  }, [ambient]);

  const stopMusic = useCallback(() => { ambient.stop(); }, [ambient]);
  const pauseMusic = useCallback(() => { ambient.pause(); }, [ambient]);
  const resumeMusic = useCallback(() => { ambient.resume(); }, [ambient]);

  const setMusicVolume = useCallback((v: number) => { ambient.setVolume(v); }, [ambient]);
  const getMusicVolume = useCallback(() => ambient.getVolume(), [ambient]);

  const setVoiceVolume = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    try { localStorage.setItem(VOICE_VOL_KEY, String(clamped)); } catch { /* noop */ }
    import("@/lib/elevenLabsTTS").then((m) => m.setSpeechVolume(clamped)).catch(() => {});
  }, []);
  const getVoiceVolume = useCallback(() => readVoiceVolume(), []);

  /**
   * Speak a single utterance. Any previous speech (in-flight fetch or playback)
   * is superseded — no browser fallback here to avoid overlapping voices.
   */
  const speak = useCallback((text: string) => {
    import("@/lib/elevenLabsTTS").then((m) => {
      m.setSpeechVolume(readVoiceVolume());
      return m.speak(text);
    }).catch(() => {});
  }, []);

  const stopSpeech = useCallback(() => {
    import("@/lib/elevenLabsTTS").then((m) => m.stopSpeak()).catch(() => {});
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, []);

  const prime = useCallback(() => {
    ambient.prime();
    import("@/lib/elevenLabsTTS").then((m) => m.primeAudio()).catch(() => {});
  }, [ambient]);

  useEffect(() => {
    return () => { stopSpeech(); };
  }, [stopSpeech]);

  return {
    playMusic, stopMusic, pauseMusic, resumeMusic,
    setMusicVolume, getMusicVolume,
    setVoiceVolume, getVoiceVolume,
    speak, stopSpeech, prime,
  };
}
