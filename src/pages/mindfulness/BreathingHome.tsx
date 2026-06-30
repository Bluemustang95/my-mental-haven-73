import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, HelpCircle, Bot, Home, Settings2, Play,
  Moon, Wind, Target, Sparkles, Star, Pause, X, Send,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { speak as speakTTS, stopSpeak, primeAudio, setSpeechVolume } from "@/lib/elevenLabsTTS";
import { useUserVoice } from "@/hooks/useUserVoice";
import { AMBIENT_SOUNDS, getAmbientById } from "@/lib/ambientLibrary";


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
    short: "Onda continua",
    description: "Inhalá 4s, sostené 2s y exhalá lento 6s en ritmo continuo.",
    pattern: "Inhalá 4s · Sostené 2s · Exhalá 6s",
    Icon: Wind,
    iconBg: "bg-[#E0F4F5]",
    iconColor: "text-[#1B8A92]",
    accent: "#7cc2c8",
    phases: [
      { id: "inhale", label: "Inhalá",  seconds: 4, cue: "Inhalá suave por la nariz." },
      { id: "hold",   label: "Sostené", seconds: 2, cue: "Sostené un instante." },
      { id: "exhale", label: "Exhalá",  seconds: 6, cue: "Exhalá lento por la boca." },
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
const DEFAULTS_KEY = "resma.mindfulness.defaults.v1";
const ONBOARDED_KEY = "resma.mindfulness.onboarded.v1";

type Defaults = {
  minutes: number;
  voice: boolean;
  ambient: boolean;
  voiceVolume: number;
  ambientId: string;
  ambientVolume: number;
};
const DEFAULT_VALUES: Defaults = {
  minutes: 5, voice: true, ambient: false,
  voiceVolume: 0.9, ambientId: "rain_soft", ambientVolume: 0.5,
};
function loadDefaults(): Defaults {
  try {
    const raw = localStorage.getItem(DEFAULTS_KEY);
    if (raw) return { ...DEFAULT_VALUES, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_VALUES;
}
function saveDefaults(d: Defaults) {
  try { localStorage.setItem(DEFAULTS_KEY, JSON.stringify(d)); } catch {}
}

function getPattern(id: PatternId): PatternMeta {
  return PATTERNS.find((p) => p.id === id) ?? PATTERNS[0];
}

/* ============================================================ */
export default function BreathingHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState<Step>("intention");
  const [patternId, setPatternId] = useState<PatternId>("478");
  const initialDefaults = useMemo(() => loadDefaults(), []);
  const [minutes, setMinutes] = useState(initialDefaults.minutes);
  const [voice, setVoice] = useState(initialDefaults.voice);
  const [ambient, setAmbient] = useState(initialDefaults.ambient);
  const [voiceVolume, setVoiceVolume] = useState(initialDefaults.voiceVolume);
  const [ambientId, setAmbientId] = useState(initialDefaults.ambientId);
  const [ambientVolume, setAmbientVolume] = useState(initialDefaults.ambientVolume);

  // Persistí los ajustes globales para que la próxima vez sean los defaults.
  useEffect(() => {
    saveDefaults({ minutes, voice, ambient, voiceVolume, ambientId, ambientVolume });
  }, [minutes, voice, ambient, voiceVolume, ambientId, ambientVolume]);

  // True Quick Start: al elegir un ejercicio, arrancar directo al reproductor.
  // Excepción: la primera vez de todas se muestra el setup para que la persona
  // configure sus preferencias por defecto.
  const handlePick = (pid: PatternId) => {
    setPatternId(pid);
    const onboarded = (() => { try { return localStorage.getItem(ONBOARDED_KEY) === "1"; } catch { return false; } })();
    setStep(onboarded ? "player" : "setup");
  };
  const markOnboardedAndPlay = () => {
    try { localStorage.setItem(ONBOARDED_KEY, "1"); } catch {}
    setStep("player");
  };

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
    const player = (
      <>
        <ImmersivePlayer
          pattern={pattern}
          minutes={minutes}
          setMinutes={setMinutes}
          voice={voice}
          ambient={ambient}
          onBack={() => setStep("intention")}
          onHelp={() => setHelpOpen(true)}
          onStop={() => setStep("intention")}
          onFinish={onFinishSession}
        />
        <AnimatePresence>
          {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
        </AnimatePresence>
      </>
    );

    // Importante: AppLayout aplica una animación con `transform` al Outlet.
    // En iOS/Safari eso convierte a los hijos `position: fixed` en relativos
    // al contenedor animado; como el player no tiene contenido en flujo, el
    // overlay quedaba con alto 0 y la pantalla se veía blanca. Portaleamos el
    // reproductor al body para que el fixed sea realmente viewport completo.
    return createPortal(player, document.body);
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
                  onPick={handlePick}
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
                  onStart={markOnboardedAndPlay}
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
    <div className="pt-6">
      <div className="grid grid-cols-2 gap-3">
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

// Per-pattern card fill (semi-transparent tint of the accent)
const CARD_FILL: Record<PatternId, { bg: string; border: string }> = {
  "478":       { bg: "linear-gradient(160deg,#F1EEFF 0%,#E1DBFB 100%)", border: "#C9C0F4" },
  "sigh":      { bg: "linear-gradient(160deg,#E6F6F7 0%,#C7EBEE 100%)", border: "#9FD9DE" },
  "box":       { bg: "linear-gradient(160deg,#E8F5EB 0%,#C8E5CF 100%)", border: "#A4D2B0" },
  "coherence": { bg: "linear-gradient(160deg,#FFF3DA 0%,#FCE3AE 100%)", border: "#F2CE82" },
};

function PatternCard({
  p, fav, onToggleFav, onPick,
}: { p: PatternMeta; fav: boolean; onToggleFav: () => void; onPick: () => void }) {
  const { Icon } = p;
  const fill = CARD_FILL[p.id];
  return (
    <button
      onClick={onPick}
      className="relative text-left rounded-3xl p-5 min-h-[150px] flex flex-col justify-between active:scale-[0.98] transition shadow-[0_8px_24px_-12px_rgba(16,25,39,0.18)]"
      style={{ background: fill.bg, border: `1px solid ${fill.border}` }}
    >
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => { e.stopPropagation(); onToggleFav(); }}
        onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); onToggleFav(); } }}
        className="absolute top-3 right-3 text-[#101927]/55"
        aria-label="Marcar favorito"
      >
        <Star size={16} fill={fav ? "#101927" : "transparent"} strokeWidth={1.8} />
      </span>
      <div className={`h-12 w-12 rounded-full bg-white/70 flex items-center justify-center shadow-sm`}>
        <Icon size={22} className={p.iconColor} />
      </div>
      <div className="mt-4 font-semibold text-[16px] text-[#101927] leading-tight">{p.title}</div>
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
  "sigh":      "linear-gradient(180deg,#0d1f1f 0%,#16302f 60%,#0d1f1f 100%)",
  "box":       "linear-gradient(180deg,#0e2418 0%,#1F3B26 100%)",
  "coherence": "linear-gradient(180deg,#2b1d05 0%,#4a3210 100%)",
};
const PATTERN_TEXT_ACCENT: Record<PatternId, string> = {
  "478":       "#A7D8A3",
  "sigh":      "#7CC2C8",
  "box":       "#7FCB8E",
  "coherence": "#F5C56A",
};



