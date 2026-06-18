import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye, Hand, Ear, Wind, Coffee, ArrowRight, Mic, MicOff } from "lucide-react";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { cn } from "@/lib/utils";
import { useGroundingScripts, type GroundingScripts } from "@/lib/groundingScripts";
import { toast } from "@/hooks/use-toast";

interface Step {
  count: number;
  icon: any;
  sense: string;
  prompt: string;
  voice: string;
  placeholder: string;
  color: string;
  scriptKey: keyof GroundingScripts;
}

const STEPS: Step[] = [
  {
    count: 5,
    icon: Eye,
    sense: "que podés ver",
    prompt: "5 cosas que estás viendo ahora",
    voice: "Mirá alrededor y nombrá cinco cosas que estás viendo en este momento.",
    placeholder: "Ej. la luz de la ventana…",
    color: "#FCD34D",
    scriptKey: "see",
  },
  {
    count: 4,
    icon: Hand,
    sense: "que podés tocar",
    prompt: "4 cosas que estás tocando",
    voice: "Notá cuatro texturas que tu cuerpo está sintiendo. La ropa, la silla, tu piel.",
    placeholder: "Ej. la tela del pantalón…",
    color: "#A78BFA",
    scriptKey: "touch",
  },
  {
    count: 3,
    icon: Ear,
    sense: "que podés escuchar",
    prompt: "3 sonidos que escuchás",
    voice: "Prestá atención a tres sonidos. Cercanos o lejanos.",
    placeholder: "Ej. un auto a lo lejos…",
    color: "#60A5FA",
    scriptKey: "hear",
  },
  {
    count: 2,
    icon: Wind,
    sense: "que podés oler",
    prompt: "2 olores que percibís",
    voice: "Inhalá despacio y notá dos olores presentes en el aire.",
    placeholder: "Ej. café recién hecho…",
    color: "#34D399",
    scriptKey: "smell",
  },
  {
    count: 1,
    icon: Coffee,
    sense: "que podés saborear",
    prompt: "1 sabor en tu boca",
    voice: "Notá un sabor que esté presente en tu boca ahora.",
    placeholder: "Ej. el último sorbo de agua…",
    color: "#FB923C",
    scriptKey: "taste",
  },
];

