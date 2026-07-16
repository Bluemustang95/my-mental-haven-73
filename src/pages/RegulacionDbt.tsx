import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, HelpCircle, Menu, X, Bot, Send,
  Check, Info, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/* ------------------------------------------------------------------ */
/* Clinical data — DBT Ficha 9 (Linehan)                              */
/* ------------------------------------------------------------------ */

type EmotionKey =
  | "amor" | "miedo" | "verguenza" | "culpa" | "asco"
  | "enojo" | "envidia" | "celos" | "tristeza";

const EMOTIONS: { key: EmotionKey; name: string; dot: string }[] = [
  { key: "amor",       name: "Amor",      dot: "#f4a3b8" },
  { key: "miedo",      name: "Miedo",     dot: "#b8a3e8" },
  { key: "verguenza",  name: "Vergüenza", dot: "#9cc3e8" },
  { key: "culpa",      name: "Culpa",     dot: "#8ec5e8" },
  { key: "asco",       name: "Asco",      dot: "#9ad19a" },
  { key: "enojo",      name: "Enojo",     dot: "#f4a784" },
  { key: "envidia",    name: "Envidia",   dot: "#e8e08a" },
  { key: "celos",      name: "Celos",     dot: "#ecd06a" },
  { key: "tristeza",   name: "Tristeza",  dot: "#b8c0c8" },
];

const NUANCES: Record<EmotionKey, string[]> = {
  amor:      ["Ternura", "Cariño", "Pasión", "Compasión"],
  miedo:     ["Ansiedad", "Pánico", "Inquietud", "Temor"],
  verguenza: ["Bochorno", "Humillación", "Pudor", "Auto-rechazo"],
  culpa:     ["Remordimiento", "Arrepentimiento", "Auto-reproche"],
  asco:      ["Repulsión", "Aversión", "Desagrado"],
  enojo:     ["Furia", "Frustración", "Fastidio", "Ira"],
  envidia:   ["Codicia", "Resentimiento", "Comparación"],
  celos:     ["Posesividad", "Inseguridad", "Sospecha"],
  tristeza:  ["Melancolía", "Desesperanza", "Pena", "Vacío"],
};

const FIT_CRITERIA: Record<EmotionKey, string> = {
  amor:      "Se ajusta cuando alguien o algo es importante para ti, te aporta calidad de vida o representa un vínculo seguro.",
  miedo:     "Se ajusta cuando tu vida, salud o bienestar (o el de alguien que te importa) está amenazado de forma real e inmediata.",
  verguenza: "Se ajusta cuando tu conducta, de hacerse pública en tu comunidad, llevaría a un rechazo real (no imaginario).",
  culpa:     "Se ajusta cuando tu conducta viola tus propios valores morales y dañó a alguien o algo concreto.",
  asco:      "Se ajusta cuando algo es realmente tóxico o nocivo para tu cuerpo, mente o vínculos.",
  enojo:     "Se ajusta cuando una meta importante se ve bloqueada, o tú o alguien querido es atacado o herido injustamente.",
  envidia:   "Se ajusta cuando otra persona tiene algo que tú necesitas o deseas genuinamente y no posees.",
  celos:     "Se ajusta cuando una relación o cosa importante para ti corre un riesgo real de perderse.",
  tristeza:  "Se ajusta cuando perdiste algo o a alguien importante, o no recibís lo que necesitás de forma persistente.",
};

const OPPOSITE_ACTIONS: Record<EmotionKey, string[]> = {
  amor:      ["Distanciarte físicamente", "Evitar contacto innecesario", "Recordar costos del vínculo"],
  miedo:     ["Acercarte a lo temido en pasos pequeños", "Hacer aquello que estás evitando", "Mantener postura erguida"],
  verguenza: ["Hacer público lo oculto en un espacio seguro", "Mantener cabeza en alto", "Repetir la conducta sin esconderte"],
  culpa:     ["Si no violaste valores: seguir igual", "Reparar de forma proporcional", "Dejar de pedir disculpas en exceso"],
  asco:      ["Acercarte con curiosidad", "Tolerar el contacto breve", "Comer/usar de a poco lo tolerable"],
  enojo:     ["Alejarte amablemente", "Empatizar con la otra persona", "Suavizar la voz y el cuerpo"],
  envidia:   ["Practicar gratitud por lo propio", "Felicitar genuinamente al otro", "Dejar de comparar"],
  celos:     ["Soltar el control", "Confiar deliberadamente", "Compartir el tiempo del otro"],
  tristeza:  ["Evitar el aislamiento", "Realizar actividades placenteras", "Adoptar postura erguida y activa"],
};

