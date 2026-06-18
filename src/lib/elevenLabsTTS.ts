/**
 * ElevenLabs TTS client with IndexedDB cache.
 * Calls the `mindfulness-tts` edge function via direct fetch so the
 * binary audio/mpeg body is always returned as a Blob.
 */
import { getGlobalVoice } from "@/lib/globalVoice";

const DB_NAME = "resma_tts_cache_v2";
const STORE = "audio";
const DB_VERSION = 1;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const TTS_URL = `${SUPABASE_URL}/functions/v1/mindfulness-tts`;

// Best-effort wipe of the legacy cache that may contain corrupted/error blobs.
try { indexedDB.deleteDatabase("resma_tts_cache"); } catch { /* noop */ }

function isAudioBlob(b: Blob | null): b is Blob {
  if (!b || b.size < 200) return false;
  const t = (b.type || "").toLowerCase();
  return t.includes("audio") || t.includes("mpeg") || t === "" || t === "application/octet-stream";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function cacheGet(key: string): Promise<Blob | null> {
  try {
    const db = await openDb();
    return await new Promise((resolve) => {
      const tx = db.transaction(STORE, "readonly");
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => resolve((req.result as Blob) ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function cachePut(key: string, blob: Blob) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(blob, key);
  } catch {
    /* noop */
  }
}

function makeKey(text: string, voiceId: string) {
  return `${voiceId}::${text}`;
}

export async function synthesize(text: string, voiceId?: string): Promise<Blob | null> {
  const vid = voiceId ?? getGlobalVoice().voiceId;
  const key = makeKey(text, vid);
  const cached = await cacheGet(key);
  if (isAudioBlob(cached)) return cached;

  try {
    const res = await fetch(TTS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
      },
      body: JSON.stringify({ text, voiceId: vid }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[TTS] edge function error", res.status, errText);
      return null;
    }
    const ct = res.headers.get("Content-Type") || "audio/mpeg";
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 200) {
      console.error("[TTS] response too small", buf.byteLength);
      return null;
    }
    // Force a known good audio MIME so HTMLAudioElement can decode reliably.
    const blob = new Blob([buf], { type: "audio/mpeg" });
    void ct;
    cachePut(key, blob);
    return blob;
  } catch (e) {
    console.error("[TTS] fetch failed", e);
    return null;
  }
}

// Singleton audio element for playback so we don't overlap takes.
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let currentVolume = 1;
let primedAudio: HTMLAudioElement | null = null;

export function setSpeechVolume(v: number) {
  currentVolume = Math.min(1, Math.max(0, v));
  if (currentAudio) {
    try { currentAudio.volume = currentVolume; } catch { /* noop */ }
  }
}

export function getSpeechVolume() {
  return currentVolume;
}

/** Call from a user gesture to unlock the HTMLAudioElement autoplay channel. */
export function primeAudio() {
  try {
    if (!primedAudio) {
      primedAudio = new Audio();
      primedAudio.muted = true;
      primedAudio.src =
        "data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=";
    }
    primedAudio.play().catch((e) => console.warn("[TTS] primeAudio play failed", e));
  } catch (e) {
    console.warn("[TTS] primeAudio failed", e);
  }
}

export async function speak(text: string, voiceId?: string): Promise<void> {
  stopSpeak();
  const blob = await synthesize(text, voiceId);
  if (!blob) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-AR";
      u.rate = 0.92;
      u.volume = currentVolume;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio();
  audio.preload = "auto";
  audio.src = url;
  audio.volume = currentVolume;
  currentAudio = audio;
  currentUrl = url;
  await new Promise<void>((resolve) => {
    const done = () => resolve();
    audio.addEventListener("canplaythrough", done, { once: true });
    audio.addEventListener("loadeddata", done, { once: true });
    audio.addEventListener("error", done, { once: true });
    setTimeout(done, 1500);
  });
  try {
    await audio.play();
  } catch (e) {
    console.error("[TTS] audio.play failed", e);
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-AR";
      u.rate = 0.92;
      u.volume = currentVolume;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch { /* noop */ }
  }
  audio.onended = () => {
    if (currentUrl === url) {
      URL.revokeObjectURL(url);
      currentUrl = null;
      currentAudio = null;
    }
  };
}

export function stopSpeak() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    /* noop */
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.src = "";
    } catch {
      /* noop */
    }
    currentAudio = null;
  }
  if (currentUrl) {
    try {
      URL.revokeObjectURL(currentUrl);
    } catch {
      /* noop */
    }
    currentUrl = null;
  }
}
