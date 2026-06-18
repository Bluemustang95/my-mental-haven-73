import { useEffect, useState } from "react";

export type GlobalVoice = { label: string; voiceId: string };

export const VOICE_PRESETS: GlobalVoice[] = [
  { label: "Nadia · Argentina (recomendada)", voiceId: "9rvdnhrYoXoUt4igKpBw" },
  { label: "Elena · España", voiceId: "XB0fDUnXU5powFXDhCwa" },
  { label: "Jorge · España", voiceId: "JBFqnCBsd6RMkjVDRZzb" },
  { label: "Camila · México", voiceId: "EXAVITQu4vr4xnSDxMaL" },
  { label: "Mateo · Neutral", voiceId: "TX3LPaxmHKxFdv7VOQHJ" },
  { label: "Sofía · Cálida", voiceId: "XrExE9yKIg1WjnnlVkGX" },
];

const KEY = "resma:admin:global_voice";
const DEFAULT: GlobalVoice = VOICE_PRESETS[0];

export function getGlobalVoice(): GlobalVoice {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.voiceId === "string") return parsed;
    return DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function setGlobalVoice(v: GlobalVoice) {
  localStorage.setItem(KEY, JSON.stringify(v));
  window.dispatchEvent(new CustomEvent("resma:global_voice_changed", { detail: v }));
}

export function useGlobalVoice(): GlobalVoice {
  const [voice, setVoice] = useState<GlobalVoice>(() => getGlobalVoice());
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY) setVoice(getGlobalVoice());
    };
    const onCustom = () => setVoice(getGlobalVoice());
    window.addEventListener("storage", onStorage);
    window.addEventListener("resma:global_voice_changed", onCustom as EventListener);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("resma:global_voice_changed", onCustom as EventListener);
    };
  }, []);
  return voice;
}