/* ------------------------------------------------------------------ */
/* State                                                              */
/* ------------------------------------------------------------------ */

type Step = 1 | 2 | 3 | 4 | 5;
type FitAns = "yes" | "no" | null;
type EffAns = "yes" | "no" | null;

type SessionState = {
  emotion: EmotionKey | null;
  nuance: string | null;
  story: string;
  fit: FitAns;
  effective: EffAns;
  plan: string;
};

const EMPTY: SessionState = {
  emotion: null, nuance: null, story: "", fit: null, effective: null, plan: "",
};

const STORAGE_KEY = "resma.regulacion-dbt.v1";

/* ------------------------------------------------------------------ */
/* Page                                                               */
/* ------------------------------------------------------------------ */

export default function RegulacionDbt() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>(1);
  const [state, setState] = useState<SessionState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return { ...EMPTY, ...JSON.parse(raw) };
    } catch {}
    return EMPTY;
  });
  const [helpOpen, setHelpOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  // Hide the global BottomNav while inside the wizard.
  useEffect(() => {
    document.body.classList.add("zen-mode");
    return () => document.body.classList.remove("zen-mode");
  }, []);

  const set = (patch: Partial<SessionState>) => setState((s) => ({ ...s, ...patch }));

  const planLabel: { title: string; sub: string } = useMemo(() => {
    if (state.fit === "no")
      return {
        title: "Reestructuración Cognitiva",
        sub: "La emoción no se apoya en hechos reales.",
      };
    if (state.fit === "yes" && state.effective === "no")
      return {
        title: "Acción Opuesta",
        sub: "La emoción es legítima, pero reaccionar con su impulso es ineficiente.",
      };
    if (state.fit === "yes" && state.effective === "yes")
      return {
        title: "Resolución de Problemas",
        sub: "La emoción se ajusta y actuar es lo más adaptativo.",
      };
    return { title: "Conclusión", sub: "Completá los pasos previos para definir tu plan." };
  }, [state.fit, state.effective]);

  const canAdvance = useMemo(() => {
    switch (step) {
      case 1: return !!state.emotion;
      case 2: return state.story.trim().length >= 6;
      case 3: return state.fit !== null;
      case 4: return state.effective !== null;
      case 5: return state.plan.trim().length >= 6;
    }
  }, [step, state]);

  const goNext = () => {
    if (!canAdvance) { toast("Completá este paso para continuar."); return; }
    if (step < 5) setStep((s) => (s + 1) as Step);
    else finish();
  };
  const goBack = () => {
    if (step > 1) setStep((s) => (s - 1) as Step);
    else navigate("/herramientas/mente-emocion");
  };

  const finish = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user && state.emotion) {
        const path =
          state.fit === "no" ? "cognitive_restructuring"
          : state.fit === "yes" && state.effective === "no" ? "opposite_action"
          : "problem_solving";
        await supabase.from("dbt_emotion_sessions").insert({
          user_id: user.id,
          emotion: state.emotion,
          event_description: state.story,
          interpretations: state.nuance ?? null,
          fits_facts: state.fit === "yes",
          is_effective: state.effective === "yes",
          path,
          opposite_payload: path === "opposite_action" ? { plan: state.plan } : null,
          problem_payload: path === "problem_solving" ? { plan: state.plan } : null,
          completed_at: new Date().toISOString(),
        });
      }
    } catch (e) {
      console.warn("[RegulacionDbt] failed to persist session", e);
    }
    toast.success("Ficha completada. Buen trabajo.");
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
    setState(EMPTY); setStep(1);
    navigate("/diario-inteligente/regulacion-emocional");
  };

  const steps = useMemo(() => ([
    { n: 1, title: "¿Cuál es la emoción?", tag: "EMOCIÓN", done: !!state.emotion },
    { n: 2, title: "Contá qué pasó",        tag: "HECHOS",  done: state.story.trim().length >= 6 },
    { n: 3, title: "¿Se ajusta a los hechos?", tag: "AJUSTE",       done: state.fit !== null },
    { n: 4, title: "¿Es efectivo actuar?",     tag: "EFECTIVIDAD",  done: state.effective !== null },
    { n: 5, title: planLabel.title,            tag: "CONCLUSIÓN",   done: state.plan.trim().length >= 6 },
  ]), [state, planLabel]);

  return (
    <div className="fixed inset-0 z-50 bg-[#f9f9fb] flex items-center justify-center">
      {/* Mobile-blinded shell */}
      <div className="relative w-full h-full md:h-[820px] md:max-w-md md:rounded-[36px] md:shadow-2xl overflow-hidden bg-gradient-to-b from-[#eef4f6] via-[#f6f3ec] to-[#f4eede] flex flex-col">
        {/* Atmospheric orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -top-20 -left-16 h-72 w-72 rounded-full opacity-60"
          style={{ background: "radial-gradient(circle, #7cc2c8 0%, transparent 70%)", filter: "blur(40px)", animation: "orb-float 12s ease-in-out infinite" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-20 h-80 w-80 rounded-full opacity-50"
          style={{ background: "radial-gradient(circle, #facb60 0%, transparent 70%)", filter: "blur(48px)", animation: "orb-float-2 14s ease-in-out infinite" }}
        />

        {/* Header */}
        <Header
          step={step}
          onBack={goBack}
          onHelp={() => setHelpOpen(true)}
        />

        {/* Scrollable content */}
        <div className="relative flex-1 overflow-y-auto px-6 pt-2 pb-32 scrollbar-hide">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
            >
              {step === 1 && <Step1 state={state} set={set} />}
              {step === 2 && <Step2 state={state} set={set} />}
              {step === 3 && <Step3 state={state} set={set} />}
              {step === 4 && <Step4 state={state} set={set} />}
              {step === 5 && <Step5 state={state} set={set} planLabel={planLabel} />}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bot celeste interno reemplazado por Resmita global (FAB amarillo) */}

        {/* Bottom nav */}
        <BottomNav
          step={step}
          canAdvance={!!canAdvance}
          onBack={goBack}
          onMenu={() => setMenuOpen(true)}
          onNext={goNext}
        />

        {/* Overlays */}
        <AnimatePresence>
          {menuOpen && (
            <StepsMenu
              steps={steps}
              current={step}
              onClose={() => setMenuOpen(false)}
              onPick={(n) => { setStep(n); setMenuOpen(false); }}
            />
          )}
          {helpOpen && <HelpModal onClose={() => setHelpOpen(false)} />}
          {aiOpen && (
            <AiDrawer
              step={step}
              state={state}
              planLabel={planLabel}
              onClose={() => setAiOpen(false)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header & footer                                                    */
/* ------------------------------------------------------------------ */

function Header({ step, onBack, onHelp }: { step: Step; onBack: () => void; onHelp: () => void }) {
  return (
    <div className="relative px-5 pt-5 pb-3">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="h-10 w-10 rounded-2xl bg-white/70 backdrop-blur-md border border-white/70 flex items-center justify-center text-[#101927] active:scale-95"
        >
          <ChevronLeft size={18} />
        </button>
        <div className="text-center">
          <div className="text-[10px] tracking-[0.22em] font-semibold text-[#101927]/45 uppercase">
            Regulación Emocional
          </div>
          <div className="text-[15px] font-semibold text-[#101927] mt-0.5">
            Paso {step} de 5
          </div>
        </div>
        <button
          onClick={onHelp}
          className="h-10 w-10 rounded-full bg-white/80 backdrop-blur-md border border-white/70 flex items-center justify-center text-[#7cc2c8] active:scale-95"
        >
          <HelpCircle size={18} />
        </button>
      </div>
      {/* Progress */}
      <div className="mt-4 h-[3px] w-full bg-[#101927]/8 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-[#7cc2c8] rounded-full"
          initial={false}
          animate={{ width: `${(step / 5) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
    </div>
  );
}

function BottomNav({
  step, canAdvance, onBack, onMenu, onNext,
}: {
  step: Step; canAdvance: boolean;
  onBack: () => void; onMenu: () => void; onNext: () => void;
}) {
  return (
    <div className="absolute bottom-4 left-4 right-4">
      <div className="rounded-[28px] bg-white/85 backdrop-blur-xl border border-white/70 shadow-[0_12px_40px_rgba(16,25,39,0.08)] px-3 py-2.5 flex items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="h-12 w-12 rounded-2xl border border-[#101927]/10 bg-white/60 flex items-center justify-center text-[#101927]/70 active:scale-95"
          aria-label="Atrás"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          onClick={onMenu}
          className="h-12 w-12 rounded-2xl border border-[#7cc2c8]/40 bg-white/60 flex items-center justify-center text-[#7cc2c8] active:scale-95"
          aria-label="Menú de pasos"
        >
          <Menu size={20} />
        </button>
        <button
          onClick={onNext}
          disabled={!canAdvance}
          className="flex-1 h-12 rounded-2xl bg-[#7cc2c8] text-white font-semibold text-[15px] flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-40 transition"
        >
          {step === 5 ? "Terminar" : "Siguiente"}
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Steps                                                              */
/* ------------------------------------------------------------------ */

function StepTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-5">
      <h1 className="font-serifElegant text-[28px] leading-tight text-[#101927]">{title}</h1>
      {subtitle && <p className="mt-1.5 text-[13px] text-[#101927]/55 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function Step1({ state, set }: { state: SessionState; set: (p: Partial<SessionState>) => void }) {
  const nuances = state.emotion ? NUANCES[state.emotion] : [];
  const emName = state.emotion ? EMOTIONS.find((e) => e.key === state.emotion)?.name : "";
  return (
    <>
      <StepTitle title="¿Cuál es la emoción?" subtitle="Identificá qué emoción sentís y explorá sus variantes." />
      <div className="grid grid-cols-3 gap-2.5">
        {EMOTIONS.map((e) => {
          const active = state.emotion === e.key;
          return (
            <button
              key={e.key}
              onClick={() => set({ emotion: e.key, nuance: null })}
              className={`relative aspect-[1.05/1] rounded-2xl border transition flex flex-col items-center justify-center gap-1.5 active:scale-[0.97] ${
                active
                  ? "bg-[#101927] border-[#101927] text-white shadow-lg"
                  : "bg-white/85 backdrop-blur-md border-white/80 text-[#101927] shadow-sm"
              }`}
            >
              <span className="text-[13px] font-semibold">{e.name}</span>
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: active ? "#ffffff80" : e.dot }}
              />
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {state.emotion && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-5 rounded-3xl bg-white/55 backdrop-blur-xl border border-white/70 p-4"
          >
            <div className="text-center text-[10.5px] tracking-[0.18em] font-semibold text-[#101927]/45 uppercase">
              Matices específicos de {emName}
            </div>
            <div className="mt-3 flex flex-wrap gap-2 justify-center">
              {nuances.map((n) => {
                const active = state.nuance === n;
                return (
                  <button
                    key={n}
                    onClick={() => set({ nuance: active ? null : n })}
                    className={`h-9 px-3.5 rounded-full text-[13px] font-medium transition active:scale-95 ${
                      active
                        ? "bg-[#101927] text-white"
                        : "bg-white text-[#101927] border border-[#101927]/10"
                    }`}
                  >
                    {n}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Step2({ state, set }: { state: SessionState; set: (p: Partial<SessionState>) => void }) {
  return (
    <>
      <StepTitle
        title="Contá qué pasó"
        subtitle="Registrá lo ocurrido de forma objetiva e incluí tu interpretación subjetiva en una misma box."
      />
      <div className="rounded-[28px] bg-white/55 backdrop-blur-xl border border-white/70 p-4">
        <div className="text-[10.5px] tracking-[0.18em] font-semibold text-[#101927]/45 uppercase">
          Escribí qué pasó y qué pensás al respecto
        </div>
        <textarea
          value={state.story}
          onChange={(e) => set({ story: e.target.value })}
          placeholder="Ejemplo: Mi pareja no me contestó el mensaje en tres horas (Hecho) y sentí que ya no le intereso o que me está ocultando algo (Interpretación)…"
          rows={8}
          className="mt-3 w-full bg-transparent text-[14px] text-[#101927] placeholder:text-[#101927]/40 leading-relaxed outline-none resize-none"
        />
      </div>
      <div className="mt-4 rounded-2xl bg-[#7cc2c8]/12 border border-[#7cc2c8]/25 p-4 flex gap-3">
        <span className="text-lg leading-none">💡</span>
        <p className="text-[12.5px] leading-relaxed text-[#101927]/75">
          <strong className="text-[#101927]">Pauta de Separación:</strong> Intentá identificar qué parte de tu texto es información objetiva (lo que vería una cámara) y qué parte es conclusión de tu mente.
        </p>
      </div>
    </>
  );
}

function Step3({ state, set }: { state: SessionState; set: (p: Partial<SessionState>) => void }) {
  const [open, setOpen] = useState(false);
  const em = state.emotion;
  const emName = em ? EMOTIONS.find((e) => e.key === em)?.name : "";
  return (
    <>
      <StepTitle
        title="¿Se ajusta a los hechos?"
        subtitle={`Evaluá si tu ${emName?.toLowerCase() ?? "emoción"} se justifica por la situación real.`}
      />
      <div className="grid grid-cols-2 gap-3">
        <BinaryButton
          active={state.fit === "yes"}
          tone="positive"
          label="Sí se ajusta"
          onClick={() => set({ fit: "yes" })}
        />
        <BinaryButton
          active={state.fit === "no"}
          tone="neutral"
          label="No se ajusta"
          onClick={() => set({ fit: "no" })}
        />
      </div>

      <button
        onClick={() => setOpen((v) => !v)}
        className="mt-5 w-full rounded-2xl bg-white/70 backdrop-blur-md border border-white/70 px-4 py-3 flex items-center gap-3 active:scale-[0.99]"
      >
        <div className="h-9 w-9 rounded-xl bg-[#7cc2c8]/20 flex items-center justify-center text-[#7cc2c8]">
          <Info size={16} />
        </div>
        <div className="flex-1 text-left">
          <div className="text-[13px] font-semibold text-[#101927]">Criterio clínico DBT</div>
          <div className="text-[11.5px] text-[#101927]/55">Cuándo {emName?.toLowerCase()} se ajusta a los hechos.</div>
        </div>
        <ChevronRight size={16} className={`text-[#101927]/40 transition ${open ? "rotate-90" : ""}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && em && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className="mt-2 rounded-2xl bg-[#facb60]/15 border border-[#facb60]/30 p-4">
              <p className="text-[13px] leading-relaxed text-[#101927]/80">
                {FIT_CRITERIA[em]}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function Step4({ state, set }: { state: SessionState; set: (p: Partial<SessionState>) => void }) {
  return (
    <>
      <StepTitle
        title="¿Es efectivo actuar?"
        subtitle="Pensá si seguir el impulso de la emoción te acerca o aleja de tus objetivos."
      />
      <div className="grid grid-cols-2 gap-3">
        <BinaryButton
          active={state.effective === "yes"}
          tone="positive"
          label="Sí es efectivo"
          onClick={() => set({ effective: "yes" })}
        />
        <BinaryButton
          active={state.effective === "no"}
          tone="neutral"
          label="No es efectivo"
          onClick={() => set({ effective: "no" })}
        />
      </div>

      <div className="mt-5 rounded-2xl bg-[#facb60]/20 border border-[#facb60]/40 p-4">
        <div className="flex items-center gap-2 text-[11px] tracking-widest uppercase font-semibold text-[#101927]/70">
          <Sparkles size={14} className="text-[#facb60]" /> Criterio DBT
        </div>
        <p className="mt-2 text-[13px] leading-relaxed text-[#101927]/80">
          Aunque la emoción se ajuste a la realidad, actuar bajo su impulso puede dañar vínculos importantes o alejarte de tus objetivos a largo plazo. Lo efectivo no siempre coincide con lo justo.
        </p>
      </div>
    </>
  );
}

function Step5({
  state, set, planLabel,
}: {
  state: SessionState; set: (p: Partial<SessionState>) => void;
  planLabel: { title: string; sub: string };
}) {
  const em = state.emotion;
  const isOpposite = state.fit === "yes" && state.effective === "no";
  const actions = em ? OPPOSITE_ACTIONS[em] : [];

  const appendAction = (a: string) => {
    const next = state.plan ? `${state.plan.trim()}\n• ${a}` : `• ${a}`;
    set({ plan: next });
  };

  const placeholder =
    state.fit === "no"
      ? "Reformulá el pensamiento en una versión más racional y adaptativa a los hechos…"
      : isOpposite
      ? "Describí cómo vas a actuar en la dirección opuesta al impulso de esta emoción…"
      : "Definí un plan directo y asertivo para resolver la situación de raíz…";

  return (
    <>
      <StepTitle title={planLabel.title} subtitle={planLabel.sub} />

      {isOpposite && actions.length > 0 && (
        <div className="mb-4 rounded-3xl bg-white/55 backdrop-blur-xl border border-white/70 p-4">
          <div className="text-[10.5px] tracking-[0.18em] font-semibold text-[#101927]/45 uppercase">
            Acciones opuestas sugeridas
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {actions.map((a) => (
              <button
                key={a}
                onClick={() => appendAction(a)}
                className="h-9 px-3.5 rounded-full text-[12.5px] font-medium bg-white border border-[#7cc2c8]/40 text-[#101927] active:scale-95"
              >
                + {a}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-[28px] bg-white/55 backdrop-blur-xl border border-white/70 p-4">
        <div className="text-[10.5px] tracking-[0.18em] font-semibold text-[#101927]/45 uppercase">
          Tu plan
        </div>
        <textarea
          value={state.plan}
          onChange={(e) => set({ plan: e.target.value })}
          placeholder={placeholder}
          rows={7}
          className="mt-3 w-full bg-transparent text-[14px] text-[#101927] placeholder:text-[#101927]/40 leading-relaxed outline-none resize-none"
        />
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                    */
/* ------------------------------------------------------------------ */

function BinaryButton({
  active, label, onClick, tone,
}: { active: boolean; label: string; onClick: () => void; tone: "positive" | "neutral" }) {
  const activeBg = tone === "positive" ? "bg-[#7cc2c8] text-white border-[#7cc2c8]" : "bg-[#101927] text-white border-[#101927]";
  return (
    <button
      onClick={onClick}
      className={`h-20 rounded-2xl border font-semibold text-[14px] transition active:scale-[0.97] ${
        active ? `${activeBg} shadow-lg` : "bg-white/85 backdrop-blur border-white/80 text-[#101927]"
      }`}
    >
      {label}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Drawers / Modals                                                   */
/* ------------------------------------------------------------------ */

function StepsMenu({
  steps, current, onClose, onPick,
}: {
  steps: { n: number; title: string; tag: string; done: boolean }[];
  current: number; onClose: () => void; onPick: (n: Step) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-white/40 backdrop-blur-2xl flex flex-col p-6"
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] tracking-[0.22em] uppercase font-semibold text-[#101927]/45">
            Regulación Emocional
          </div>
          <h2 className="font-serifElegant text-[26px] text-[#101927] mt-1">Ficha de Trabajo</h2>
        </div>
        <button
          onClick={onClose}
          className="h-10 w-10 rounded-full bg-white/80 border border-white/70 flex items-center justify-center text-[#101927]/70"
        >
          <X size={18} />
        </button>
      </div>

      <div className="mt-6 space-y-3 flex-1 overflow-y-auto scrollbar-hide">
        {steps.map((s) => {
          const isCurrent = s.n === current;
          return (
            <button
              key={s.n}
              onClick={() => onPick(s.n as Step)}
              className={`w-full rounded-2xl bg-white/80 backdrop-blur border px-4 py-3.5 flex items-center gap-3 text-left active:scale-[0.99] transition ${
                isCurrent ? "border-[#7cc2c8] ring-1 ring-[#7cc2c8]/50" : "border-white/70"
              }`}
            >
              <div className={`h-9 w-9 rounded-full flex items-center justify-center text-[13px] font-semibold ${
                s.done ? "bg-[#7cc2c8] text-white" : "bg-[#101927]/8 text-[#101927]/60"
              }`}>
                {s.done ? <Check size={16} /> : s.n}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-[14px] font-semibold ${isCurrent ? "text-[#101927]" : "text-[#101927]/80"}`}>
                  {s.title}
                </div>
                <div className="text-[10.5px] tracking-[0.18em] uppercase font-semibold text-[#101927]/40 mt-0.5">
                  {s.tag}
                </div>
              </div>
              <ChevronRight size={16} className="text-[#101927]/30" />
            </button>
          );
        })}
      </div>

      <button
        onClick={onClose}
        className="mt-5 h-14 rounded-2xl bg-white/85 border border-white/80 font-semibold text-[14px] text-[#101927] active:scale-[0.99]"
      >
        Volver a la Sesión
      </button>
    </motion.div>
  );
}

function HelpModal({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 bg-[#101927]/40 backdrop-blur-sm flex items-center justify-center p-5"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-[28px] bg-white p-6 shadow-2xl"
      >
        <div className="flex justify-between items-start">
          <h3 className="font-serifElegant text-[22px] text-[#101927] leading-tight">
            Regulación Emocional DBT
          </h3>
          <button
            onClick={onClose}
            className="h-9 w-9 rounded-full bg-[#101927]/5 flex items-center justify-center text-[#101927]/60"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4 space-y-3 text-[13px] text-[#101927]/75 leading-relaxed">
          <p>
            <strong className="text-[#101927]">Ajuste a los hechos:</strong> una emoción se ajusta cuando su tipo e intensidad están justificados por la realidad objetiva, no por interpretaciones.
          </p>
          <p>
            <strong className="text-[#101927]">Efectividad del impulso:</strong> actuar en línea con la emoción es efectivo si te acerca a tus metas y cuida tus vínculos a largo plazo.
          </p>
          <p>
            <strong className="text-[#101927]">Acción opuesta:</strong> cuando la emoción es legítima pero el impulso no es efectivo, hacer lo contrario al impulso reduce la intensidad emocional.
          </p>
        </div>
        <button
          onClick={onClose}
          className="mt-5 w-full h-12 rounded-2xl bg-[#101927] text-white font-semibold text-[14px] active:scale-[0.98]"
        >
          Entendido
        </button>
      </motion.div>
    </motion.div>
  );
}

function AiDrawer({
  step, state, planLabel, onClose,
}: {
  step: Step; state: SessionState;
  planLabel: { title: string; sub: string };
  onClose: () => void;
}) {
  type Msg = { role: "ai" | "user"; text: string };
  const intro = useMemo<Msg[]>(() => ([
    { role: "ai", text: "Hola, soy tu Guía DBT. Estoy con vos en este proceso." },
    { role: "ai", text: contextHint(step, state, planLabel) },
  ]), [step, state, planLabel]);
  const [messages, setMessages] = useState<Msg[]>(intro);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 99999, behavior: "smooth" });
  }, [messages]);

  const send = () => {
    const t = input.trim();
    if (!t) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: t }]);
    setTimeout(() => {
      setMessages((m) => [...m, { role: "ai", text: simulate(t, step, state) }]);
    }, 600);
  };

  return (
    <motion.div
      initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 28, stiffness: 240 }}
      className="absolute inset-x-0 bottom-0 top-16 z-50 bg-white rounded-t-[28px] shadow-2xl flex flex-col"
    >
      <div className="px-5 pt-4 pb-3 border-b border-[#101927]/8 flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-[#7cc2c8] text-white flex items-center justify-center">
          <Bot size={18} />
        </div>
        <div className="flex-1">
          <div className="text-[14px] font-semibold text-[#101927]">Guía DBT IA</div>
          <div className="text-[11px] text-[#7cc2c8]">en línea · contexto paso {step}</div>
        </div>
        <button
          onClick={onClose}
          className="h-9 w-9 rounded-full bg-[#101927]/5 flex items-center justify-center text-[#101927]/60"
        >
          <X size={16} />
        </button>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-2.5 scrollbar-hide bg-[#f9f9fb]">
        {messages.map((m, i) => (
          <div
            key={i}
            className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${
              m.role === "ai"
                ? "bg-white text-[#101927] border border-[#101927]/8 mr-auto rounded-bl-md"
                : "bg-[#101927] text-white ml-auto rounded-br-md"
            }`}
          >
            {m.text}
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-[#101927]/8 bg-white flex items-center gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") send(); }}
          placeholder="Escribí qué te pasa…"
          className="flex-1 h-12 rounded-2xl bg-[#f9f9fb] px-4 text-[14px] text-[#101927] placeholder:text-[#101927]/40 outline-none border border-[#101927]/8"
        />
        <button
          onClick={send}
          className="h-12 w-12 rounded-2xl bg-[#7cc2c8] text-white flex items-center justify-center active:scale-95"
          aria-label="Enviar"
        >
          <Send size={18} />
        </button>
      </div>
    </motion.div>
  );
}

function contextHint(step: Step, state: SessionState, planLabel: { title: string }) {
  const em = state.emotion ? EMOTIONS.find((e) => e.key === state.emotion)?.name : "tu emoción";
  switch (step) {
    case 1: return "Tomate un momento. ¿Qué emoción predomina ahora? Si dudás, empezá por el tono general.";
    case 2: return `Contame qué pasó. Separá los hechos observables de tu interpretación sobre ${em}.`;
    case 3: return `Pensemos juntos si ${em} se ajusta a los hechos. ¿Hay evidencia concreta o son suposiciones?`;
    case 4: return `Si actuás según el impulso de ${em}, ¿te acerca o te aleja de lo que te importa?`;
    case 5: return `Vamos a construir un plan de ${planLabel.title}. Yo te acompaño.`;
  }
}

function simulate(input: string, step: Step, state: SessionState) {
  const em = state.emotion ? EMOTIONS.find((e) => e.key === state.emotion)?.name?.toLowerCase() : "tu emoción";
  const tips: Record<Step, string[]> = {
    1: [`Escucho que estás explorando ${em}. Probá quedarte unos segundos con la sensación corporal antes de elegir.`, "A veces lo que aparece primero esconde otra emoción más profunda. ¿Hay miedo o tristeza debajo?"],
    2: ["Releé lo que escribiste y subrayá mentalmente sólo lo que vería una cámara. Lo demás es interpretación.", "Buen registro. Intentá agregar el detalle más concreto que recuerdes."],
    3: [`Recordá: que ${em} sea muy intensa no significa que se ajuste a los hechos. Mirá la evidencia objetiva.`, "Si una persona neutral viera la escena, ¿pensaría lo mismo que vos?"],
    4: ["Mirá a 6 meses: ¿esta forma de actuar te dejaría tranquilo/a con vos mismo/a?", "Si seguir el impulso daña un vínculo importante, probablemente no sea lo más efectivo, aunque se sienta justo."],
    5: ["Pequeño y concreto vence a grande y vago. ¿Cuál es el primer paso de hoy?", "Anclalo a un horario o lugar real para que no quede sólo en intención."],
  };
  const pool = tips[step];
  return pool[Math.floor(Math.random() * pool.length)];
}
