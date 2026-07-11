/**
 * ElevenLabs TTS client with IndexedDB cache.
 * - Monotonic token: last-call-wins; obsolete synth results are discarded.
 * - AbortController: stopSpeak() cancels the in-flight fetch too.
 * - Single audio path (no browser fallback here to avoid double voices).
 */
import { getGlobalVoice } from "@/lib/globalVoice";

const DB_NAME = "resma_tts_cache_v3";
const STORE = "audio";
const DB_VERSION = 1;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const TTS_URL = `${SUPABASE_URL}/functions/v1/mindfulness-tts`;

try { indexedDB.deleteDatabase("resma_tts_cache"); } catch { /* noop */ }
try { indexedDB.deleteDatabase("resma_tts_cache_v2"); } catch { /* noop */ }

function isAudioBlob(b: Blob | null): b is Blob {
  if (!b || b.size < 1000) return false;
  const t = (b.type || "").toLowerCase();
  if (t.includes("json") || t.includes("text/")) return false;
  return t.includes("audio") || t.includes("mpeg") || t === "" || t === "application/octet-stream";
}

async function cacheDelete(key: string) {
  try {
    const db = await openDb();
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(key);
  } catch { /* noop */ }
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
  } catch { /* noop */ }
}

function makeKey(text: string, voiceId: string) {
  return `${voiceId}::${text}`;
}

// ── Concurrency control ────────────────────────────────────────────────
let playToken = 0;              // increments on every stop/speak
let inflightAbort: AbortController | null = null;
let currentAudio: HTMLAudioElement | null = null;
let currentUrl: string | null = null;
let currentVolume = 1;
let primedAudio: HTMLAudioElement | null = null;

export async function synthesize(text: string, voiceId?: string, signal?: AbortSignal): Promise<Blob | null> {
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
      signal,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[TTS] edge function error", res.status, errText);
      return null;
    }
    const buf = await res.arrayBuffer();
    if (buf.byteLength < 200) return null;
    const blob = new Blob([buf], { type: "audio/mpeg" });
    cachePut(key, blob);
    return blob;
  } catch (e) {
    if ((e as any)?.name !== "AbortError") console.error("[TTS] fetch failed", e);
    return null;
  }
}

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
    primedAudio.play().catch(() => {});
  } catch { /* noop */ }
}

export async function speak(text: string, voiceId?: string): Promise<void> {
  // New utterance supersedes any previous one.
  stopSpeak();
  const myToken = ++playToken;
  const vid = voiceId ?? getGlobalVoice().voiceId;

  const controller = new AbortController();
  inflightAbort = controller;

  const blob = await synthesize(text, vid, controller.signal);
  if (myToken !== playToken) return;            // superseded, drop
  if (!blob) return;

  const ok = await tryPlayBlob(blob, myToken);
  if (ok) return;

  console.warn("[TTS] playback failed, invalidating cache and retrying");
  await cacheDelete(makeKey(text, vid));
  if (myToken !== playToken) return;
  const fresh = await synthesize(text, vid, controller.signal);
  if (myToken !== playToken || !fresh) return;
  await tryPlayBlob(fresh, myToken);
}

async function tryPlayBlob(blob: Blob, myToken: number): Promise<boolean> {
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
  if (myToken !== playToken) {
    try { audio.pause(); audio.src = ""; } catch { /* noop */ }
    URL.revokeObjectURL(url);
    if (currentUrl === url) { currentUrl = null; currentAudio = null; }
    return true; // treat as handled (superseded)
  }
  try {
    await audio.play();
    audio.onended = () => {
      if (currentUrl === url) {
        URL.revokeObjectURL(url);
        currentUrl = null;
        currentAudio = null;
      }
    };
    return true;
  } catch (e) {
    console.error("[TTS] audio.play failed", e);
    try { audio.pause(); audio.src = ""; } catch { /* noop */ }
    URL.revokeObjectURL(url);
    if (currentUrl === url) { currentUrl = null; currentAudio = null; }
    return false;
  }
}

export function stopSpeak() {
  playToken++; // invalidate anything in flight
  if (inflightAbort) {
    try { inflightAbort.abort(); } catch { /* noop */ }
    inflightAbort = null;
  }
  try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  if (currentAudio) {
    try { currentAudio.pause(); currentAudio.src = ""; } catch { /* noop */ }
    currentAudio = null;
  }
  if (currentUrl) {
    try { URL.revokeObjectURL(currentUrl); } catch { /* noop */ }
    currentUrl = null;
  }
}
