import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Pause, Play } from "lucide-react";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";

interface Cloud {
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
}

interface Props {
  totalSeconds: number;
  voiceEnabled: boolean;
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

const STARTER_PROMPT =
  "Cada vez que aparezca un pensamiento, escribilo y mirálo pasar. No te enganches, no lo discutas. Solo dejá que cruce.";

export function CloudsView({ totalSeconds, voiceEnabled, music, onComplete, onAbort }: Props) {
  const audio = useMindfulAudio();
  const [timeLeft, setTimeLeft] = useState(totalSeconds);
  const [paused, setPaused] = useState(false);
  const [draft, setDraft] = useState("");
  const [clouds, setClouds] = useState<Cloud[]>([]);
  const [composing, setComposing] = useState(false);
  const speakRef = useRef(audio.speak);
  speakRef.current = audio.speak;

  // Audio setup
  useEffect(() => {
    audio.playMusic(music);
    if (voiceEnabled) {
      const t = setTimeout(() => speakRef.current(STARTER_PROMPT), 600);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music, voiceEnabled]);

  useEffect(() => () => {
    audio.stopSpeech();
    audio.stopMusic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Timer
  useEffect(() => {
    if (paused) return;
    const i = window.setInterval(() => {
      setTimeLeft((s) => {
        if (s <= 1) {
          window.clearInterval(i);
          onComplete();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(i);
  }, [paused, onComplete]);

  const mm = Math.floor(timeLeft / 60).toString().padStart(2, "0");
  const ss = (timeLeft % 60).toString().padStart(2, "0");

  function addCloud() {
    const text = draft.trim();
    if (!text) {
      setComposing(false);
      return;
    }
    const lane = 0.1 + Math.random() * 0.65;
    const speed = 22 + Math.random() * 14;
    const size: Cloud["size"] = text.length > 60 ? "lg" : text.length > 25 ? "md" : "sm";
    setClouds((prev) => [...prev, { id: `${Date.now()}-${Math.random()}`, text, lane, speed, addedAt: Date.now(), size }]);
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

  return (
    <div className="absolute inset-0 overflow-hidden bg-gradient-to-b from-[#1E3A5F] via-[#0F172A] to-[#0F172A]">
      {/* Stars / ambient dust */}
      {sky.map((s) => (
        <motion.div
          key={s.id}
          className="absolute rounded-full bg-white/50"
          style={{ top: `${s.top}%`, left: `${s.left}%`, width: s.r * 2, height: s.r * 2 }}
          animate={{ opacity: [0.15, 0.55, 0.15] }}
          transition={{ duration: 5 + s.delay, repeat: Infinity, ease: "easeInOut", delay: s.delay }}
        />
      ))}

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

      {/* Floating clouds layer */}
      <div className="absolute inset-0">
        <AnimatePresence>
          {clouds.map((c) => (
            <CloudBubble key={c.id} cloud={c} paused={paused} />
          ))}
        </AnimatePresence>
      </div>

      {/* Empty hint */}
      {clouds.length === 0 && !composing && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none px-8">
          <p className="text-center font-serif text-base leading-relaxed text-white/65 max-w-xs">
            Cuando aparezca un pensamiento,<br />tocá <span className="text-white">+</span> y dejálo en una nube.
          </p>
        </div>
      )}

      {/* Composer / FAB */}
      <div className="absolute inset-x-0 bottom-0 z-20 p-4 pb-8">
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
                  onClick={addCloud}
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
              aria-label="Nueva nube"
            >
              <Plus size={26} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function CloudBubble({ cloud, paused }: { cloud: Cloud; paused: boolean }) {
  const sizeClass = cloud.size === "lg" ? "px-5 py-3 text-base max-w-[18rem]" : cloud.size === "md" ? "px-4 py-2.5 text-sm max-w-[15rem]" : "px-4 py-2 text-sm max-w-[12rem]";
  return (
    <motion.div
      initial={{ x: "-30%", opacity: 0 }}
      animate={{
        x: "120vw",
        opacity: [0, 0.85, 0.85, 0],
      }}
      transition={{
        duration: cloud.speed,
        ease: "linear",
        opacity: { duration: cloud.speed, times: [0, 0.08, 0.92, 1] },
      }}
      style={{
        top: `${15 + cloud.lane * 60}%`,
        animationPlayState: paused ? "paused" : "running",
      }}
      className="absolute left-0"
    >
      <div className={`rounded-[2rem] bg-white/90 text-[#0F172A] shadow-[0_8px_30px_rgba(255,255,255,0.15)] backdrop-blur ${sizeClass} font-serif leading-snug`}>
        {cloud.text}
      </div>
    </motion.div>
  );
}
