import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pause, Play } from "lucide-react";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { useHojasMessages } from "@/lib/hojasMessages";
import { OrganicStage } from "@/components/mindfulness/stage/OrganicStage";
import { LeafPile } from "@/components/mindfulness/observar/LeafPile";

type Variant = "cloud" | "leaf" | "train";

interface Thought {
  id: string;
  text: string;
  /** vertical lane 0..1 */
  lane: number;
  /** horizontal speed seconds */
  speed: number;
  /** when added (ms) for staggered start */
  addedAt: number;
  /** size variant */
  size: "sm" | "md" | "lg";
  variant: Variant;
}

interface Props {
  totalSeconds: number;
  voiceEnabled: boolean;
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

type Phase = "intro" | "playing" | "outro";

function pickVariant(): Variant {
  const r = Math.random();
  if (r < 0.34) return "cloud";
  if (r < 0.67) return "leaf";
  return "train";
}

export function CloudsView({ totalSeconds, voiceEnabled, music, onComplete, onAbort }: Props) {
  const audio = useMindfulAudio();
  const messages = useHojasMessages();
  const [phase, setPhase] = useState<Phase>("intro");
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState("");
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [pile, setPile] = useState<Array<{ id: string; x: number; rotation: number; hue: number }>>([]);
  const [composing, setComposing] = useState(false);

  // When a thought finishes its trip, move it to the pile (only leaf variants get visually piled,
  // but all variants increment the counter so the user sees their releases).
  function settleThought(thought: Thought) {
    setThoughts((prev) => prev.filter((t) => t.id !== thought.id));
    setPile((prev) => [
      ...prev.slice(-39), // keep at most 40 in the pile
      {
        id: thought.id,
        x: Math.random(),
        rotation: -25 + Math.random() * 50,
        hue: Math.floor(Math.random() * 5),
      },
    ]);
  }

  const speakRef = useRef(audio.speak);
  speakRef.current = audio.speak;

  // Music + voice intro/outro
  useEffect(() => {
    if (phase === "playing") {
      audio.playMusic(music);
      if (voiceEnabled) {
        const t = setTimeout(() => speakRef.current(messages.pre), 400);
        return () => clearTimeout(t);
      }
    } else if (phase === "outro") {
      if (voiceEnabled) {
        const t = setTimeout(() => speakRef.current(messages.post), 300);
        return () => clearTimeout(t);
      }
    } else if (phase === "intro") {
      // No sound yet — wait for user
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, music, voiceEnabled]);

  useEffect(() => () => {
    audio.stopSpeech();
    audio.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer (only during playing)
  useEffect(() => {
    if (phase !== "playing" || paused) return;
    const i = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          window.clearInterval(i);
          setPhase("outro");
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(i);
  }, [paused, phase]);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  function addThought() {
    const text = draft.trim();
    if (!text) {
      setComposing(false);
      return;
    }
    const lane = 0.1 + Math.random() * 0.65;
    const speed = 22 + Math.random() * 14;
    const size: Thought["size"] = text.length > 60 ? "lg" : text.length > 25 ? "md" : "sm";
    const variant = pickVariant();
    const id = `${Date.now()}-${Math.random()}`;
    const newThought: Thought = { id, text, lane, speed, addedAt: Date.now(), size, variant };
    setThoughts((prev) => [...prev, newThought]);
    // Schedule settling once the bubble exits the viewport
    window.setTimeout(() => settleThought(newThought), speed * 1000);
    setDraft("");
    setComposing(false);
  }


  const sky = useMemo(
    () => Array.from({ length: 22 }).map((_, i) => ({
      id: i,
      top: Math.random() * 100,
      left: Math.random() * 100,
      r: 0.6 + Math.random() * 1.2,
      delay: Math.random() * 4,
    })),
    []
  );

  // ====== INTRO ======
  if (phase === "intro") {
    return (
      <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#1E3A5F] via-[#0F172A] to-[#0F172A]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-6">
          <button onClick={onAbort} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur" aria-label="Salir">
            <X size={18} className="text-white" />
          </button>
          <div className="text-[11px] uppercase tracking-wider text-white/60">Las hojas pasar</div>
          <div className="w-10" />
        </div>
        <div className="flex flex-1 items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-md text-center"
          >
            <p className="font-serif text-lg leading-relaxed text-white/85">{messages.pre}</p>
            <button
              onClick={() => setPhase("playing")}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0F172A] shadow-xl"
            >
              Empezar
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ====== OUTRO ======
  if (phase === "outro") {
    return (
      <div className="absolute inset-0 flex flex-col bg-gradient-to-b from-[#1E3A5F] via-[#0F172A] to-[#0F172A]">
        <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-6">
          <div className="w-10" />
          <div className="text-[11px] uppercase tracking-wider text-white/60">Cerrando</div>
          <div className="w-10" />
        </div>
        <div className="flex flex-1 items-center justify-center px-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-md text-center"
          >
            <p className="font-serif text-lg leading-relaxed text-white/90">{messages.post}</p>
            <button
              onClick={onComplete}
              className="mt-8 rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0F172A] shadow-xl"
            >
              Volver
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // ====== PLAYING ======
  return (
    <div className="absolute inset-0 overflow-hidden">
      <OrganicStage
        accentColor="#10B981"
        secondaryColor="#FCD34D"
        particleColor="#FDFCFB"
        particleCount={10}
      >

      {/* Leaf pile (accumulated released thoughts) */}
      <LeafPile leaves={pile} />


      {/* Header bar */}
      <div className="absolute inset-x-0 top-0 z-20 flex items-center justify-between px-4 pt-6">
        <button onClick={onAbort} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur" aria-label="Salir">
          <X size={18} className="text-white" />
        </button>
        <div className="rounded-full bg-white/10 px-3 py-1.5 font-display text-sm font-semibold tabular-nums text-white backdrop-blur">
          {mm}:{ss}
        </div>
        <button onClick={() => setPaused((p) => !p)} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 backdrop-blur" aria-label={paused ? "Reanudar" : "Pausar"}>
          {paused ? <Play size={16} className="text-white" /> : <Pause size={16} className="text-white" />}
        </button>
      </div>

      {/* Floating thoughts layer */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {thoughts.map((t) => (
            <ThoughtBubble key={t.id} thought={t} paused={paused} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty hint */}
      {thoughts.length === 0 && !composing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-8">
          <p className="text-center font-serif text-base leading-relaxed text-white/65 max-w-xs">
            Cuando aparezca un pensamiento,<br />tocá <span className="text-white">+</span> y dejálo ir.
          </p>
        </div>
      )}

      {/* Composer / FAB */}
      <div className="absolute inset-x-0 bottom-28 z-30 p-4">
        <AnimatePresence mode="wait">
          {composing ? (
            <motion.div
              key="composer"
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              className="rounded-3xl border border-white/15 bg-[#0F172A]/85 backdrop-blur-xl p-3"
            >
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Un pensamiento, una preocupación, una imagen…"
                rows={2}
                maxLength={120}
                className="w-full resize-none rounded-2xl bg-transparent px-3 py-2 text-sm text-white placeholder:text-white/40 focus:outline-none"
              />
              <div className="mt-1 flex items-center justify-between">
                <button onClick={() => { setComposing(false); setDraft(""); }} className="px-3 py-1.5 text-xs text-white/55">Cancelar</button>
                <button
                  onClick={addThought}
                  disabled={!draft.trim()}
                  className="rounded-full bg-[#60A5FA] px-5 py-2 text-xs font-semibold text-[#0F172A] disabled:opacity-40"
                >
                  Soltar
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.button
              key="fab"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={() => setComposing(true)}
              className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white text-[#0F172A] shadow-xl"
              aria-label="Nuevo pensamiento"
            >
              <Plus size={26} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
      </OrganicStage>
    </div>
  );
}

/* ====== ThoughtBubble: 3 random visual variants ====== */

function ThoughtBubble({ thought, paused }: { thought: Thought; paused: boolean }) {
  if (thought.variant === "leaf") return <LeafBubble thought={thought} paused={paused} />;
  if (thought.variant === "train") return <TrainBubble thought={thought} paused={paused} />;
  return <CloudBubble thought={thought} paused={paused} />;
}

function bubbleSize(size: Thought["size"]) {
  return size === "lg"
    ? "px-5 py-3 text-base max-w-[18rem]"
    : size === "md"
    ? "px-4 py-2.5 text-sm max-w-[15rem]"
    : "px-4 py-2 text-sm max-w-[12rem]";
}

function CloudBubble({ thought, paused }: { thought: Thought; paused: boolean }) {
  return (
    <motion.div
      initial={{ x: "-30%", opacity: 0 }}
      animate={{ x: "120vw", opacity: [0, 0.85, 0.85, 0] }}
      transition={{
        duration: thought.speed,
        ease: "linear",
        opacity: { duration: thought.speed, times: [0, 0.08, 0.92, 1] },
      }}
      style={{ top: `${15 + thought.lane * 55}%`, animationPlayState: paused ? "paused" : "running" }}
      className="absolute left-0"
    >
      <div className={`rounded-[2rem] bg-white/90 text-[#0F172A] shadow-[0_8px_30px_rgba(255,255,255,0.15)] backdrop-blur ${bubbleSize(thought.size)} font-serif leading-snug`}>
        {thought.text}
      </div>
    </motion.div>
  );
}

function LeafBubble({ thought, paused }: { thought: Thought; paused: boolean }) {
  // Falls top-to-bottom with horizontal sway (pendulum)
  const swayAmp = 30 + Math.random() * 40;
  const fallDuration = thought.speed * 0.9;
  return (
    <motion.div
      initial={{ y: "-15%", opacity: 0 }}
      animate={{ y: "115vh", opacity: [0, 0.85, 0.85, 0] }}
      transition={{
        duration: fallDuration,
        ease: "linear",
        opacity: { duration: fallDuration, times: [0, 0.1, 0.9, 1] },
      }}
      style={{ left: `${10 + thought.lane * 75}%`, animationPlayState: paused ? "paused" : "running" }}
      className="absolute top-0"
    >
      <motion.div
        animate={{ x: [-swayAmp, swayAmp, -swayAmp], rotate: [-12, 12, -12] }}
        transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
        className="relative"
      >
        <svg
          aria-hidden
          width="44"
          height="44"
          viewBox="0 0 64 64"
          className="absolute -left-3 -top-3 text-emerald-300/80"
          fill="currentColor"
        >
          <path d="M32 4 C 18 14, 10 28, 12 44 C 14 56, 26 60, 32 60 C 38 60, 50 56, 52 44 C 54 28, 46 14, 32 4 Z" />
          <path d="M32 8 L 32 58" stroke="#0F172A" strokeOpacity="0.25" strokeWidth="1.5" />
        </svg>
        <div className={`rounded-[1.5rem] bg-emerald-50/95 text-[#0F172A] shadow-[0_8px_24px_rgba(16,185,129,0.25)] ${bubbleSize(thought.size)} font-serif leading-snug`}>
          {thought.text}
        </div>
      </motion.div>
    </motion.div>
  );
}

function TrainBubble({ thought, paused }: { thought: Thought; paused: boolean }) {
  // Rectangular wagon with wheels, linear horizontal motion
  const duration = thought.speed * 0.7;
  return (
    <motion.div
      initial={{ x: "-40%", opacity: 0 }}
      animate={{ x: "125vw", opacity: [0, 1, 1, 0] }}
      transition={{
        duration,
        ease: "linear",
        opacity: { duration, times: [0, 0.08, 0.92, 1] },
      }}
      style={{ top: `${25 + thought.lane * 50}%`, animationPlayState: paused ? "paused" : "running" }}
      className="absolute left-0"
    >
      <div className="relative">
        <div className={`relative rounded-md border-2 border-[#0F172A]/70 bg-amber-200/95 text-[#0F172A] ${bubbleSize(thought.size)} font-serif leading-snug shadow-[0_6px_16px_rgba(0,0,0,0.25)]`}>
          {/* "windows" decoration */}
          <div className="pointer-events-none absolute inset-x-3 top-1 flex gap-1 opacity-50">
            <div className="h-1 w-3 rounded-sm bg-[#0F172A]/40" />
            <div className="h-1 w-3 rounded-sm bg-[#0F172A]/40" />
            <div className="h-1 w-3 rounded-sm bg-[#0F172A]/40" />
          </div>
          {thought.text}
        </div>
        {/* wheels */}
        <div className="absolute -bottom-2 left-3 h-4 w-4 rounded-full border-2 border-[#0F172A]/80 bg-slate-800" />
        <div className="absolute -bottom-2 right-3 h-4 w-4 rounded-full border-2 border-[#0F172A]/80 bg-slate-800" />
        {/* coupling */}
        <div className="absolute -left-3 top-1/2 h-1 w-3 -translate-y-1/2 bg-[#0F172A]/60" />
        <div className="absolute -right-3 top-1/2 h-1 w-3 -translate-y-1/2 bg-[#0F172A]/60" />
      </div>
    </motion.div>
  );
}