function ImmersivePlayer({
  pattern, minutes, setMinutes, voice: initialVoice, ambient: initialAmbient, onBack, onHelp, onStop, onFinish,
}: {
  pattern: PatternMeta; minutes: number; setMinutes: (m: number) => void; voice: boolean; ambient: boolean;
  onBack: () => void; onHelp: () => void; onStop: () => void; onFinish: () => void;
}) {
  const cycle = useBreathingCycle(pattern, minutes * 60, onFinish);
  const phase = pattern.phases[cycle.phaseIdx];
  const accent = PATTERN_TEXT_ACCENT[pattern.id];
  const secondsLeftInPhase = Math.max(1, Math.ceil(phase.seconds - cycle.phaseElapsed));
  const [timeEditOpen, setTimeEditOpen] = useState(false);

  // Settings live state
  const [voice, setVoice] = useState(initialVoice);
  const [ambientId, setAmbientId] = useState<string>(initialAmbient ? "rain_soft" : "off");
  const [voiceVolume, setVoiceVolume] = useState(0.9);
  const [ambientVolume, setAmbientVolume] = useState(0.5);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const { voiceId } = useUserVoice();

  // Reflect voice volume to TTS player
  useEffect(() => { setSpeechVolume(voiceVolume); }, [voiceVolume]);

  // ----- Ambient audio (WebAudio) -----
  const ctxRef = useRef<AudioContext | null>(null);
  const ambientStopRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    // teardown previous
    ambientStopRef.current?.();
    ambientStopRef.current = null;
    if (ambientId === "off") return;
    try {
      if (!ctxRef.current) {
        ctxRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      }
      const ctx = ctxRef.current;
      if (ctx.state === "suspended") ctx.resume().catch(() => {});
      const sound = getAmbientById(ambientId);
      const handle = sound.build(ctx, ambientVolume);
      ambientStopRef.current = handle.stop;
    } catch (e) {
      console.warn("[mindfulness] ambient failed", e);
    }
    return () => {
      ambientStopRef.current?.();
      ambientStopRef.current = null;
    };
  }, [ambientId, ambientVolume]);

  useEffect(() => {
    return () => {
      ambientStopRef.current?.();
      ctxRef.current?.close().catch(() => {});
      stopSpeak();
    };
  }, []);

  // Speak cue when phase changes (ElevenLabs via shared TTS helper)
  useEffect(() => {
    if (!voice || cycle.paused) return;
    primeAudio();
    setSpeechVolume(voiceVolume);
    speakTTS(phase.cue, voiceId).catch(() => {});
    return () => { stopSpeak(); };
  }, [phase.cue, voice, cycle.paused, voiceId, voiceVolume]);

  return (
    <div
      className="fixed inset-0 z-[9999] overflow-hidden"
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
            <button
              onClick={() => setTimeEditOpen(true)}
              aria-label="Ajustar tiempo de esta sesión"
              className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white font-semibold text-[15px] tabular-nums active:scale-95 transition"
            >
              {formatTime(cycle.remaining)}
            </button>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setSettingsOpen(true)}
              aria-label="Ajustes"
              className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 flex items-center justify-center active:scale-95"
            >
              <Settings2 size={18} />
            </button>
            <button
              onClick={onHelp}
              aria-label="Ayuda"
              className="h-11 w-11 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-white/90 flex items-center justify-center active:scale-95"
            >
              <HelpCircle size={18} />
            </button>
          </div>
        </div>

        {/* Centro libre */}
        <div className="flex-1" />

        {/* Bloque inferior: instrucción + contador + controles */}
        <div className="flex flex-col items-center text-center gap-3">
          <AnimatePresence mode="wait">
            <motion.div
              key={phase.id + cycle.phaseIdx}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="text-2xl font-medium uppercase tracking-[0.18em]"
                style={{ color: accent }}
              >
                {phase.label}
              </div>
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

      {/* Panel de ajustes */}
      <AnimatePresence>
        {settingsOpen && (
          <SessionSettings
            voice={voice}
            setVoice={setVoice}
            voiceVolume={voiceVolume}
            setVoiceVolume={setVoiceVolume}
            ambientId={ambientId}
            setAmbientId={setAmbientId}
            ambientVolume={ambientVolume}
            setAmbientVolume={setAmbientVolume}
            onClose={() => setSettingsOpen(false)}
          />
        )}
        {timeEditOpen && (
          <TimeEditSheet
            initialMinutes={Math.max(1, Math.ceil(cycle.remaining / 60))}
            onClose={() => setTimeEditOpen(false)}
            onApply={(m) => {
              setMinutes(m);
              cycle.setRemaining(m * 60);
              setTimeEditOpen(false);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeEditSheet({
  initialMinutes, onClose, onApply,
}: { initialMinutes: number; onClose: () => void; onApply: (m: number) => void }) {
  const [m, setM] = useState(initialMinutes);
  return (
    <motion.div
      className="absolute inset-0 z-30 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="w-full max-w-md rounded-t-3xl bg-[#101927] border-t border-white/10 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
        <h3 className="text-white text-[15px] font-semibold">Tiempo restante</h3>
        <p className="text-white/55 text-[11px] mt-0.5">Modificá los minutos sin interrumpir tu práctica.</p>

        <div className="mt-4 flex items-end justify-between">
          <span className="text-white/55 text-[10px] uppercase tracking-[0.18em] font-semibold">Duración</span>
          <div className="text-white text-[26px] font-bold tabular-nums">{m} <span className="text-[13px] font-medium text-white/55">min</span></div>
        </div>
        <input
          type="range" min={1} max={30} value={m}
          onChange={(e) => setM(parseInt(e.target.value, 10))}
          className="resma-slider mt-3 w-full"
          style={{ accentColor: "#7cc2c8" }}
        />
        <div className="mt-1 flex justify-between text-[10px] font-semibold text-white/40">
          {[1, 5, 10, 15, 20, 30].map((v) => <span key={v}>{v}m</span>)}
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-full bg-white/10 border border-white/15 text-white font-semibold text-[13.5px] active:scale-[0.98]"
          >
            Cancelar
          </button>
          <button
            onClick={() => onApply(m)}
            className="flex-1 h-11 rounded-full bg-[#7cc2c8] text-[#101927] font-semibold text-[13.5px] active:scale-[0.98]"
          >
            Aplicar
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function SessionSettings({
  voice, setVoice, voiceVolume, setVoiceVolume,
  ambientId, setAmbientId, ambientVolume, setAmbientVolume, onClose,
}: {
  voice: boolean; setVoice: (b: boolean) => void;
  voiceVolume: number; setVoiceVolume: (v: number) => void;
  ambientId: string; setAmbientId: (id: string) => void;
  ambientVolume: number; setAmbientVolume: (v: number) => void;
  onClose: () => void;
}) {
  const ambientOptions = AMBIENT_SOUNDS.filter((s) =>
    ["off", "rain_soft", "forest_dawn", "waves_soft", "crickets_night", "campfire", "white_noise", "drone_pad"].includes(s.id)
  );
  return (
    <motion.div
      className="absolute inset-0 z-20 flex items-end justify-center bg-black/40 backdrop-blur-sm"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ y: 60 }} animate={{ y: 0 }} exit={{ y: 60 }}
        transition={{ type: "spring", damping: 22, stiffness: 220 }}
        className="w-full max-w-md rounded-t-3xl bg-[#101927] border-t border-white/10 p-5 pb-[max(env(safe-area-inset-bottom),1.25rem)]"
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
        <h3 className="text-white text-[15px] font-semibold mb-4">Ajustes de la práctica</h3>

        {/* Voice toggle + volume */}
        <div className="py-3 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white text-[13.5px] font-semibold">Voz de Guía</div>
              <div className="text-white/55 text-[11px]">Indicaciones para cada fase</div>
            </div>
            <button
              onClick={() => setVoice(!voice)}
              className={`relative w-12 h-7 rounded-full transition ${voice ? "bg-[#7cc2c8]" : "bg-white/15"}`}
              aria-pressed={voice}
            >
              <span className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition-all"
                    style={{ left: voice ? "22px" : "2px" }} />
            </button>
          </div>
          <div className={`mt-3 flex items-center gap-3 transition-opacity ${voice ? "opacity-100" : "opacity-40"}`}>
            <span className="text-white/60 text-[10px] uppercase tracking-[0.18em] font-semibold w-14">Volumen</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={voiceVolume}
              onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
              disabled={!voice}
              className="resma-slider flex-1"
              style={{ accentColor: "#7cc2c8" }}
            />
            <span className="text-white/70 text-[11px] tabular-nums w-8 text-right">{Math.round(voiceVolume * 100)}</span>
          </div>
        </div>

        {/* Ambient dropdown + volume */}
        <div className="mt-4">
          <div className="text-white/70 text-[11px] uppercase tracking-[0.18em] font-semibold mb-2">Sonido de fondo</div>
          <div className="relative">
            <select
              value={ambientId}
              onChange={(e) => setAmbientId(e.target.value)}
              className="w-full h-11 px-4 pr-10 rounded-2xl bg-white/5 border border-white/15 text-white text-[13.5px] font-medium appearance-none focus:outline-none focus:border-[#7cc2c8]"
            >
              {ambientOptions.map((s) => (
                <option key={s.id} value={s.id} className="bg-[#101927] text-white">
                  {s.label}
                </option>
              ))}
            </select>
            <ChevronRight size={16} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-white/60 pointer-events-none" />
          </div>
          <div className={`mt-3 flex items-center gap-3 transition-opacity ${ambientId !== "off" ? "opacity-100" : "opacity-40"}`}>
            <span className="text-white/60 text-[10px] uppercase tracking-[0.18em] font-semibold w-14">Volumen</span>
            <input
              type="range" min={0} max={1} step={0.05}
              value={ambientVolume}
              onChange={(e) => setAmbientVolume(parseFloat(e.target.value))}
              disabled={ambientId === "off"}
              className="resma-slider flex-1"
              style={{ accentColor: "#7cc2c8" }}
            />
            <span className="text-white/70 text-[11px] tabular-nums w-8 text-right">{Math.round(ambientVolume * 100)}</span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full h-11 rounded-full bg-white text-[#101927] font-semibold text-[13.5px] active:scale-[0.98]"
        >
          Listo
        </button>
      </motion.div>
    </motion.div>
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
    // Solo reseteo cuando cambia el patrón; el cambio de duración se aplica vía setRemaining.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pattern.id]);

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
    setRemaining: (s: number) => { finishedRef.current = false; setRemaining(Math.max(1, s)); },
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
  // Curva única tipo campana (gaussiana modulada) que respira con la bola.
  // La bola es SIEMPRE un círculo (r constante). El halo es un radialGradient
  // cuyo radio escalar cambia — nunca se deforma.
  const W = 340;
  const H = 280;
  const CX = W / 2;
  const BASE_Y = 180;
  const REST_AMP = 60;
  const PEAK_AMP = 100;
  const REST_Y = BASE_Y - REST_AMP;
  const PEAK_Y = BASE_Y - PEAK_AMP;
  const BALL_RADIUS = 9;
  const GLOW_RADIUS_MIN = 28;
  const GLOW_RADIUS_RANGE = 0.15;

  const easeInOutSine = (t: number) =>
    -(Math.cos(Math.PI * Math.min(1, Math.max(0, t))) - 1) / 2;

  let amplitude = REST_AMP;
  let ballY = REST_Y;
  if (phase.id === "inhale") {
    const e = easeInOutSine(progress);
    amplitude = REST_AMP + (PEAK_AMP - REST_AMP) * e;
    ballY = REST_Y + (PEAK_Y - REST_Y) * e;
  } else if (phase.id === "hold") {
    amplitude = PEAK_AMP;
    ballY = PEAK_Y;
  } else if (phase.id === "exhale") {
    const e = easeInOutSine(progress);
    amplitude = PEAK_AMP - (PEAK_AMP - REST_AMP) * e;
    ballY = PEAK_Y + (REST_Y - PEAK_Y) * e;
  }
  const glowRadius = GLOW_RADIUS_MIN + (amplitude - REST_AMP) * GLOW_RADIUS_RANGE;

  const { wave, fill } = useMemo(() => {
    const halfW = W * 0.62;
    const left = CX - halfW;
    const right = CX + halfW;
    const steps = 60;
    const pts: [number, number][] = [];
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = left + (right - left) * t;
      const bell = Math.exp(-Math.pow((t - 0.5) * 2.6, 2));
      const y = BASE_Y - amplitude * bell;
      pts.push([x, y]);
    }
    let w = `M ${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      w += ` L ${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)}`;
    }
    const f = `${w} L ${pts[pts.length - 1][0].toFixed(1)} ${H} L ${pts[0][0].toFixed(1)} ${H} Z`;
    return { wave: w, fill: f };
  }, [amplitude]);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid slice"
        style={{ width: "100%", height: "100%", display: "block" }}
        role="img"
        aria-label="Animación de respiración guiada"
      >
        <defs>
          <linearGradient id="sigh-fade-mask" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity={0} />
            <stop offset="15%" stopColor="white" stopOpacity={1} />
            <stop offset="85%" stopColor="white" stopOpacity={1} />
            <stop offset="100%" stopColor="white" stopOpacity={0} />
          </linearGradient>
          <mask id="sigh-edge-fade">
            <rect x={0} y={0} width={W} height={H} fill="url(#sigh-fade-mask)" />
          </mask>
          <radialGradient id="sigh-ball-glow">
            <stop offset="0%" stopColor="#9fe0e0" stopOpacity={0.55} />
            <stop offset="100%" stopColor="#9fe0e0" stopOpacity={0} />
          </radialGradient>
          <linearGradient id="sigh-fill-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#7cc2c8" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#7cc2c8" stopOpacity={0} />
          </linearGradient>
        </defs>

        <g mask="url(#sigh-edge-fade)">
          <path d={fill} fill="url(#sigh-fill-grad)" />
          <path d={wave} fill="none" stroke="#7cc2c8" strokeWidth={1.8} strokeLinecap="round" />
        </g>

        <circle cx={CX} cy={ballY} r={glowRadius} fill="url(#sigh-ball-glow)" />
        <circle cx={CX} cy={ballY} r={BALL_RADIUS} fill="#cdeeee" />
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
  // Smooth ease so inhale↔exhale transition is continuous
  const eased = 0.5 - Math.cos(Math.PI * progress) / 2;
  const expand = phase.id === "inhale" ? 0.65 + eased * 0.5 : 1.15 - eased * 0.5;
  const positions = [
    [0, -1], [0, 1],
    [-0.87, -0.5], [0.87, -0.5],
    [-0.87, 0.5], [0.87, 0.5],
  ] as const;
  return (
    <div className="absolute inset-0 flex items-center justify-center">
      {/* Soft radial halo behind everything */}
      <div
        className="absolute"
        style={{
          width: `${260 * expand}px`,
          height: `${260 * expand}px`,
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(250,203,96,0.35) 0%, rgba(250,203,96,0.12) 40%, rgba(250,203,96,0) 70%)",
          filter: "blur(8px)",
          transition: "width 200ms linear, height 200ms linear",
        }}
      />
      <motion.svg
        viewBox="-100 -100 200 200"
        className="relative w-[85%] h-[85%]"
        animate={{ rotate: 360 }}
        transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
      >
        <defs>
          <radialGradient id="cohFill">
            <stop offset="0" stopColor="#fff5d8" stopOpacity="0.55" />
            <stop offset="0.6" stopColor="#facb60" stopOpacity="0.25" />
            <stop offset="1" stopColor="#facb60" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="cohCore">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <stop offset="0.5" stopColor="#facb60" stopOpacity="0.6" />
            <stop offset="1" stopColor="#facb60" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Outer ring guide */}
        <circle cx={0} cy={0} r={62} fill="none" stroke="#facb60" strokeOpacity={0.18} strokeWidth={1} />

        {positions.map(([dx, dy], i) => (
          <motion.circle
            key={i}
            fill="url(#cohFill)"
            stroke="#facb60"
            strokeOpacity={0.9}
            strokeWidth={1.6}
            initial={false}
            animate={{ cx: dx * 32 * expand, cy: dy * 32 * expand, r: 28 * expand }}
            transition={{ duration: 0.45, ease: "easeInOut" }}
            style={{ filter: "drop-shadow(0 0 8px rgba(250,203,96,0.55))" }}
          />
        ))}

        {/* Pulsing central core */}
        <motion.circle
          cx={0}
          cy={0}
          fill="url(#cohCore)"
          initial={false}
          animate={{ r: 14 * expand }}
          transition={{ duration: 0.45, ease: "easeInOut" }}
          style={{ filter: "drop-shadow(0 0 14px rgba(255,235,170,0.7))" }}
        />
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
      className="fixed inset-0 z-[10000] bg-[#101927]/40 backdrop-blur-sm flex items-center justify-center px-6"
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
