import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, HelpCircle, Bot, Home, Settings2, Play,
  Moon, Wind, Target, Sparkles, Star, Pause, X, Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ============================================================
   RESMA · Mindfulness — Respiración Consciente (rediseño premium)
   ============================================================ */

type PatternId = "478" | "sigh" | "box" | "coherence";
type Step = "intention" | "setup" | "player";

type Phase = {
  id: "inhale" | "inhale2" | "hold" | "exhale" | "pause";
  label: string;
  seconds: number;
  cue: string;
};

type PatternMeta = {
  id: PatternId;
  title: string;
  short: string;
  description: string;
  pattern: string; // e.g. "Inhalá 4s, Retené 7s, Exhalá 8s"
  Icon: typeof Moon;
  iconBg: string;
  iconColor: string;
  accent: string;
  phases: Phase[];
};

const PATTERNS: PatternMeta[] = [
  {
    id: "478",
    title: "Dormir mejor",
    short: "Patrón 4-7-8",
    description: "Exhalación larga para desactivar el estado de alerta nocturno.",
    pattern: "Inhalá 4s · Retené 7s · Exhalá 8s",
    Icon: Moon,
    iconBg: "bg-[#ECEAFE]",
    iconColor: "text-[#7C5CFF]",
    accent: "#7C5CFF",
    phases: [
      { id: "inhale",  label: "Inhalá",   seconds: 4, cue: "Inhalá profundo por la nariz." },
      { id: "hold",    label: "Sostené",  seconds: 7, cue: "Mantené el aire, dejá reposar tu sistema." },
      { id: "exhale",  label: "Exhalá",   seconds: 8, cue: "Exhalá largo y lento por la boca." },
    ],
  },
  {
    id: "sigh",
    title: "Bajar ansiedad",
    short: "Suspiro Fisiológico",
    description: "Doble inhalación rápida para desinflar el estado de pánico.",
    pattern: "Inhalá 2s · Inhalá+ 1s · Exhalá 6s",
    Icon: Wind,
    iconBg: "bg-[#E0F4F5]",
    iconColor: "text-[#1B8A92]",
    accent: "#7cc2c8",
    phases: [
      { id: "inhale",  label: "Inhalá",       seconds: 2, cue: "Inhalá por la nariz." },
      { id: "inhale2", label: "Inhalá +",     seconds: 1, cue: "Una pizca más de aire." },
      { id: "exhale",  label: "Exhalá largo", seconds: 6, cue: "Exhalá lento por la boca." },
    ],
  },
  {
    id: "box",
    title: "Concentrarme",
    short: "Respiración Cuadrada",
    description: "Box breathing para balancear los gases en sangre y enfocar la mente.",
    pattern: "Inhalá 4s · Sostén 4s · Exhalá 4s · Sostén 4s",
    Icon: Target,
    iconBg: "bg-[#E2F3E6]",
    iconColor: "text-[#1F7A3A]",
    accent: "#1F7A3A",
    phases: [
      { id: "inhale", label: "Inhalá",        seconds: 4, cue: "Inhalá con suavidad." },
      { id: "hold",   label: "Sostené",       seconds: 4, cue: "Sostené sin forzar." },
      { id: "exhale", label: "Exhalá",        seconds: 4, cue: "Exhalá despacio." },
      { id: "pause",  label: "Pausa",         seconds: 4, cue: "Pausa. Quedate ahí." },
    ],
  },
  {
    id: "coherence",
    title: "Equilibrar",
    short: "Coherencia Cardíaca",
    description: "Ritmo 5-5 para sincronizar latidos y emociones.",
    pattern: "Inhalá 5s · Exhalá 5s",
    Icon: Sparkles,
    iconBg: "bg-[#FEF1D6]",
    iconColor: "text-[#C28A12]",
    accent: "#facb60",
    phases: [
      { id: "inhale", label: "Inhalá", seconds: 5, cue: "Sintonizá tu corazón expandiéndolo suavemente." },
      { id: "exhale", label: "Exhalá", seconds: 5, cue: "Soltá, dejá que el latido encuentre su ritmo." },
    ],
  },
];

const FAV_KEY = "resma.mindfulness.favs.v1";
const SESSION_KEY = "resma.mindfulness.session.v1";