interface Props {
  voiceEnabled: boolean;
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

type Phase = "input" | "script";

export function SensesView({ voiceEnabled, music, onComplete, onAbort }: Props) {
  const audio = useMindfulAudio();
  const scripts = useGroundingScripts();
  const [stepIdx, setStepIdx] = useState(0);
  const [phase, setPhase] = useState<Phase>("input");
  const [entries, setEntries] = useState<string[][]>(STEPS.map((s) => Array(s.count).fill("")));
  const [activeInput, setActiveInput] = useState(0);
  const speakRef = useRef(audio.speak);
  speakRef.current = audio.speak;

  useEffect(() => {
    audio.playMusic(music);
    return () => { audio.stopSpeech(); audio.stopMusic(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  // Voice prompt for the input phase of each sense
  useEffect(() => {
    if (phase !== "input") return;
    if (!voiceEnabled) return;
    const t = setTimeout(() => speakRef.current(STEPS[stepIdx].voice), 350);
    return () => clearTimeout(t);
  }, [stepIdx, voiceEnabled, phase]);

  // Auto-play script when entering "script" phase
  useEffect(() => {
    if (phase !== "script") return;
    const text = scripts[STEPS[stepIdx].scriptKey];
    if (voiceEnabled) {
      // Small delay so the screen transition is perceived first
      const t = setTimeout(() => speakRef.current(text), 250);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, stepIdx, voiceEnabled]);

  const step = STEPS[stepIdx];
  const Icon = step.icon;
  const stepEntries = entries[stepIdx];
  const filledCount = stepEntries.filter((e) => e.trim()).length;
  const canAdvance = filledCount >= 1;
  const isLast = stepIdx === STEPS.length - 1;

  function updateEntry(i: number, v: string) {
    setEntries((prev) => {
      const copy = prev.map((arr) => [...arr]);
      copy[stepIdx][i] = v;
      return copy;
    });
  }

  function goToScript() {
    audio.stopSpeech();
    setPhase("script");
  }

  function continueFromScript() {
    audio.stopSpeech();
    if (isLast) {
      onComplete();
    } else {
      setStepIdx((i) => i + 1);
      setActiveInput(0);
      setPhase("input");
    }
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#0F172A] via-[#101927] to-[#0F172A] flex flex-col">
      {/* Halo background tinted per step */}
      <motion.div
        key={stepIdx}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.25 }}
        className="absolute -top-40 left-1/2 h-[28rem] w-[28rem] -translate-x-1/2 rounded-full blur-3xl"
        style={{ background: step.color }}
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between px-4 pt-6">
        <button onClick={onAbort} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur" aria-label="Salir">
          <X size={18} className="text-white" />
        </button>
        <div className="text-[11px] uppercase tracking-wider text-white/60">5 · 4 · 3 · 2 · 1</div>
        <div className="w-10" />
      </div>

      {/* Step dots */}
      <div className="relative z-10 mt-5 flex justify-center gap-1.5">
        {STEPS.map((s, i) => (
          <div
            key={i}
            className={cn(
              "h-1.5 rounded-full transition-all",
              i < stepIdx ? "w-3 bg-white/50" : i === stepIdx ? "w-8 bg-white" : "w-3 bg-white/15"
            )}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex-1 overflow-y-auto px-5 pt-6 pb-8">
        <AnimatePresence mode="wait">
          {phase === "input" ? (
            <motion.div
              key={`input-${stepIdx}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
            >
              <div className="flex flex-col items-center text-center">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-3xl"
                  style={{ background: `${step.color}25`, color: step.color }}
                >
                  <Icon size={36} />
                </div>
                <div className="mt-4 font-display text-6xl font-bold text-white tabular-nums">{step.count}</div>
                <div className="mt-1 text-sm text-white/70">cosas {step.sense}</div>
                <p className="mt-3 font-serif text-sm leading-relaxed text-white/80 max-w-xs">{step.prompt}</p>
              </div>

              {/* Inputs */}
              <div className="mt-6 space-y-2">
                {stepEntries.map((value, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl border bg-white/5 px-4 py-3 transition",
                      value.trim() ? "border-white/25" : i === activeInput ? "border-white/40" : "border-white/10"
                    )}
                  >
                    <span className="font-display text-xs font-semibold text-white/40 w-4">{i + 1}</span>
                    <input
                      value={value}
                      onChange={(e) => updateEntry(i, e.target.value)}
                      onFocus={() => setActiveInput(i)}
                      placeholder={step.placeholder}
                      maxLength={80}
                      className="flex-1 bg-transparent text-sm text-white placeholder:text-white/30 focus:outline-none"
                    />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`script-${stepIdx}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4 }}
              className="flex h-full flex-col items-center justify-center text-center"
            >
              <div
                className="mb-6 flex h-16 w-16 items-center justify-center rounded-3xl"
                style={{ background: `${step.color}25`, color: step.color }}
              >
                <Icon size={28} />
              </div>
              <p className="max-w-md font-serif text-lg leading-relaxed text-white/90">
                {scripts[step.scriptKey]}
              </p>
              <p className="mt-6 text-[11px] uppercase tracking-wider text-white/40">
                {voiceEnabled ? "Escuchá y respirá" : "Tomate un momento"}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer CTA */}
      <div className="relative z-10 px-5 pb-8">
        {phase === "input" ? (
          <>
            <button
              onClick={goToScript}
              disabled={!canAdvance}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-sm font-semibold text-[#0F172A] disabled:opacity-40 transition"
            >
              Reflexionar
              <ArrowRight size={16} />
            </button>
            {!canAdvance && (
              <p className="mt-2 text-center text-[11px] text-white/40">Escribí al menos uno para avanzar</p>
            )}
          </>
        ) : (
          <button
            onClick={continueFromScript}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-white py-4 text-sm font-semibold text-[#0F172A] transition"
          >
            {isLast ? "Terminar" : "Siguiente sentido"}
            {!isLast && <ArrowRight size={16} />}
          </button>
        )}
      </div>
    </div>
  );
}
