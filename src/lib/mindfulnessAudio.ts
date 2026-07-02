import { supabase } from "@/integrations/supabase/client";

const BUCKET = "mindfulness-audio";

/**
 * Resolve the pregenerated MP3 URL for a mindfulness script + voice combo.
 * Returns null if there is no cached audio for that pair.
 */
export async function getPreloadedScriptUrl(scriptId: string, voiceId: string): Promise<string | null> {
  const { data, error } = await supabase
    .from("mindfulness_audio_cache")
    .select("storage_path")
    .eq("script_id", scriptId)
    .eq("voice_id", voiceId)
    .maybeSingle();
  if (error || !data?.storage_path) return null;
  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(data.storage_path, 60 * 60 * 6); // 6h
  return signed?.signedUrl ?? null;
}

/**
 * Prefetch the audio bytes so the browser has them cached before playback.
 * Silently ignores network errors.
 */
export async function warmAudioCache(url: string): Promise<void> {
  try { await fetch(url, { mode: "cors" }); } catch { /* noop */ }
}

/** Play a pregenerated MP3 URL. */
export function playUrl(url: string, volume = 1): HTMLAudioElement {
  const a = new Audio(url);
  a.volume = Math.min(1, Math.max(0, volume));
  a.play().catch((e) => console.warn("[mindfulnessAudio] play failed", e));
  return a;
}
