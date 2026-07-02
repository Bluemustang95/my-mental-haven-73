// Resolves ambient sound IDs to either a signed MP3 URL (admin-uploaded override)
// or falls back to the synthesized builder. Caches overrides for 5 min.

import { supabase } from "@/integrations/supabase/client";

const CACHE_TTL_MS = 5 * 60 * 1000;

type Override = { sound_id: string; storage_path: string };
type CacheEntry = { data: Map<string, Override>; fetchedAt: number };

let cache: CacheEntry | null = null;
let inflight: Promise<Map<string, Override>> | null = null;

async function loadOverrides(): Promise<Map<string, Override>> {
  if (cache && Date.now() - cache.fetchedAt < CACHE_TTL_MS) return cache.data;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data } = await supabase
      .from("ambient_audio_overrides")
      .select("sound_id, storage_path")
      .eq("active", true);
    const map = new Map<string, Override>();
    (data ?? []).forEach((row) => map.set(row.sound_id, row as Override));
    cache = { data: map, fetchedAt: Date.now() };
    inflight = null;
    return map;
  })();
  return inflight;
}

export function invalidateAmbientOverrides() {
  cache = null;
  try {
    window.dispatchEvent(new Event("ambient-overrides-changed"));
  } catch {
    /* noop */
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("ambient-overrides-changed", () => {
    cache = null;
  });
}

/** Returns a signed URL for the override MP3, or null if none exists. */
export async function getOverrideUrl(soundId: string): Promise<string | null> {
  const map = await loadOverrides();
  const ov = map.get(soundId);
  if (!ov) return null;
  const { data } = await supabase.storage
    .from("ambient-audio")
    .createSignedUrl(ov.storage_path, 60 * 60);
  return data?.signedUrl ?? null;
}

/** Plays an override MP3 through the given AudioContext (looped, gain-controlled). */
export function playOverride(ctx: AudioContext, url: string, volume: number): { stop: () => void } {
  const audio = new Audio(url);
  audio.crossOrigin = "anonymous";
  audio.loop = true;
  audio.preload = "auto";

  const gain = ctx.createGain();
  gain.gain.value = 0;
  gain.connect(ctx.destination);

  let src: MediaElementAudioSourceNode | null = null;
  try {
    src = ctx.createMediaElementSource(audio);
    src.connect(gain);
  } catch {
    // Fallback: play directly on HTMLAudio if MediaElementSource fails (e.g. cross-origin)
    audio.volume = volume;
  }

  const play = audio.play();
  if (play && typeof play.catch === "function") play.catch(() => { /* noop */ });

  // fade in
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(0, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(volume, ctx.currentTime + 0.8);

  return {
    stop: () => {
      try {
        gain.gain.cancelScheduledValues(ctx.currentTime);
        gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      } catch {
        /* noop */
      }
      setTimeout(() => {
        try { audio.pause(); } catch { /* noop */ }
        try { src?.disconnect(); } catch { /* noop */ }
        try { gain.disconnect(); } catch { /* noop */ }
        audio.src = "";
      }, 600);
    },
  };
}
