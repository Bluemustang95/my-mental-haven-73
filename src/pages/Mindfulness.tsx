import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowCounterClockwise, Pause, Play, SpeakerHigh, MusicNotes } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita.png";

const durations = [
  { label: "3 min", minutes: 3, seconds: 180 },
  { label: "5 min", minutes: 5, seconds: 300 },
  { label: "10 min", minutes: 10, seconds: 600 },
  { label: "15 min", minutes: 15, seconds: 900 },
];

const breathPhases = [
  { label: "Inhalá", scale: 1.08, speech: "Inhalá suave, trayendo tu atención al presente." },
  { label: "Sostené", scale: 1.16, speech: "Sostené sin exigir. Solo notá lo que sentís." },
  { label: "Exhalá", scale: 0.92, speech: "Exhalá lento. Dejá pasar los pensamientos como nubes." },
];

type View = "intro" | "config" | "session" | "summary";

function Mandala({ phase, running }: { phase: number; running: boolean }) {
  const petals = Array.from({ length: 18 });
  const innerPetals = Array.from({ length: 12 });
  const phaseScale = running ? breathPhases[phase].scale : 1;

  return (
    <div className="relative flex h-[min(72vw,18rem)] w-[min(72vw,18rem)] items-center justify-center">
      <motion.div
        className="absolute h-[92%] w-[92%] rounded-full bg-mindful-yellow/25 blur-3xl"
        animate={{ scale: running ? [0.82, 1.12, 0.9] : 0.9, opacity: running ? [0.35, 0.68, 0.38] : 0.35 }}
        transition={{ duration: 4.5, repeat: running ? Infinity : 0, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute h-[72%] w-[72%] rounded-full bg-mindful-orange/20 blur-2xl"
        animate={{ scale: running ? [0.9, 1.18, 0.86] : 0.95, opacity: running ? [0.2, 0.5, 0.22] : 0.22 }}
        transition={{ duration: 4.5, repeat: running ? Infinity : 0, ease: [0.4, 0, 0.2, 1], delay: 0.25 }}
      />
      <motion.svg
        viewBox="0 0 240 240"
        className="relative h-full w-full drop-shadow-2xl"
        animate={{ scale: phaseScale, rotate: running ? phase * 8 : 0 }}
        transition={{ duration: 4.5, ease: [0.4, 0, 0.2, 1] }}
        aria-hidden="true"
      >
        <defs>
          <radialGradient id="mandalaCore" cx="50%" cy="50%" r="55%">
            <stop offset="0%" stopColor="hsl(var(--mindful-yellow))" stopOpacity="0.95" />
            <stop offset="58%" stopColor="hsl(var(--mindful-orange))" stopOpacity="0.58" />
            <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0.18" />
          </radialGradient>
        </defs>
        <circle cx="120" cy="120" r="98" fill="hsl(var(--card))" opacity="0.92" />
        {petals.map((_, index) => (
          <ellipse
            key={`outer-${index}`}
            cx="120"
            cy="44"
            rx="13"
            ry="34"
            fill={index % 2 === 0 ? "hsl(var(--mindful-yellow))" : "hsl(var(--mindful-orange))"}
            fillOpacity="0.38"
            stroke="hsl(var(--card))"
            strokeWidth="1.5"
            transform={`rotate(${index * 20} 120 120)`}
          />
        ))}
        {innerPetals.map((_, index) => (
          <path
            key={`inner-${index}`}
            d="M120 66 C139 84 148 101 120 120 C92 101 101 84 120 66Z"
            fill="url(#mandalaCore)"
            fillOpacity="0.74"
            stroke="hsl(var(--foreground))"
            strokeOpacity="0.08"
            transform={`rotate(${index * 30} 120 120)`}
          />
        ))}
        <circle cx="120" cy="120" r="45" fill="hsl(var(--mindful-sky))" opacity="0.86" />
        <circle cx="120" cy="120" r="28" fill="hsl(var(--mindful-yellow))" opacity="0.96" />
        <circle cx="120" cy="120" r="10" fill="hsl(var(--mindful-orange))" opacity="0.9" />
      </motion.svg>
    </div>
  );
}

function TogglePill({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof SpeakerHigh; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-full border px-4 py-3 font-sans text-xs font-semibold shadow-sm transition-all active:scale-95",
        active ? "border-accent bg-mindful-yellow/40 text-foreground" : "border-border bg-card/80 text-muted-foreground"
      )}
    >
      <Icon size={16} weight={active ? "fill" : "regular"} />
      {label}
    </button>
  );
}

