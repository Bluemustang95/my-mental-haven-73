import { useCallback, useEffect, useRef } from "react";

export type MusicTrack = "silence" | "rain" | "ambient";

/**
 * Mindful audio engine.
 * - Voice: SpeechSynthesis (es-AR, soft female voice when available).
 * - Music: procedurally generated via Web Audio API (no asset files).
 *   - rain: filtered white noise + soft low-pass modulation
 *   - ambient: two slow detuned sine pads
 * Architecture is ready to be swapped to ElevenLabs / file loops without changing the public API.
 */
export function useMindfulAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const musicNodesRef = useRef<{ stop: () => void } | null>(null);
  const currentTrackRef = useRef<MusicTrack>("silence");

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
      audioCtxRef.current = new Ctx();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume().catch(() => {});
    }
    return audioCtxRef.current;
  }, []);

  const stopMusic = useCallback(() => {
    if (musicNodesRef.current) {
      try { musicNodesRef.current.stop(); } catch {}
      musicNodesRef.current = null;
    }
    currentTrackRef.current = "silence";
  }, []);

  const playRain = useCallback((ctx: AudioContext) => {
    // Pink-ish noise via biquad low-pass on white noise.
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const source = ctx.createBufferSource();
    source.buffer = noiseBuffer;
    source.loop = true;

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 1400;
    lowpass.Q.value = 0.4;

    const highpass = ctx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 250;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    source.connect(highpass).connect(lowpass).connect(gain).connect(ctx.destination);
    source.start();
    gain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + 1.2);

    return {
      stop: () => {
        try {
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
          setTimeout(() => { try { source.stop(); } catch {} }, 700);
        } catch {}
      },
    };
  }, []);

  const playAmbient = useCallback((ctx: AudioContext) => {
    const gain = ctx.createGain();
    gain.gain.value = 0;
    gain.connect(ctx.destination);

    const freqs = [110, 164.81, 220];
    const oscs = freqs.map((f, i) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f + (i % 2 === 0 ? 0 : 1.5);
      const g = ctx.createGain();
      g.gain.value = 0.06;
      o.connect(g).connect(gain);
      o.start();
      return { o, g };
    });

    // Slow LFO on gain for breathing pad
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.05;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();

    gain.gain.linearRampToValueAtTime(0.12, ctx.currentTime + 1.2);

    return {
      stop: () => {
        try {
          gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.6);
          setTimeout(() => {
            oscs.forEach(({ o }) => { try { o.stop(); } catch {} });
            try { lfo.stop(); } catch {}
          }, 700);
        } catch {}
      },
    };
  }, []);

  const playMusic = useCallback((track: MusicTrack) => {
    if (currentTrackRef.current === track) return;
    stopMusic();
    if (track === "silence") return;
    const ctx = getCtx();
    if (track === "rain") musicNodesRef.current = playRain(ctx);
    else if (track === "ambient") musicNodesRef.current = playAmbient(ctx);
    currentTrackRef.current = track;
  }, [getCtx, playAmbient, playRain, stopMusic]);

  const speak = useCallback((text: string) => {
    // Use ElevenLabs (via edge function + IndexedDB cache). Falls back to
    // speechSynthesis internally if the function is unavailable.
    import("@/lib/elevenLabsTTS").then((m) => m.speak(text)).catch(() => {
      try {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-AR";
        u.rate = 0.92;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      } catch { /* noop */ }
    });
  }, []);

  const stopSpeech = useCallback(() => {
    import("@/lib/elevenLabsTTS").then((m) => m.stopSpeak()).catch(() => {});
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMusic();
      stopSpeech();
      try { audioCtxRef.current?.close(); } catch {}
      audioCtxRef.current = null;
    };
  }, [stopMusic, stopSpeech]);

  return { playMusic, stopMusic, speak, stopSpeech };
}
