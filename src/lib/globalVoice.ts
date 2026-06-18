import { useEffect, useState } from "react";

export type GlobalVoice = { label: string; voiceId: string; country: string; gender?: "F" | "M" };

export const VOICE_PRESETS: GlobalVoice[] = [
  // 🇦🇷 Argentina
  { label: "Nadia (recomendada)", voiceId: "9rvdnhrYoXoUt4igKpBw", country: "Argentina", gender: "F" },
  // 🇪🇸 España
  { label: "Elena", voiceId: "XB0fDUnXU5powFXDhCwa", country: "España", gender: "F" },
  { label: "Jorge", voiceId: "JBFqnCBsd6RMkjVDRZzb", country: "España", gender: "M" },
  // 🇲🇽 México
  { label: "Camila", voiceId: "EXAVITQu4vr4xnSDxMaL", country: "México", gender: "F" },
  // Neutral / Internacional
  { label: "Mateo", voiceId: "TX3LPaxmHKxFdv7VOQHJ", country: "Neutral", gender: "M" },
  { label: "Sofía cálida", voiceId: "XrExE9yKIg1WjnnlVkGX", country: "Neutral", gender: "F" },
];

const COUNTRY_ORDER = ["Argentina", "España", "México", "Neutral"];

export function getVoicesByCountry(): { country: string; voices: GlobalVoice[] }[] {
  const groups = new Map<string, GlobalVoice[]>();
  for (const v of VOICE_PRESETS) {
    if (!groups.has(v.country)) groups.set(v.country, []);
    groups.get(v.country)!.push(v);
  }
  return COUNTRY_ORDER.filter((c) => groups.has(c)).map((country) => ({
    country,
    voices: groups.get(country)!,
  }));
}

const KEY = "resma:admin:global_voice";
const DEFAULT: GlobalVoice = VOICE_PRESETS[0];

export function getGlobalVoice(): GlobalVoice {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.voiceId === "string") {
      // Backfill country if missing from older saved value
      const match = VOICE_PRESETS.find((p) => p.voiceId === parsed.voiceId);
      return { country: match?.country ?? "Custom", ...parsed };
    }
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
