/**
 * Ambient sound library — fully synthesized (no audio assets).
 * Each sound exposes a build(ctx, volume) that returns a stop() handle.
 */

export type AmbientCategory = "lluvia" | "viento" | "agua" | "naturaleza" | "abstractos" | "ninguno";

export interface AmbientSound {
  id: string;
  label: string;
  category: AmbientCategory;
  description?: string;
  build: (ctx: AudioContext, volume: number) => { stop: () => void };
}

function makeNoiseBuffer(ctx: AudioContext, seconds = 3) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  for (let i = 0; i < ch.length; i++) ch[i] = Math.random() * 2 - 1;
  return buf;
}

function brownianBuffer(ctx: AudioContext, seconds = 3) {
  const buf = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
  const ch = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < ch.length; i++) {
    const white = Math.random() * 2 - 1;
    last = (last + 0.02 * white) / 1.02;
    ch[i] = last * 3.5;
  }
  return buf;
}

function makeNoiseSource(ctx: AudioContext, kind: "white" | "brown" = "white") {
  const src = ctx.createBufferSource();
  src.buffer = kind === "brown" ? brownianBuffer(ctx) : makeNoiseBuffer(ctx);
  src.loop = true;
  src.start();
  return src;
}

function fade(gain: GainNode, ctx: AudioContext, to: number, t = 1.2) {
  gain.gain.cancelScheduledValues(ctx.currentTime);
  gain.gain.setValueAtTime(gain.gain.value, ctx.currentTime);
  gain.gain.linearRampToValueAtTime(to, ctx.currentTime + t);
}

type Stoppable = { stop: (when?: number) => void };

function rainBase(ctx: AudioContext, volume: number, opts: {
  hp: number; lp: number; gain: number; mod?: number;
}) {
  const src = makeNoiseSource(ctx, "white");
  const hp = ctx.createBiquadFilter();
  hp.type = "highpass";
  hp.frequency.value = opts.hp;
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = opts.lp;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(hp).connect(lp).connect(g).connect(ctx.destination);
  fade(g, ctx, volume * opts.gain);

  let lfo: OscillatorNode | null = null;
  let lfoG: GainNode | null = null;
  if (opts.mod) {
    lfo = ctx.createOscillator();
    lfo.frequency.value = opts.mod;
    lfoG = ctx.createGain();
    lfoG.gain.value = volume * 0.05;
    lfo.connect(lfoG).connect(g.gain);
    lfo.start();
  }

  return {
    stop: () => {
      fade(g, ctx, 0, 0.6);
      setTimeout(() => {
        try { src.stop(); } catch { /* noop */ }
        try { lfo?.stop(); } catch { /* noop */ }
      }, 700);
    },
    extras: [] as Stoppable[],
  };
}

function thunder(ctx: AudioContext, volume: number) {
  // Trigger a low rumble occasionally.
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  fade(master, ctx, volume * 0.6, 0.5);
  let stopped = false;

  function strike() {
    if (stopped) return;
    const src = makeNoiseSource(ctx);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 220;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(lp).connect(g).connect(master);
    const now = ctx.currentTime;
    g.gain.setValueAtTime(0, now);
    g.gain.linearRampToValueAtTime(volume * 0.9, now + 0.15);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5 + Math.random() * 2);
    setTimeout(() => {
      try { src.stop(); } catch { /* noop */ }
    }, 5000);
    setTimeout(strike, 12000 + Math.random() * 20000);
  }
  setTimeout(strike, 5000 + Math.random() * 8000);

  return {
    stop: () => {
      stopped = true;
      fade(master, ctx, 0, 0.5);
    },
  };
}

function windBase(ctx: AudioContext, volume: number, lp: number, modFreq: number, modAmount: number) {
  const src = makeNoiseSource(ctx, "brown");
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = lp;
  filter.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(filter).connect(g).connect(ctx.destination);
  fade(g, ctx, volume * 0.6);

  const lfo = ctx.createOscillator();
  lfo.frequency.value = modFreq;
  const lfoG = ctx.createGain();
  lfoG.gain.value = volume * modAmount;
  lfo.connect(lfoG).connect(g.gain);
  lfo.start();

  // Slight filter sweep for "gusts"
  const sweep = ctx.createOscillator();
  sweep.frequency.value = modFreq * 0.7;
  const sweepG = ctx.createGain();
  sweepG.gain.value = lp * 0.25;
  sweep.connect(sweepG).connect(filter.frequency);
  sweep.start();

  return {
    stop: () => {
      fade(g, ctx, 0, 0.8);
      setTimeout(() => {
        try { src.stop(); } catch { /* noop */ }
        try { lfo.stop(); } catch { /* noop */ }
        try { sweep.stop(); } catch { /* noop */ }
      }, 900);
    },
  };
}

