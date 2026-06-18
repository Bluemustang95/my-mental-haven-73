/**
 * ElevenLabs TTS client with IndexedDB cache.
 * Calls the `mindfulness-tts` edge function via direct fetch so the
 * binary audio/mpeg body is always returned as a Blob.
 */
import { getGlobalVoice } from "@/lib/globalVoice";

const DB_NAME = "resma_tts_cache";
const STORE = "audio";
const DB_VERSION = 1;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const TTS_URL = `${SUPABASE_URL}/functions/v1/mindfulness-tts`;

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
  if (cached && cached.size > 0) return cached;

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
    const blob = await res.blob();
    if (blob.size > 0) {
      cachePut(key, blob);
      return blob;
    }
    return null;
  } catch (e) {
    console.error("[TTS] fetch failed", e);
    return null;
  }
}

// Singleton audio element for playback so we don't overlap takes.
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;

export async function speak(text: string, voiceId?: string): Promise<void> {
  stopSpeak();
  const blob = await synthesize(text, voiceId);
  if (!blob) {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "es-AR";
      u.rate = 0.92;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* noop */
    }
    return;
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.volume = 1;
  currentAudio = audio;
  currentUrl = url;
  try {
    await audio.play();
  } catch (e) {
    console.error("[TTS] audio.play failed", e);
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