export default function Mindfulness() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("intro");
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [timeLeft, setTimeLeft] = useState(durations[0].seconds);
  const [isRunning, setIsRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const timerRef = useRef<number | null>(null);
  const phaseRef = useRef<number | null>(null);

  const totalSeconds = durations[selectedDuration].seconds;
  const progress = useMemo(() => 1 - timeLeft / totalSeconds, [timeLeft, totalSeconds]);
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  useEffect(() => {
    if (view !== "session" || !isRunning) return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          setIsRunning(false);
          setView("summary");
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [isRunning, view]);

  useEffect(() => {
    if (view !== "session" || !isRunning) return;

    phaseRef.current = window.setInterval(() => {
      setPhase((current) => (current + 1) % breathPhases.length);
    }, 4500);

    return () => {
      if (phaseRef.current) window.clearInterval(phaseRef.current);
    };
  }, [isRunning, view]);

  useEffect(() => {
    if (!voiceEnabled || view !== "session" || !isRunning || !("speechSynthesis" in window)) return;

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(breathPhases[phase].speech);
    utterance.lang = "es-AR";
    utterance.rate = 0.88;
    utterance.pitch = 1.02;
    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
  }, [phase, voiceEnabled, view, isRunning]);

  useEffect(() => () => window.speechSynthesis?.cancel(), []);

  const selectDuration = (index: number) => {
    setSelectedDuration(index);
    setTimeLeft(durations[index].seconds);
  };

  const startSession = () => {
    setPhase(0);
    setIsRunning(true);
    setView("session");
  };

  const resetSession = () => {
    setIsRunning(false);
    setPhase(0);
    setTimeLeft(totalSeconds);
    window.speechSynthesis?.cancel();
  };

  const close = () => {
    window.speechSynthesis?.cancel();
    navigate("/herramientas");
  };

  return (
    <main className="min-h-screen bg-mindful-cream px-4 pb-28 pt-10 font-sans text-foreground safe-area-top">
      <div className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-md flex-col">
        <header className="mb-4 flex items-center justify-between">
          <button
            onClick={view === "intro" ? close : () => setView(view === "session" ? "config" : "intro")}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card/80 text-muted-foreground shadow-sm transition-transform active:scale-95"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full bg-card/80 px-4 py-2 font-sans text-xs font-semibold text-muted-foreground shadow-sm">
            Mindfulness
          </span>
        </header>

        <AnimatePresence mode="wait">
          {view === "intro" && (
            <motion.section
              key="intro"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
            >
              <motion.div
                animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }}
                transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex h-36 w-36 items-center justify-center rounded-[3rem] bg-mindful-sky/80 p-3 shadow-[0_22px_55px_hsl(var(--secondary)/0.55)] sm:h-44 sm:w-44 sm:p-4"
              >
                <div className="absolute inset-5 rounded-full bg-mindful-yellow/30 blur-2xl" />
                <img src={resmitaAvatar} alt="Resmita" className="relative h-full w-full object-contain" />
              </motion.div>

              <div className="rounded-[3rem] border border-border bg-card px-5 py-5 shadow-[0_18px_45px_hsl(var(--border)/0.55)] sm:px-6 sm:py-7">
                <h1 className="mb-3 font-mindful text-3xl leading-tight sm:text-4xl">Hola, soy Resmita</h1>
                <p className="font-sans text-xs leading-6 text-muted-foreground sm:text-sm sm:leading-7">
                  Mindfulness es estar presente, aquí y ahora. Es notar lo que sentís sin juzgarlo, dejándolo pasar como nubes en el cielo. Practicarlo te va a ayudar a bajar la ansiedad, mejorar tu concentración y darle un respiro a tu mente para que puedas sentirte con más calma y claridad durante el día.
                </p>
              </div>

              <button
                onClick={() => setView("config")}
                className="w-full rounded-[3rem] bg-primary px-8 py-4 font-sans text-base font-bold text-primary-foreground shadow-[0_18px_35px_hsl(var(--primary)/0.22)] transition-transform active:scale-95 sm:py-5"
              >
                ¿Empezamos?
              </button>
            </motion.section>
          )}

          {view === "config" && (
            <motion.section
              key="config"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-1 flex-col justify-center"
            >
              <div className="mb-8 text-center">
                <h1 className="font-mindful text-5xl leading-tight">Tu Espacio</h1>
                <p className="mt-2 font-sans text-sm text-muted-foreground">¿Cuánto tiempo necesitás hoy?</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {durations.map((duration, index) => (
                  <button
                    key={duration.label}
                    onClick={() => selectDuration(index)}
                    className={cn(
                      "min-h-32 rounded-[3rem] border p-5 text-left transition-all duration-300 active:scale-95",
                      selectedDuration === index
                        ? "scale-105 border-accent bg-mindful-yellow shadow-[0_22px_42px_hsl(var(--mindful-orange)/0.32)]"
                        : "border-border bg-card shadow-[0_12px_28px_hsl(var(--border)/0.45)]"
                    )}
                  >
                    <span className="block font-mindful text-5xl leading-none">{duration.minutes}</span>
                    <span className="mt-2 block font-sans text-sm font-semibold text-muted-foreground">minutos</span>
                  </button>
                ))}
              </div>

              <button
                onClick={startSession}
                className="mt-8 w-full rounded-[3rem] bg-primary px-8 py-5 font-sans text-base font-bold text-primary-foreground shadow-[0_18px_35px_hsl(var(--primary)/0.22)] transition-transform active:scale-95"
              >
                Comenzar sesión
              </button>
            </motion.section>
          )}

          {view === "session" && (
            <motion.section
              key="session"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-1 flex-col items-center justify-between gap-4 overflow-hidden rounded-[3rem] border border-border bg-card/80 px-4 py-6 shadow-[0_20px_60px_hsl(var(--border)/0.42)]"
            >
              <div className="text-center">
                <AnimatePresence mode="wait">
                  <motion.h1
                    key={breathPhases[phase].label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
                    className="font-mindful text-5xl leading-none"
                  >
                    {breathPhases[phase].label}
                  </motion.h1>
                </AnimatePresence>
                <p className="mt-2 font-sans text-sm text-muted-foreground tabular-nums">
                  {String(minutes).padStart(2, "0")}:{String(seconds).padStart(2, "0")}
                </p>
              </div>

              <Mandala phase={phase} running={isRunning} />

              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full rounded-full bg-mindful-orange" animate={{ width: `${progress * 100}%` }} />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => setIsRunning((current) => !current)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_16px_32px_hsl(var(--primary)/0.25)] transition-transform active:scale-95"
                  aria-label={isRunning ? "Pausar" : "Reproducir"}
                >
                  {isRunning ? <Pause size={26} weight="fill" /> : <Play size={26} weight="fill" />}
                </button>
                <button
                  onClick={resetSession}
                  className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition-transform active:scale-95"
                  aria-label="Reiniciar"
                >
                  <ArrowCounterClockwise size={24} />
                </button>
              </div>

              <div className="grid w-full grid-cols-2 gap-2">
                <TogglePill active={voiceEnabled} onClick={() => setVoiceEnabled((current) => !current)} icon={SpeakerHigh} label="Voz de Guía" />
                <TogglePill active={musicEnabled} onClick={() => setMusicEnabled((current) => !current)} icon={MusicNotes} label="Música" />
              </div>
            </motion.section>
          )}

          {view === "summary" && (
            <motion.section
              key="summary"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-1 flex-col justify-center gap-5 text-center"
            >
              <div className="rounded-[3rem] border border-border bg-card px-6 py-9 shadow-[0_20px_55px_hsl(var(--border)/0.5)]">
                <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full bg-mindful-yellow/50">
                  <span className="font-mindful text-5xl">☁</span>
                </div>
                <h1 className="font-mindful text-5xl leading-tight">Presencia plena</h1>
                <p className="mt-3 font-sans text-base text-muted-foreground">Tu mente está un poco más clara</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[2.5rem] border border-border bg-mindful-rose p-5 text-left shadow-sm">
                  <p className="font-sans text-xs font-semibold text-muted-foreground">Racha</p>
                  <p className="mt-2 font-mindful text-3xl">5 días</p>
                </div>
                <div className="rounded-[2.5rem] border border-border bg-mindful-yellow/45 p-5 text-left shadow-sm">
                  <p className="font-sans text-xs font-semibold text-muted-foreground">Puntos Zen</p>
                  <p className="mt-2 font-mindful text-3xl">+150</p>
                </div>
              </div>

              <button
                onClick={close}
                className="mt-4 w-full rounded-[3rem] bg-primary px-8 py-5 font-sans text-base font-bold text-primary-foreground shadow-[0_18px_35px_hsl(var(--primary)/0.22)] transition-transform active:scale-95"
              >
                Cerrar
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