function pad(ctx: AudioContext, volume: number, freqs: number[]) {
  const g = ctx.createGain();
  g.gain.value = 0;
  g.connect(ctx.destination);
  fade(g, ctx, volume * 0.35);
  const oscs = freqs.map((f, i) => {
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.value = f + (i % 2 ? 1.5 : 0);
    const og = ctx.createGain();
    og.gain.value = 0.07;
    o.connect(og).connect(g);
    o.start();
    return o;
  });
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 0.07;
  const lfoG = ctx.createGain();
  lfoG.gain.value = volume * 0.05;
  lfo.connect(lfoG).connect(g.gain);
  lfo.start();
  return {
    stop: () => {
      fade(g, ctx, 0, 0.8);
      setTimeout(() => {
        oscs.forEach((o) => { try { o.stop(); } catch { /* noop */ } });
        try { lfo.stop(); } catch { /* noop */ }
      }, 900);
    },
  };
}

function chirps(ctx: AudioContext, volume: number) {
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  fade(master, ctx, volume * 0.4, 0.5);
  let stopped = false;
  function chirp() {
    if (stopped) return;
    const o = ctx.createOscillator();
    o.type = "triangle";
    const base = 1800 + Math.random() * 1600;
    o.frequency.setValueAtTime(base, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(base * 1.8, ctx.currentTime + 0.15);
    const g = ctx.createGain();
    g.gain.value = 0;
    o.connect(g).connect(master);
    g.gain.linearRampToValueAtTime(volume * 0.18, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    o.start();
    o.stop(ctx.currentTime + 0.3);
    setTimeout(chirp, 400 + Math.random() * 1800);
  }
  setTimeout(chirp, 600);
  return {
    stop: () => {
      stopped = true;
      fade(master, ctx, 0, 0.5);
    },
  };
}

function crickets(ctx: AudioContext, volume: number) {
  const src = makeNoiseSource(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 4800;
  bp.Q.value = 18;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(bp).connect(g).connect(ctx.destination);
  fade(g, ctx, volume * 0.55);
  const lfo = ctx.createOscillator();
  lfo.frequency.value = 12;
  const lfoG = ctx.createGain();
  lfoG.gain.value = volume * 0.45;
  lfo.connect(lfoG).connect(g.gain);
  lfo.start();
  return {
    stop: () => {
      fade(g, ctx, 0, 0.6);
      setTimeout(() => {
        try { src.stop(); } catch { /* noop */ }
        try { lfo.stop(); } catch { /* noop */ }
      }, 700);
    },
  };
}

function crackle(ctx: AudioContext, volume: number) {
  // Fire crackle: bursts of band-passed noise with random envelopes.
  const master = ctx.createGain();
  master.gain.value = 0;
  master.connect(ctx.destination);
  fade(master, ctx, volume * 0.7, 0.6);
  // Constant low rumble
  const rumble = makeNoiseSource(ctx, "brown");
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = 180;
  const rg = ctx.createGain();
  rg.gain.value = volume * 0.25;
  rumble.connect(lp).connect(rg).connect(master);
  let stopped = false;
  function pop() {
    if (stopped) return;
    const src = makeNoiseSource(ctx);
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 1500 + Math.random() * 3500;
    bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.value = 0;
    src.connect(bp).connect(g).connect(master);
    g.gain.linearRampToValueAtTime(volume * (0.15 + Math.random() * 0.25), ctx.currentTime + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.05 + Math.random() * 0.08);
    setTimeout(() => {
      try { src.stop(); } catch { /* noop */ }
    }, 200);
    setTimeout(pop, 30 + Math.random() * 220);
  }
  pop();
  return {
    stop: () => {
      stopped = true;
      fade(master, ctx, 0, 0.6);
      setTimeout(() => {
        try { rumble.stop(); } catch { /* noop */ }
      }, 700);
    },
  };
}

function waves(ctx: AudioContext, volume: number, intense = false) {
  const src = makeNoiseSource(ctx);
  const lp = ctx.createBiquadFilter();
  lp.type = "lowpass";
  lp.frequency.value = intense ? 700 : 480;
  lp.Q.value = 0.7;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(lp).connect(g).connect(ctx.destination);
  fade(g, ctx, volume * (intense ? 0.7 : 0.55));
  const lfo = ctx.createOscillator();
  lfo.frequency.value = intense ? 0.18 : 0.1;
  const lfoG = ctx.createGain();
  lfoG.gain.value = volume * 0.55;
  lfo.connect(lfoG).connect(g.gain);
  lfo.start();
  return {
    stop: () => {
      fade(g, ctx, 0, 0.6);
      setTimeout(() => {
        try { src.stop(); } catch { /* noop */ }
        try { lfo.stop(); } catch { /* noop */ }
      }, 700);
    },
  };
}

function river(ctx: AudioContext, volume: number) {
  const src = makeNoiseSource(ctx);
  const bp = ctx.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 1100;
  bp.Q.value = 1.6;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(bp).connect(g).connect(ctx.destination);
  fade(g, ctx, volume * 0.55);
  return {
    stop: () => {
      fade(g, ctx, 0, 0.6);
      setTimeout(() => { try { src.stop(); } catch { /* noop */ } }, 700);
    },
  };
}

function noiseColor(ctx: AudioContext, volume: number, color: "white" | "pink" | "brown") {
  const src = makeNoiseSource(ctx, color === "brown" ? "brown" : "white");
  const filter = ctx.createBiquadFilter();
  filter.type = "lowpass";
  filter.frequency.value = color === "white" ? 18000 : color === "pink" ? 4000 : 1500;
  const g = ctx.createGain();
  g.gain.value = 0;
  src.connect(filter).connect(g).connect(ctx.destination);
  fade(g, ctx, volume * 0.5);
  return {
    stop: () => {
      fade(g, ctx, 0, 0.5);
      setTimeout(() => { try { src.stop(); } catch { /* noop */ } }, 600);
    },
  };
}

// Composite combo helper
function combine(...layers: { stop: () => void }[]) {
  return { stop: () => layers.forEach((l) => l.stop()) };
}

export const AMBIENT_SOUNDS: AmbientSound[] = [
  { id: "off", label: "Silencio", category: "ninguno", build: () => ({ stop: () => {} }) },

  // Lluvia
  { id: "rain_soft", label: "Lluvia suave", category: "lluvia",
    build: (ctx, v) => rainBase(ctx, v, { hp: 800, lp: 2400, gain: 0.18 }) },
  { id: "rain_heavy", label: "Lluvia fuerte", category: "lluvia",
    build: (ctx, v) => rainBase(ctx, v, { hp: 400, lp: 5200, gain: 0.32, mod: 0.3 }) },
  { id: "rain_thunder", label: "Lluvia con truenos", category: "lluvia",
    build: (ctx, v) => combine(rainBase(ctx, v, { hp: 350, lp: 4500, gain: 0.28 }), thunder(ctx, v)) },
  { id: "rain_roof", label: "Lluvia sobre techo", category: "lluvia",
    build: (ctx, v) => rainBase(ctx, v, { hp: 1200, lp: 3800, gain: 0.24, mod: 0.4 }) },

  // Viento
  { id: "breeze", label: "Brisa", category: "viento",
    build: (ctx, v) => windBase(ctx, v, 800, 0.15, 0.18) },
  { id: "forest_wind", label: "Viento en bosque", category: "viento",
    build: (ctx, v) => windBase(ctx, v, 1400, 0.22, 0.28) },
  { id: "mountain_wind", label: "Viento de montaña", category: "viento",
    build: (ctx, v) => windBase(ctx, v, 2200, 0.32, 0.42) },

  // Agua
  { id: "waves_soft", label: "Olas suaves", category: "agua",
    build: (ctx, v) => waves(ctx, v, false) },
  { id: "waves_strong", label: "Olas fuertes", category: "agua",
    build: (ctx, v) => waves(ctx, v, true) },
  { id: "river", label: "Río", category: "agua",
    build: (ctx, v) => river(ctx, v) },
  { id: "waterfall", label: "Cascada lejana", category: "agua",
    build: (ctx, v) => rainBase(ctx, v, { hp: 250, lp: 3200, gain: 0.4 }) },

  // Naturaleza
  { id: "forest_dawn", label: "Bosque al amanecer", category: "naturaleza",
    build: (ctx, v) => combine(windBase(ctx, v, 900, 0.16, 0.2), chirps(ctx, v)) },
  { id: "crickets_night", label: "Noche de grillos", category: "naturaleza",
    build: (ctx, v) => crickets(ctx, v) },
  { id: "campfire", label: "Fogata", category: "naturaleza",
    build: (ctx, v) => crackle(ctx, v) },

  // Abstractos
  { id: "white_noise", label: "Ruido blanco", category: "abstractos",
    build: (ctx, v) => noiseColor(ctx, v, "white") },
  { id: "pink_noise", label: "Ruido rosa", category: "abstractos",
    build: (ctx, v) => noiseColor(ctx, v, "pink") },
  { id: "brown_noise", label: "Ruido marrón", category: "abstractos",
    build: (ctx, v) => noiseColor(ctx, v, "brown") },
  { id: "drone_pad", label: "Drone meditativo", category: "abstractos",
    build: (ctx, v) => pad(ctx, v, [110, 164.81, 220]) },
];

export const CATEGORY_LABELS: Record<AmbientCategory, string> = {
  ninguno: "Silencio",
  lluvia: "Lluvia",
  viento: "Viento",
  agua: "Agua",
  naturaleza: "Naturaleza",
  abstractos: "Abstractos",
};

export function getAmbientById(id: string): AmbientSound {
  return AMBIENT_SOUNDS.find((s) => s.id === id) ?? AMBIENT_SOUNDS[0];
}
