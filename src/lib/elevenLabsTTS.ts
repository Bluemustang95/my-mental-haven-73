/**
 * ElevenLabs TTS client with IndexedDB cache.
 * Falls back to speechSynthesis if the edge function is unavailable.
 */
import { supabase } from "@/integrations/supabase/client";
import { getGlobalVoice } from "@/lib/globalVoice";

const DB_NAME = "resma_tts_cache";
const STORE = "audio";
const DB_VERSION = 1;

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
  if (cached) return cached;

  try {
    const { data, error } = await supabase.functions.invoke("mindfulness-tts", {
      body: { text, voiceId: vid },
    });
    if (error) throw error;
    // supabase-js returns Blob for audio/* responses
    const blob: Blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
    if (blob.size > 0) {
      cachePut(key, blob);
      return blob;
    }
    return null;
  } catch {
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
    // Fallback to browser synth so the UI never goes silent.
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
  audio.play().catch(() => {});
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
