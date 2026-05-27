// Sintetizador nativo Web Audio API para ruido terapéutico nocturno.
// No usa assets externos. Genera ruido blanco y lo modela con filtros.

export type SoundType = "waves" | "rain" | "off";

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let noiseSource: AudioBufferSourceNode | null = null;
let filterNode: BiquadFilterNode | null = null;
let lfo: OscillatorNode | null = null;
let lfoGain: GainNode | null = null;
let current: SoundType = "off";

function ensureCtx() {
  if (!ctx) {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new Ctor();
  }
  return ctx;
}

function buildNoiseBuffer(audio: AudioContext) {
  const seconds = 3;
  const buffer = audio.createBuffer(1, audio.sampleRate * seconds, audio.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}

export function play(sound: SoundType, volume = 0.4) {
  stop();
  if (sound === "off") return;
  const audio = ensureCtx();
  if (audio.state === "suspended") audio.resume();

  masterGain = audio.createGain();
  masterGain.gain.value = volume;
  masterGain.connect(audio.destination);

  noiseSource = audio.createBufferSource();
  noiseSource.buffer = buildNoiseBuffer(audio);
  noiseSource.loop = true;

  filterNode = audio.createBiquadFilter();
  if (sound === "waves") {
    // Olas: ruido grave + LFO sobre la ganancia (~0.1Hz vaivén)
    filterNode.type = "lowpass";
    filterNode.frequency.value = 480;
    filterNode.Q.value = 0.7;
    lfo = audio.createOscillator();
    lfo.frequency.value = 0.12;
    lfoGain = audio.createGain();
    lfoGain.gain.value = volume * 0.6;
    lfo.connect(lfoGain.gain);
    lfo.start();
  } else {
    // Lluvia: ruido agudo, filtro highpass
    filterNode.type = "highpass";
    filterNode.frequency.value = 1200;
    filterNode.Q.value = 0.6;
  }

  noiseSource.connect(filterNode);
  filterNode.connect(masterGain);
  noiseSource.start();
  current = sound;
}

export function stop() {
  try {
    noiseSource?.stop();
    noiseSource?.disconnect();
    filterNode?.disconnect();
    lfo?.stop();
    lfo?.disconnect();
    lfoGain?.disconnect();
    masterGain?.disconnect();
  } catch {
    /* noop */
  }
  noiseSource = null;
  filterNode = null;
  lfo = null;
  lfoGain = null;
  masterGain = null;
  current = "off";
}

export function setVolume(volume: number) {
  if (masterGain) masterGain.gain.value = Math.max(0, Math.min(1, volume));
}

export function currentSound(): SoundType {
  return current;
}
