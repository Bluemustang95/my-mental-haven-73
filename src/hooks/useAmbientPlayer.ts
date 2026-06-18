import { useCallback, useEffect, useRef } from "react";
import { AMBIENT_SOUNDS, getAmbientById } from "@/lib/ambientLibrary";

const STORAGE_KEY = "resma:mindful:ambient_volume";

function readVolume(): number {
  try {
    const v = Number(localStorage.getItem(STORAGE_KEY));
    if (Number.isFinite(v) && v >= 0 && v <= 1) return v;
  } catch {
    /* noop */
  }
  return 0.8;
}

// Module-level AudioContext so a "prime" call from a user gesture
// in one component unlocks audio for hooks mounted later.
let sharedCtx: AudioContext | null = null;
function getSharedCtx(): AudioContext {
  if (!sharedCtx) {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedCtx = new Ctor();
  }
  if (sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

/** Module-level primer callable from a user gesture before any hook mounts. */
export function primeAmbientAudio() {
  try {
    const ctx = getSharedCtx();
    const buf = ctx.createBuffer(1, 1, 22050);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.connect(ctx.destination);
    src.start(0);
  } catch (e) {
    console.warn("[ambient] primeAmbientAudio failed", e);
  }
}

/**
 * Play/stop ambient sounds from the library.
 * Returns a stable API: setSound(id), stop(), setVolume(n), pause(), resume(), prime()
 */
export function useAmbientPlayer() {
  const ctxRef = useRef<AudioContext | null>(null);
  const handleRef = useRef<{ stop: () => void } | null>(null);
  const currentIdRef = useRef<string>("off");
  const volumeRef = useRef<number>(readVolume());

  const ensureCtx = useCallback(() => {
    if (!ctxRef.current) ctxRef.current = getSharedCtx();
    if (ctxRef.current.state === "suspended") ctxRef.current.resume().catch(() => {});
    return ctxRef.current;
  }, []);

  const stop = useCallback(() => {
    if (handleRef.current) {
      try { handleRef.current.stop(); } catch { /* noop */ }
      handleRef.current = null;
    }
    currentIdRef.current = "off";
  }, []);

  const setSound = useCallback((id: string) => {
    if (currentIdRef.current === id) return;
    stop();
    if (id === "off") return;
    const def = getAmbientById(id);
    if (!def) return;
    const ctx = ensureCtx();
    handleRef.current = def.build(ctx, volumeRef.current);
    currentIdRef.current = id;
  }, [ensureCtx, stop]);

  const setVolume = useCallback((v: number) => {
    volumeRef.current = Math.min(1, Math.max(0, v));
    try { localStorage.setItem(STORAGE_KEY, String(volumeRef.current)); } catch { /* noop */ }
    if (currentIdRef.current !== "off") {
      const id = currentIdRef.current;
      stop();
      const ctx = ensureCtx();
      handleRef.current = getAmbientById(id).build(ctx, volumeRef.current);
      currentIdRef.current = id;
    }
  }, [ensureCtx, stop]);

  const pause = useCallback(() => {
    try { ctxRef.current?.suspend(); } catch { /* noop */ }
  }, []);

  const resume = useCallback(() => {
    try { ctxRef.current?.resume(); } catch { /* noop */ }
  }, []);

  /** Call inside a user gesture to unlock the AudioContext for autoplay. */
  const prime = useCallback(() => {
    try {
      const ctx = ensureCtx();
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    } catch (e) {
      console.warn("[ambient] prime failed", e);
    }
  }, [ensureCtx]);

  useEffect(() => {
    return () => {
      stop();
      try { ctxRef.current?.close(); } catch { /* noop */ }
      ctxRef.current = null;
    };
  }, [stop]);

  return {
    setSound,
    stop,
    pause,
    resume,
    prime,
    setVolume,
    getVolume: () => volumeRef.current,
    getCurrent: () => currentIdRef.current,
    catalog: AMBIENT_SOUNDS,
  };
}