function getPattern(id: PatternId): PatternMeta {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

/* ============================================================ */
export default function BreathingHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("intention");
  const [patternId, setPatternId] = useState<PatternId>("478");
  const [minutes, setMinutes] = useState(5);
  const [voice, setVoice] = useState(true);
  const [ambient, setAmbient] = useState(false);

  const [helpOpen, setHelpOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [favs, setFavs] = useState<Record<string, boolean>>(() => {
    try { return JSON.parse(localStorage.getItem(FAV_KEY) || "{}"); } catch { return {}; }
  });

  // Hide global BottomNav while in this premium shell
  useEffect(() => {
    document.body.classList.add("zen-mode");
    return () => document.body.classList.remove("zen-mode");
  }, []);

  // Pre-cargar desde URL si viene de Home/Recomendado
  useEffect(() => {
    const intent = searchParams.get("intention");
    if (intent) {
      const map: Record<string, PatternId> = {
        sleep: "478", dormir: "478",
        anxiety: "sigh", ansiedad: "sigh",
        focus: "box", concentracion: "box",
        balance: "coherence", equilibrar: "coherence",
      };
      const pid = map[intent.toLowerCase()];
      if (pid) { setPatternId(pid); setStep("setup"); }
    }
    const m = parseInt(searchParams.get("minutes") ?? "", 10);
    if (Number.isFinite(m) && m >= 1 && m <= 20) setMinutes(m);
  }, [searchParams]);

  useEffect(() => {
    try { localStorage.setItem(FAV_KEY, JSON.stringify(favs)); } catch {}
  }, [favs]);

  const pattern = getPattern(patternId);

  const close = () => navigate("/herramientas");

  const toggleFav = (id: PatternId) =>
    setFavs((f) => ({ ...f, [id]: !f[id] }));

  const onFinishSession = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from("exercise_sessions").insert({
          user_id: user.id,
          exercise_type: "mindfulness",
          exercise_name: pattern.title,
          duration_seconds: minutes * 60,
        } as never);
      }
    } catch (e) { console.warn("[Mindfulness] persist failed", e); }
    toast.success("Sesión completada. Buen trabajo.");
    setStep("intention");
  };

  // ---- Modo inmersivo: ocupa toda la pantalla ----
  if (step === "player") {
    return (
      <>
        <ImmersivePlayer
          pattern={pattern}
          minutes={minutes}
          voice={voice}
          ambient={ambient}
          onBack={() => setStep("setup")}
          onHelp={() => setHelpOpen(true)}
          onStop={() => setStep("setup")}
          onFinish={onFinishSession}
        />
        <AnimatePresence>
          {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
        </AnimatePresence>
      </>
    );
  }

  return (
    <div className="relative min-h-screen w-full bg-[#f9f9fb]">
      {/* Mobile blinded shell */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col overflow-hidden md:my-6 md:min-h-0 md:h-[90vh] md:max-h-[820px] md:rounded-[36px] md:shadow-2xl"
           style={{ background: "linear-gradient(170deg,#f9f9fb 0%,#eef2f1 100%)" }}>

        {/* Atmospheric orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle,#7cc2c8 0%,transparent 70%)", filter: "blur(48px)", animation: "orb-float 14s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle,#facb60 0%,transparent 70%)", filter: "blur(56px)", animation: "orb-float-2 16s ease-in-out infinite" }}
        />

        <Header
          step={step}
          onBack={() => {
            if (step === "setup") setStep("intention");
            else close();
          }}
          onHelp={() => setHelpOpen(true)}
        />

        <div className="relative flex-1 overflow-y-auto no-scrollbar pb-28 px-5 smooth-scroll">
          <AnimatePresence mode="wait">
            <motion.div
              key={step + patternId}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {step === "intention" && (
                <IntentionScreen
                  favs={favs}
                  onToggleFav={toggleFav}
                  onPick={(pid) => { setPatternId(pid); setStep("setup"); }}
                />
              )}
              {step === "setup" && (
                <SetupScreen
                  pattern={pattern}
                  minutes={minutes}
                  setMinutes={setMinutes}
                  voice={voice}
                  setVoice={setVoice}
                  ambient={ambient}
                  setAmbient={setAmbient}
                  onStart={() => setStep("player")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Floating AI bot */}
        <button
          onClick={() => setAiOpen(true)}
          aria-label="Guía de respiración IA"
          className="absolute bottom-24 right-4 h-12 w-12 rounded-full bg-[#7cc2c8] text-white shadow-lg flex items-center justify-center active:scale-95 transition z-30"
          style={{ boxShadow: "0 10px 30px rgba(124,194,200,0.45)" }}
        >
          <Bot size={20} />
        </button>

        {/* Mini-navbar 3 botones */}
        <ModuleNav step={step} setStep={setStep} hasSelection />

        <AnimatePresence>
          {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
          {aiOpen && <AiDrawer onClose={() => setAiOpen(false)} pattern={pattern} step={step} />}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ============================================================
   Header & Module Nav
   ============================================================ */
function Header({ step, onBack, onHelp }: { step: Step; onBack: () => void; onHelp: () => void }) {
  return (
    <div className="relative px-5 pt-5 pb-3 flex items-center justify-between z-20">
      <button
        onClick={onBack}
        className="h-10 w-10 rounded-2xl bg-white/80 backdrop-blur-md border border-white/70 flex items-center justify-center text-[#101927] active:scale-95"
        aria-label="Atrás"
      >
        <ChevronLeft size={18} />
      </button>
      <div className="text-center">
        <div className="text-[10px] tracking-[0.28em] font-semibold text-[#101927]/45 uppercase">
          Mindfulness
        </div>
        <div className="text-[15px] font-semibold text-[#101927] mt-0.5 tracking-wide">RESMA</div>
      </div>
      <button
        onClick={onHelp}
        className="h-10 w-10 rounded-full bg-white/85 backdrop-blur-md border border-white/70 flex items-center justify-center text-[#7cc2c8] active:scale-95"
        aria-label="Psicoeducación"
      >
        <HelpCircle size={18} />
      </button>
      {step !== "intention" && (
        <span className="absolute -bottom-1 left-0 right-0 mx-auto text-center text-[9px] tracking-[0.3em] text-[#101927]/35 uppercase">
          {step === "setup" ? "Ajustes" : "En sesión"}
        </span>
      )}
    </div>
  );
}

function ModuleNav({ step, setStep, hasSelection }: { step: Step; setStep: (s: Step) => void; hasSelection: boolean }) {
  const items: { id: Step; label: string; Icon: typeof Home }[] = [
    { id: "intention", label: "Inicio",   Icon: Home },
    { id: "setup",     label: "Ajustes",  Icon: Settings2 },
    { id: "player",    label: "Práctica", Icon: Play },
  ];
  return (
    <div className="absolute bottom-3 left-3 right-3 z-20">
      <div className="rounded-[26px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_rgba(16,25,39,0.10)] px-2.5 py-2 flex items-center justify-around">
        {items.map(({ id, label, Icon }) => {
          const active = step === id;
          const disabled = id !== "intention" && !hasSelection;
          return (
            <button
              key={id}
              disabled={disabled}
              onClick={() => setStep(id)}
              className={`flex-1 h-11 mx-0.5 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${
                active ? "bg-[#101927] text-white" : "text-[#101927]/60 hover:text-[#101927]"
              } disabled:opacity-30`}
            >
              <Icon size={16} />
              <span className="text-[9.5px] font-semibold tracking-wide">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ============================================================
   Pantalla 1 · Intención
   ============================================================ */
function IntentionScreen({
  favs, onToggleFav, onPick,
}: {
  favs: Record<string, boolean>;
  onToggleFav: (id: PatternId) => void;
  onPick: (id: PatternId) => void;
}) {
  return (
    <div className="pt-2">
      <div className="text-center mt-2">
        <h1 className="font-serifElegant text-[26px] leading-tight text-[#101927]">¿Qué necesitás ahora?</h1>
        <p className="text-[12.5px] text-[#101927]/55 mt-1.5 px-4">
          Elegí una intención y te sugerimos el patrón adecuado.
        </p>
      </div>
      <div className="mt-5 grid grid-cols-2 gap-3">
        {PATTERNS.map((p) => (
          <PatternCard
            key={p.id}
            p={p}
            fav={!!favs[p.id]}
            onToggleFav={() => onToggleFav(p.id)}
            onPick={() => onPick(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function PatternCard({
  p, fav, onToggleFav, onPick,
}: { p: PatternMeta; fav: boolean; onToggleFav: () => void; onPick: () => void }) {
  const { Icon } = p;
  return (
    <button
      onClick={onPick}
      className="relative text-left rounded-3xl p-4 bg-white border border-[#101927]/5 shadow-[0_6px_20px_-10px_rgba(16,25,39,0.18)] active:scale-[0.98] transition"
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onToggleFav(); } }}
        className="absolute top-3 right-3 text-[#7cc2c8]"
        aria-label="Marcar favorito"
      >
        <Star size={16} fill={fav ? "#7cc2c8" : "transparent"} strokeWidth={1.8} />
      </span>
      <div className={`h-12 w-12 rounded-full ${p.iconBg} flex items-center justify-center`}>
        <Icon size={22} className={p.iconColor} />
      </div>
      <div className="mt-3 font-semibold text-[15px] text-[#101927] leading-tight">{p.title}</div>
      <div className="text-[11.5px] text-[#101927]/55 mt-1 leading-snug line-clamp-2">{p.description}</div>
      <div className="text-[10px] uppercase tracking-[0.16em] text-[#101927]/40 font-semibold mt-2">{p.short}</div>
    </button>
  );
}

/* ============================================================
   Pantalla 2 · Ajuste de sesión
   ============================================================ */
function SetupScreen({
  pattern, minutes, setMinutes, voice, setVoice, ambient, setAmbient, onStart,
}: {
  pattern: PatternMeta;
  minutes: number; setMinutes: (n: number) => void;
  voice: boolean; setVoice: (b: boolean) => void;
  ambient: boolean; setAmbient: (b: boolean) => void;
  onStart: () => void;
}) {
  const { Icon } = pattern;
  const marks = [1, 5, 10, 15, 20];
  return (
    <div className="pt-2">
      <h1 className="text-center font-serifElegant text-[24px] text-[#101927] mt-3">¿Cuánto tiempo tenés?</h1>

      {/* Resumen ejercicio */}
      <div className="mt-5 rounded-[20px] bg-white/70 backdrop-blur-xl border border-white/70 p-3.5 flex items-center gap-3 shadow-sm">
        <div className={`h-12 w-12 rounded-2xl ${pattern.iconBg} flex items-center justify-center`}>
          <Icon size={20} className={pattern.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-[14px] text-[#101927]">{pattern.title}</div>
          <div className="text-[11px] text-[#101927]/55 truncate">{pattern.pattern}</div>
        </div>
      </div>

      {/* Slider */}
      <div className="mt-4 rounded-[20px] bg-white/70 backdrop-blur-xl border border-white/70 p-4 shadow-sm">
        <div className="flex items-end justify-between">
          <div className="text-[10px] tracking-[0.2em] uppercase text-[#101927]/50 font-semibold">Tiempo de práctica</div>
          <div className="text-[22px] font-bold text-[#101927]">{minutes} <span className="text-[13px] font-medium text-[#101927]/55">Minutos</span></div>
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={minutes}
          onChange={(e) => setMinutes(parseInt(e.target.value, 10))}
          className="resma-slider mt-3 w-full"
          style={{ accentColor: "#7cc2c8" }}
        />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-[#101927]/40">
          {marks.map((m) => <span key={m}>{m} M</span>)}
        </div>
      </div>

      {/* Toggles */}
      <div className="mt-4 rounded-[20px] bg-white/70 backdrop-blur-xl border border-white/70 p-1 shadow-sm divide-y divide-[#101927]/5">
        <ToggleRow
          title="Activar Voz de Guía"
          sub="Indicaciones sutiles para inspirar y exhalar"
          value={voice}
          onChange={setVoice}
        />
        <ToggleRow
          title="Sonido de Fondo (Ambiente)"
          sub="Lluvia tenue para aislar el entorno"
          value={ambient}
          onChange={setAmbient}
        />
      </div>

      {/* CTA */}
      <button
        onClick={onStart}
        className="mt-5 w-full h-13 py-3.5 rounded-2xl bg-[#101927] text-white font-semibold text-[14.5px] flex items-center justify-center gap-2 active:scale-[0.98] transition shadow-[0_14px_30px_-12px_rgba(16,25,39,0.45)]"
      >
        Comenzar práctica <ChevronRight size={18} />
      </button>
    </div>
  );
}

function ToggleRow({ title, sub, value, onChange }: { title: string; sub: string; value: boolean; onChange: (b: boolean) => void }) {
  return (
    <div className="flex items-center justify-between p-3.5">
      <div className="pr-3">
        <div className="text-[13.5px] font-semibold text-[#101927]">{title}</div>
        <div className="text-[11px] text-[#101927]/55 mt-0.5">{sub}</div>
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`relative w-12 h-7 rounded-full transition ${value ? "bg-[#7cc2c8]" : "bg-[#101927]/15"}`}
        aria-pressed={value}
      >
        <span
          className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
          style={{ left: value ? "22px" : "2px" }}
        />
      </button>
    </div>
  );
}

/* ============================================================
   Pantalla 3 · Reproductor Inmersivo (full-screen)
   ============================================================ */
const PATTERN_BG: Record<PatternId, string> = {
  "478":       "linear-gradient(180deg,#0c1530 0%,#162447 100%)",
  "sigh":      "linear-gradient(180deg,#0b2a2c 0%,#14545a 100%)",
  "box":       "linear-gradient(180deg,#0e2418 0%,#1F3B26 100%)",
  "coherence": "linear-gradient(180deg,#2b1d05 0%,#4a3210 100%)",
};
const PATTERN_TEXT_ACCENT: Record<PatternId, string> = {
  "478":       "#A7D8A3",
  "sigh":      "#7CC2C8",
  "box":       "#7FCB8E",
  "coherence": "#F5C56A",
};

const ELEVENLABS_VOICE_ID = "9rvdnhrYoXoUt4igKpBw"; // Nadia (Argentina)

function ImmersivePlayer({
  pattern, minutes, voice, onBack, onHelp, onStop, onFinish,
}: {
  pattern: PatternMeta; minutes: number; voice: boolean; ambient: boolean;
  onBack: () => void; onHelp: () => void; onStop: () => void; onFinish: () => void;
}) {
  const cycle = useBreathingCycle(pattern, minutes * 60, onFinish);
  const phase = pattern.phases[cycle.phaseIdx];
  const accent = PATTERN_TEXT_ACCENT[pattern.id];
  const secondsLeftInPhase = Math.max(1, Math.ceil(phase.seconds - cycle.phaseElapsed));

  // ----- ElevenLabs cue audio -----
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const cacheRef = useRef<Map<string, string>>(new Map());

  const speakCue = async (text: string) => {
    try {
      let url = cacheRef.current.get(text);
      if (!url) {
        const { data, error } = await supabase.functions.invoke("mindfulness-tts", {
          body: { text, voiceId: ELEVENLABS_VOICE_ID, speed: 0.9 },
        });
        if (error) throw error;
        let blob: Blob;
        if (data instanceof Blob) blob = data;
        else if (data instanceof ArrayBuffer) blob = new Blob([data], { type: "audio/mpeg" });
        else throw new Error("Unexpected TTS payload");
        url = URL.createObjectURL(blob);
        cacheRef.current.set(text, url);
      }
      if (!audioRef.current) audioRef.current = new Audio();
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current.play().catch(() => {});
    } catch (e) {
      console.warn("[mindfulness] ElevenLabs fallback", e);
      if ("speechSynthesis" in window) {
        const u = new SpeechSynthesisUtterance(text);
        u.lang = "es-AR"; u.rate = 0.9; u.pitch = 1.02;
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(u);
      }
    }
  };

  // Pre-cache all phase cues on mount for snappy first playback
  useEffect(() => {
    if (!voice) return;
    pattern.phases.forEach((p) => {
      if (!cacheRef.current.has(p.cue)) {
        supabase.functions
          .invoke("mindfulness-tts", { body: { text: p.cue, voiceId: ELEVENLABS_VOICE_ID, speed: 0.9 } })
          .then(({ data, error }) => {
            if (error || !data) return;
            const blob = data instanceof Blob ? data : new Blob([data as ArrayBuffer], { type: "audio/mpeg" });
            cacheRef.current.set(p.cue, URL.createObjectURL(blob));
          })
          .catch(() => {});
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.id, voice]);

  // Speak cue when the phase changes
  useEffect(() => {
    if (!voice || cycle.paused) return;
    speakCue(phase.cue);
    return () => { audioRef.current?.pause(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase.cue, voice, cycle.paused]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      audioRef.current?.pause();
      cacheRef.current.forEach((u) => URL.revokeObjectURL(u));
      cacheRef.current.clear();
      if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    };
  }, []);

  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{ background: PATTERN_BG[pattern.id] }}
    >
      {/* Capa 0: animación fondo */}
      <div className="absolute inset-0">
        {pattern.id === "478"       && <VisualizerSleep phase={phase} progress={cycle.phaseProgress} />}
        {pattern.id === "sigh"      && <VisualizerSigh phase={phase} progress={cycle.phaseProgress} />}
        {pattern.id === "box"       && <VisualizerBox phase={phase} progress={cycle.phaseProgress} />}
        {pattern.id === "coherence" && <VisualizerCoherence phase={phase} progress={cycle.phaseProgress} />}
      </div>

      {/* Capa 1: UI superpuesta */}
      <div className="relative z-10 flex flex-col min-h-screen justify-between p-5 pt-[max(env(safe-area-inset-top),1rem)] pb-[max(env(safe-area-inset-bottom),1.25rem)]">

        {/* Header */}
        <div className="flex items-start justify-between">
          <button
            onClick={onBack}
            aria-label="Volver"
            className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 flex items-center justify-center active:scale-95"
          >
            <ChevronLeft size={20} />
          </button>

          <div className="flex flex-col items-center gap-1.5 pt-1">
            <span className="text-[10px] uppercase tracking-[0.22em] text-white/50 font-semibold">
              {pattern.title}
            </span>
            <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white font-semibold text-[15px] tabular-nums">
              {formatTime(cycle.remaining)}
            </span>
          </div>

          <button
            onClick={onHelp}
            aria-label="Ayuda"
            className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 flex items-center justify-center active:scale-95"
          >
            <HelpCircle size={20} />
          </button>
        </div>

        {/* Centro libre */}
        <div className="flex-1" />

        {/* Bloque inferior: instrucción + contador + cue + controles */}
        <div className="flex flex-col items-center text-center gap-4">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase.id + cycle.phaseIdx}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.4 }}
              className="flex flex-col items-center gap-2"
            >
              <div
                className="text-5xl font-light uppercase tracking-[0.08em]"
                style={{ color: accent }}
              >
                {phase.label}
              </div>
              <div className="text-6xl font-light text-white/90 tabular-nums leading-none">
                {secondsLeftInPhase}
              </div>
              {voice && (
                <p className="text-sm italic text-white/70 px-6 max-w-[320px]">{phase.cue}</p>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="mt-2 flex items-center justify-center gap-3">
            <button
              onClick={cycle.toggle}
              className="px-5 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[13px] flex items-center gap-1.5 active:scale-95"
            >
              {cycle.paused ? <><Play size={14} /> Reanudar</> : <><Pause size={14} /> Pausar</>}
            </button>
            <button
              onClick={onStop}
              className="px-5 h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white font-semibold text-[13px] flex items-center gap-1.5 active:scale-95"
            >
              <X size={14} /> Detener
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = Math.max(0, Math.floor(s % 60));
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/* ============================================================
   Hook · ciclo de respiración
   ============================================================ */
function useBreathingCycle(pattern: PatternMeta, totalSeconds: number, onFinish: () => void) {
  const [paused, setPaused] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [phaseElapsed, setPhaseElapsed] = useState(0);
  const [remaining, setRemaining] = useState(totalSeconds);
  const rafRef = useRef<number | null>(null);
  const lastTickRef = useRef<number>(performance.now());
  const finishedRef = useRef(false);

  useEffect(() => {
    setPhaseIdx(0); setPhaseElapsed(0); setRemaining(totalSeconds); finishedRef.current = false;
  }, [pattern.id, totalSeconds]);

  useEffect(() => {
    function tick(now: number) {
      const dt = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      if (!paused) {
        setPhaseElapsed((pe) => {
          const np = pe + dt;
          const cur = pattern.phases[phaseIdx];
          if (np >= cur.seconds) {
            const next = (phaseIdx + 1) % pattern.phases.length;
            setPhaseIdx(next);
            return 0;
          }
          return np;
        });
        setRemaining((r) => {
          const nr = r - dt;
          if (nr <= 0 && !finishedRef.current) {
            finishedRef.current = true;
            queueMicrotask(onFinish);
            return 0;
          }
          return nr;
        });
      }
      rafRef.current = requestAnimationFrame(tick);
    }
    lastTickRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [paused, phaseIdx, pattern, onFinish]);

  const cur = pattern.phases[phaseIdx];
  const phaseProgress = Math.min(1, phaseElapsed / cur.seconds);

  return {
    paused, toggle: () => setPaused((p) => !p),
    phaseIdx, phaseElapsed, phaseProgress, remaining: Math.max(0, remaining),
  };
}

/* ============================================================
   Visualizadores
   ============================================================ */
function VisualizerSleep({ phase, progress }: { phase: Phase; progress: number }) {
  // Pulsing orb + slow-floating star particles
  const scale = phase.id === "inhale" ? 0.75 + progress * 0.4
              : phase.id === "exhale" ? 1.15 - progress * 0.45
              : 1.15;
  const stars = useMemo(
    () => Array.from({ length: 14 }, (_, i) => ({
      id: i,
      left: (i * 73) % 100,
      delay: (i * 1.3) % 8,
      size: 1.2 + ((i * 7) % 3) * 0.6,
      dur: 14 + ((i * 5) % 8),
    })),
    []
  );
  return (
    <div className="absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full bg-white/80"
          style={{
            left: `${s.left}%`,
            bottom: "-10%",
            width: s.size,
            height: s.size,
            filter: "blur(0.4px)",
            animation: `star-rise ${s.dur}s linear ${s.delay}s infinite`,
          }}
        />
      ))}
      <div className="absolute inset-0 flex items-center justify-center">
        <motion.div
          animate={{ scale }}
          transition={{ duration: 0.6, ease: "easeInOut" }}
          className="h-44 w-44 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(167,216,163,0.55) 0%, rgba(124,194,200,0.18) 55%, transparent 75%)",
            boxShadow: "0 0 60px rgba(124,194,200,0.4)",
          }}
        />
      </div>
      <style>{`@keyframes star-rise{0%{transform:translateY(0);opacity:0}10%{opacity:1}90%{opacity:1}100%{transform:translateY(-380px);opacity:0}}`}</style>
    </div>
  );
}

function VisualizerSigh({ phase, progress }: { phase: Phase; progress: number }) {
  // Sine wave + sliding ball; 0..1 across the curve depending on phase
  const totalDur = 9; // 2+1+6
  const tStart = phase.id === "inhale" ? 0 : phase.id === "inhale2" ? 2 / totalDur : 3 / totalDur;
  const tEnd   = phase.id === "inhale" ? 2 / totalDur : phase.id === "inhale2" ? 3 / totalDur : 1;
  const t = tStart + (tEnd - tStart) * progress;

  const W = 320, H = 180, padX = 16;
  const x = padX + t * (W - 2 * padX);
  // y: rises through first 1/3, micro jump, then long descent
  const yFor = (tt: number) => {
    if (tt < 2 / totalDur) {
      const k = tt / (2 / totalDur);
      return H - 30 - k * 70;
    }
    if (tt < 3 / totalDur) {
      const k = (tt - 2 / totalDur) / (1 / totalDur);
      return H - 100 - k * 40;
    }
    const k = (tt - 3 / totalDur) / (6 / totalDur);
    return H - 140 + k * 110;
  };
  const y = yFor(t);
  const pathD = useMemo(() => {
    let d = `M ${padX} ${yFor(0)}`;
    const steps = 80;
    for (let i = 1; i <= steps; i++) {
      const tt = i / steps;
      const xx = padX + tt * (W - 2 * padX);
      d += ` L ${xx.toFixed(1)} ${yFor(tt).toFixed(1)}`;
    }
    return d;
  }, []);

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-[88%] h-[80%]">
        <defs>
          <linearGradient id="sighStroke" x1="0" x2="1">
            <stop offset="0" stopColor="#7cc2c8" stopOpacity="0.25" />
            <stop offset="1" stopColor="#7cc2c8" stopOpacity="0.9" />
          </linearGradient>
          <radialGradient id="sighBall">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#7cc2c8" />
          </radialGradient>
        </defs>
        <path d={pathD} fill="none" stroke="url(#sighStroke)" strokeWidth={2.5} strokeLinecap="round" />
        <circle cx={x} cy={y} r={9} fill="url(#sighBall)" style={{ filter: "drop-shadow(0 4px 14px rgba(124,194,200,0.6))" }} />
      </svg>
    </div>
  );
}

function VisualizerBox({ phase, progress }: { phase: Phase; progress: number }) {
  const S = 200, X = 60, Y = 40;
  // Side mapping: inhale=top, hold=right, exhale=bottom, pause=left
  const sideMap: Record<string, number> = { inhale: 0, hold: 1, exhale: 2, pause: 3 };
  const side = sideMap[phase.id] ?? 0;
  let cx = X, cy = Y;
  if (side === 0) { cx = X + S * progress;   cy = Y; }
  if (side === 1) { cx = X + S;              cy = Y + S * progress; }
  if (side === 2) { cx = X + S - S * progress; cy = Y + S; }
  if (side === 3) { cx = X;                  cy = Y + S - S * progress; }

  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <svg viewBox={`0 0 ${X * 2 + S} ${Y * 2 + S}`} className="w-[85%] h-[85%]">
        <defs>
          <radialGradient id="boxNode">
            <stop offset="0" stopColor="#fff" />
            <stop offset="1" stopColor="#1F7A3A" />
          </radialGradient>
        </defs>
        <rect x={X} y={Y} width={S} height={S} rx={20} fill="none" stroke="#1F7A3A" strokeOpacity="0.25" strokeWidth={1.5} />
        <rect x={X} y={Y} width={S} height={S} rx={20} fill="none" stroke="#1F7A3A" strokeWidth={2.5}
              strokeDasharray={4 * S}
              strokeDashoffset={(4 - (side + progress)) * S}
              style={{ transition: "stroke-dashoffset 80ms linear" }}
              opacity={0.55}
        />
        <circle cx={cx} cy={cy} r={9} fill="url(#boxNode)" style={{ filter: "drop-shadow(0 4px 14px rgba(31,122,58,0.55))" }} />
      </svg>
    </div>
  );
}

function VisualizerCoherence({ phase, progress }: { phase: Phase; progress: number }) {
  const expand = phase.id === "inhale" ? 0.6 + progress * 0.5 : 1.1 - progress * 0.5;
  const positions = [
    [0, 0],
    [0, -1], [0, 1],
    [-0.87, -0.5], [0.87, -0.5],
    [-0.87, 0.5], [0.87, 0.5],
  ] as const;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      <motion.svg
        viewBox="-100 -100 200 200"
        className="w-[80%] h-[80%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <radialGradient id="cohFill">
            <stop offset="0" stopColor="#facb60" stopOpacity="0.18" />
            <stop offset="1" stopColor="#facb60" stopOpacity="0" />
          </radialGradient>
        </defs>
        {positions.map(([dx, dy], i) => (
          <motion.circle
            key={i}
            cx={dx * 30 * expand}
            cy={dy * 30 * expand}
            r={30 * expand}
            fill="url(#cohFill)"
            stroke="#facb60"
            strokeOpacity={0.55}
            strokeWidth={1}
            initial={false}
            animate={{ cx: dx * 30 * expand, cy: dy * 30 * expand, r: 30 * expand }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
          />
        ))}
      </motion.svg>
    </div>
  );
}

/* ============================================================
   Help modal & AI drawer
   ============================================================ */
function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-[#101927]/40 backdrop-blur-sm flex items-center justify-center px-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 10 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm bg-white rounded-[26px] p-6 shadow-2xl border border-white/70"
      >
        <div className="text-[10px] tracking-[0.3em] text-[#7cc2c8] font-semibold uppercase">Psicoeducación</div>
        <h2 className="font-serifElegant text-[22px] text-[#101927] mt-1.5">¿Por qué respirar así?</h2>
        <div className="mt-3 space-y-2.5 text-[13px] text-[#101927]/75 font-serifElegant leading-relaxed">
          <p>Las exhalaciones prolongadas <em>estimulan el nervio vago</em>, principal mediador del sistema parasimpático, ayudando a desacelerar el ritmo cardíaco.</p>
          <p>Al regular el ritmo respiratorio durante minutos, <em>se modula la actividad de la amígdala</em>, reduciendo la respuesta de alarma y la rumiación.</p>
          <p>La práctica sostenida mejora la variabilidad cardíaca (HRV), un marcador clínico de resiliencia emocional.</p>
        </div>
        <button onClick={onClose}
          className="mt-5 w-full h-11 rounded-2xl bg-[#101927] text-white font-semibold text-[13px] active:scale-[0.98]">
          Entendido
        </button>
      </motion.div>
    </motion.div>
  );
}

function AiDrawer({ onClose, pattern, step }: { onClose: () => void; pattern: PatternMeta; step: Step }) {
  const seed = useMemo(() => [
    { role: "bot", text: `Hola 🌿 soy tu guía de respiración. Veo que estás en ${pattern.title}.` },
    { role: "user", text: step === "player" ? "Me cuesta seguir el ritmo." : "¿Cómo me preparo?" },
    { role: "bot", text: step === "player"
        ? "Está bien si tu respiración no calza exacto. Lo que importa es alargar la exhalación. Acompañá la animación sin forzar."
        : "Sentate cómodo, hombros sueltos, lengua apoyada en el paladar. Iniciá cuando estés listo." },
  ], [pattern.title, step]);
  const [msgs, setMsgs] = useState(seed);
  const [input, setInput] = useState("");

  const send = () => {
    if (!input.trim()) return;
    setMsgs((m) => [...m, { role: "user", text: input }]);
    const u = input;
    setInput("");
    setTimeout(() => {
      setMsgs((m) => [...m, { role: "bot", text: replyFor(u, pattern) }]);
    }, 600);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-40 bg-[#101927]/40 backdrop-blur-sm flex items-end"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 280 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full bg-white rounded-t-[28px] p-4 max-h-[80%] flex flex-col"
      >
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-full bg-[#7cc2c8] text-white flex items-center justify-center"><Bot size={16} /></div>
            <div>
              <div className="text-[13px] font-semibold text-[#101927]">Guía de respiración</div>
              <div className="text-[10px] text-[#101927]/55">Acompañamiento empático</div>
            </div>
          </div>
          <button onClick={onClose} className="h-8 w-8 rounded-full bg-[#101927]/5 flex items-center justify-center text-[#101927]/60"><X size={14} /></button>
        </div>
        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2.5 py-2">
          {msgs.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[78%] text-[13px] leading-snug px-3.5 py-2.5 rounded-2xl ${
                m.role === "user"
                  ? "bg-[#101927] text-white rounded-br-md"
                  : "bg-[#f1f3f5] text-[#101927] rounded-bl-md"
              }`}>{m.text}</div>
            </div>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Contame cómo te sentís…"
            className="flex-1 h-11 px-4 rounded-2xl bg-[#f1f3f5] text-[13px] text-[#101927] focus:outline-none"
          />
          <button onClick={send} className="h-11 w-11 rounded-2xl bg-[#7cc2c8] text-white flex items-center justify-center active:scale-95">
            <Send size={16} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function replyFor(input: string, pattern: PatternMeta): string {
  const t = input.toLowerCase();
  if (t.includes("ansiedad") || t.includes("nervios")) return "Probá alargar la exhalación al doble que la inhalación. Eso baja la activación rápido.";
  if (t.includes("sueñ") || t.includes("dormir"))     return `Para descansar mejor, ${pattern.title === "Dormir mejor" ? "ya estás en el patrón correcto" : "te sugiero probar el patrón 4-7-8"}. Apagá las luces.`;
  if (t.includes("dolor") || t.includes("opresión"))  return "Si sentís opresión, soltá el aire por la boca con un suspiro suave. No retengas si te incomoda.";
  return "Quedate con la sensación del aire entrando y saliendo. No hay que hacer nada perfecto — solo acompañar.";
}
