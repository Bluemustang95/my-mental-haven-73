// Web Audio synthesizer for Diario Zen mode — no external assets.
export type Track = "solfeggio" | "rain" | "brown" | "click" | "ocean" | "white" | "wind";

let ctx: AudioContext | null = null;
const nodes: Partial<Record<Track, { stop: () => void }>> = {};

function ensureCtx(): AudioContext {
  if (!ctx) ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
  if (ctx.state === "suspended") ctx.resume();
  return ctx;
}

export function isPlaying(t: Track) {
  return !!nodes[t];
}

export function stop(t: Track) {
  nodes[t]?.stop();
  delete nodes[t];
}

export function stopAll() {
  (Object.keys(nodes) as Track[]).forEach(stop);
}

function noiseBuffer(c: AudioContext, brown = false) {
  const buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate);
  const d = buf.getChannelData(0);
  let last = 0;
  for (let i = 0; i < d.length; i++) {
    const w = Math.random() * 2 - 1;
    if (brown) {
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.5;
    } else d[i] = w;
  }
  return buf;
}

export function play(t: Track) {
  if (nodes[t]) return;
  const c = ensureCtx();
  const master = c.createGain();
  master.gain.value = 0;
  master.connect(c.destination);
  master.gain.linearRampToValueAtTime(0.35, c.currentTime + 0.6);

  if (t === "solfeggio") {
    const osc = c.createOscillator();
    osc.type = "sine";
    osc.frequency.value = 528;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.5;
    const lfoGain = c.createGain();
    lfoGain.gain.value = 2.5;
    lfo.connect(lfoGain).connect(osc.frequency);
    osc.connect(master);
    osc.start(); lfo.start();
    nodes[t] = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
        setTimeout(() => { osc.stop(); lfo.stop(); master.disconnect(); }, 500);
      },
    };
  } else if (t === "rain") {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2200;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.15;
    const lfoG = c.createGain();
    lfoG.gain.value = 800;
    lfo.connect(lfoG).connect(filter.frequency);
    src.connect(filter).connect(master);
    src.start(); lfo.start();
    nodes[t] = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
        setTimeout(() => { src.stop(); lfo.stop(); master.disconnect(); }, 500);
      },
    };
  } else if (t === "brown") {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c, true);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 400;
    src.connect(filter).connect(master);
    src.start();
    nodes[t] = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
        setTimeout(() => { src.stop(); master.disconnect(); }, 500);
      },
    };
  } else if (t === "click") {
    // Click is an "armed" mode: no continuous sound, just enables triggerClick.
    nodes[t] = { stop: () => { master.disconnect(); } };
  } else if (t === "ocean") {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 900;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.08;
    const lfoG = c.createGain();
    lfoG.gain.value = 600;
    lfo.connect(lfoG).connect(filter.frequency);
    src.connect(filter).connect(master);
    src.start(); lfo.start();
    nodes[t] = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
        setTimeout(() => { src.stop(); lfo.stop(); master.disconnect(); }, 500);
      },
    };
  } else if (t === "white") {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    src.connect(master);
    src.start();
    nodes[t] = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
        setTimeout(() => { src.stop(); master.disconnect(); }, 500);
      },
    };
  } else if (t === "wind") {
    const src = c.createBufferSource();
    src.buffer = noiseBuffer(c);
    src.loop = true;
    const filter = c.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 500;
    filter.Q.value = 0.7;
    const lfo = c.createOscillator();
    lfo.frequency.value = 0.2;
    const lfoG = c.createGain();
    lfoG.gain.value = 300;
    lfo.connect(lfoG).connect(filter.frequency);
    src.connect(filter).connect(master);
    src.start(); lfo.start();
    nodes[t] = {
      stop: () => {
        master.gain.linearRampToValueAtTime(0, c.currentTime + 0.4);
        setTimeout(() => { src.stop(); lfo.stop(); master.disconnect(); }, 500);
      },
    };
  }
}

let lastClick = 0;
export function triggerClick() {
  if (!nodes.click) return;
  const now = performance.now();
  if (now - lastClick < 25) return;
  lastClick = now;
  const c = ensureCtx();
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = "square";
  osc.frequency.value = 1800 + Math.random() * 600;
  g.gain.value = 0;
  osc.connect(g).connect(c.destination);
  const t0 = c.currentTime;
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.06, t0 + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.04);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}
