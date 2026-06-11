import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";

type Mode = "morning" | "night";

const morningEmotions = [
  { e: "😩", l: "Agotamiento" },
  { e: "😟", l: "Ansiedad" },
  { e: "😊", l: "Alegría" },
  { e: "😡", l: "Enojo" },
  { e: "😢", l: "Tristeza" },
  { e: "😌", l: "Calma" },
  { e: "🤩", l: "Motivado" },
  { e: "😶‍🌫️", l: "Confuso" },
  { e: "🥰", l: "Cariño" },
];

const dawnOptions = ["Excelente", "Muy bien", "Normal", "Mal", "Pésimo"];

export function CheckinModal({
  open,
  mode,
  dayGoal,
  onClose,
  onComplete,
}: {
  open: boolean;
  mode: Mode;
  dayGoal?: string | null;
  onClose: () => void;
  onComplete?: () => void;
}) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const hasGoalStep = mode === "night" && !!dayGoal;
  const totalSteps = mode === "morning" ? 5 : hasGoalStep ? 5 : 4;

  const [sleepScore, setSleepScore] = useState<number>(0);
  const [dawnScore, setDawnScore] = useState<string>("");
  const [emotions, setEmotions] = useState<string[]>([]);
  const [dream, setDream] = useState("");
  const [thought, setThought] = useState("");
  const [goal, setGoal] = useState("");
  const [balanceHigh, setBalanceHigh] = useState("");
  const [balanceImp, setBalanceImp] = useState("");
  const [goalCompleted, setGoalCompleted] = useState<"yes" | "partial" | "no" | null>(null);
  const [saving, setSaving] = useState(false);

  const toggleEmotion = (l: string) =>
    setEmotions((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const moodScoreApprox = sleepScore || 3;
    await supabase.from("daily_checkins").upsert(
      {
        user_id: user.id,
        checkin_date: localDateStr(new Date()),
        mood_score: moodScoreApprox,
        mode,
        sleep_score: sleepScore || null,
        dawn_score: dawnScore || null,
        emotions: emotions.length ? emotions : null,
        dream_note: dream || null,
        thought_note: thought || null,
        day_goal: goal || null,
        balance_highlight: balanceHigh || null,
        balance_improve: balanceImp || null,
        goal_completed: goalCompleted,
      } as any,
      { onConflict: "user_id,checkin_date" }
    );
    toast.success(mode === "morning" ? "Buen día registrado ✨" : "Cierre del día guardado 🌙");
    setSaving(false);
    onComplete?.();
    onClose();
    setStep(0);
  };

  const next = () => (step < totalSteps - 1 ? setStep(step + 1) : submit());
  const prev = () => (step > 0 ? setStep(step - 1) : onClose());

  const StepHeader = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="mb-6 text-center">
      <h2 className="font-display text-2xl font-bold text-white">{title}</h2>
      {sub && <p className="mt-1 text-sm text-white/55">{sub}</p>}
    </div>
  );

  const stepContent = () => {
    if (mode === "morning") {
      if (step === 0)
        return (
          <div>
            <StepHeader title="¿Cómo dormiste?" sub="Calificá tu sueño anoche" />
            <div className="mx-auto mb-8 flex h-32 w-40 items-center justify-center text-6xl">☁️</div>
            <div className="flex items-end justify-center gap-3">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setSleepScore(n)}
                  className={`rounded-full transition-all ${
                    sleepScore === n
                      ? "h-12 w-12 bg-indigo-400"
                      : "h-8 w-8 bg-white/15 hover:bg-white/25"
                  }`}
                />
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-white/45">Pésimo · Excelente</p>
          </div>
        );
      if (step === 1)
        return (
          <div>
            <StepHeader title="¿Cómo amaneciste?" />
            <div className="space-y-3">
              {dawnOptions.map((o) => (
                <button
                  key={o}
                  onClick={() => setDawnScore(o)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left font-medium backdrop-blur-md transition active:scale-[0.99] ${
                    dawnScore === o
                      ? "border-indigo-400/60 bg-indigo-500/15 text-white"
                      : "border-white/10 bg-white/5 text-white/85"
                  }`}
                >
                  {o}
                </button>
              ))}
            </div>
          </div>
        );
      if (step === 2)
        return (
          <div>
            <StepHeader title="¿Qué emociones sentís?" sub="Elegí todas las que apliquen" />
            <div className="grid grid-cols-3 gap-3">
              {morningEmotions.map((em) => {
                const on = emotions.includes(em.l);
                return (
                  <button
                    key={em.l}
                    onClick={() => toggleEmotion(em.l)}
                    className={`flex aspect-square flex-col items-center justify-center rounded-2xl border backdrop-blur-md transition ${
                      on
                        ? "border-indigo-400/60 bg-indigo-500/15"
                        : "border-white/10 bg-white/5"
                    }`}
                  >
                    <span className="text-4xl">{em.e}</span>
                    <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-white/70">
                      {em.l}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        );
      if (step === 3)
        return (
          <div>
            <StepHeader title="Tu diario de hoy" />
            <div className="space-y-3">
              {[
                { v: dream, set: setDream, ph: "¿Soñaste algo?" },
                { v: thought, set: setThought, ph: "Algún pensamiento particular" },
                { v: goal, set: setGoal, ph: "Tu objetivo para hoy" },
              ].map((f, i) => (
                <textarea
                  key={i}
                  value={f.v}
                  onChange={(e) => f.set(e.target.value)}
                  placeholder={f.ph}
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 backdrop-blur-md focus:border-indigo-400/60 focus:outline-none"
                />
              ))}
            </div>
          </div>
        );
      // step 4 — stats
      return <StatsStep tip="Ponete una meta clara y pequeña hoy: 1 minuto de pausa cuenta." />;
    }

    // NIGHT
    if (step === 0)
      return (
        <div>
          <StepHeader title="¿Cómo estuvo tu día?" />
          <div className="mx-auto mb-8 flex h-32 w-40 items-center justify-center text-6xl">🌙</div>
          <div className="flex items-end justify-center gap-3">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => setSleepScore(n)}
                className={`rounded-full transition-all ${
                  sleepScore === n
                    ? "h-12 w-12 bg-violet-400"
                    : "h-8 w-8 bg-white/15 hover:bg-white/25"
                }`}
              />
            ))}
          </div>
        </div>
      );
    if (step === 1)
      return (
        <div>
          <StepHeader title="Emoción predominante" />
          <div className="grid grid-cols-3 gap-3">
            {morningEmotions.map((em) => {
              const on = emotions.includes(em.l);
              return (
                <button
                  key={em.l}
                  onClick={() => toggleEmotion(em.l)}
                  className={`flex aspect-square flex-col items-center justify-center rounded-2xl border backdrop-blur-md transition ${
                    on
                      ? "border-violet-400/60 bg-violet-500/15"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <span className="text-4xl">{em.e}</span>
                  <span className="mt-2 text-[10px] font-medium uppercase tracking-wide text-white/70">
                    {em.l}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      );
    if (step === 2)
      return (
        <div>
          <StepHeader title="Tu balance del día" />
          <div className="space-y-3">
            <textarea
              value={balanceHigh}
              onChange={(e) => setBalanceHigh(e.target.value)}
              placeholder="¿Qué destacarías de tu día?"
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 backdrop-blur-md focus:border-violet-400/60 focus:outline-none"
            />
            <textarea
              value={balanceImp}
              onChange={(e) => setBalanceImp(e.target.value)}
              placeholder="¿Qué te gustaría mejorar?"
              rows={3}
              className="w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 backdrop-blur-md focus:border-violet-400/60 focus:outline-none"
            />
          </div>
        </div>
      );
    if (hasGoalStep && step === 3)
      return (
        <div>
          <StepHeader title="Tu objetivo de hoy" sub="¿Pudiste cumplirlo?" />
          <div className="mb-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-center">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-amber-300">
              Te lo propusiste esta mañana
            </p>
            <p className="mt-2 text-base font-medium text-white/90">{dayGoal}</p>
          </div>
          <div className="space-y-3">
            {[
              { v: "yes", l: "Sí, lo cumplí ✨", c: "emerald" },
              { v: "partial", l: "En parte", c: "amber" },
              { v: "no", l: "No esta vez", c: "rose" },
            ].map((o) => {
              const on = goalCompleted === o.v;
              return (
                <button
                  key={o.v}
                  onClick={() => setGoalCompleted(o.v as any)}
                  className={`w-full rounded-2xl border px-5 py-4 text-left font-medium transition active:scale-[0.99] ${
                    on
                      ? "border-violet-400/60 bg-violet-500/15 text-white"
                      : "border-white/10 bg-white/5 text-white/85"
                  }`}
                >
                  {o.l}
                </button>
              );
            })}
          </div>
        </div>
      );
    return <StatsStep tip="Antes de dormir, recordá una cosa que agradecés hoy. La gratitud calma." />;
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/60 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="relative mx-auto min-h-screen w-full max-w-md bg-[#1C1C1E] px-6 pt-12 pb-32 text-white"
          >
            {/* glass orbs */}
            <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

            {/* header */}
            <div className="relative mb-8 flex items-center gap-4">
              <button
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-1 justify-center gap-2">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 w-8 rounded-full ${
                      i <= step
                        ? mode === "morning"
                          ? "bg-indigo-400"
                          : "bg-violet-400"
                        : "bg-white/15"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>

            <motion.div
              key={step}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="relative"
            >
              {stepContent()}
            </motion.div>

            <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md bg-gradient-to-t from-[#1C1C1E] via-[#1C1C1E] to-transparent px-6 pb-8 pt-6">
              <button
                disabled={saving}
                onClick={next}
                className={`flex w-full items-center justify-center gap-2 rounded-2xl py-4 text-sm font-semibold text-white shadow-xl transition disabled:opacity-50 ${
                  mode === "morning" ? "bg-indigo-500" : "bg-violet-500"
                }`}
              >
                {step === totalSteps - 1 ? (
                  <>
                    <Check size={18} /> Guardar
                  </>
                ) : (
                  <>
                    Siguiente <ArrowRight size={18} />
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StatsStep({ tip }: { tip: string }) {
  return (
    <div>
      <div className="mb-2 text-center text-xs font-semibold uppercase tracking-widest text-white/45">
        Tu progreso
      </div>
      <h2 className="mb-8 text-center font-display text-2xl font-bold text-white">1 de 7 días</h2>
      <div className="mx-auto mb-10 flex items-end justify-center">
        <Gauge value={1} max={7} />
      </div>
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-amber-300">
          Consejo del día
        </p>
        <p className="mt-2 text-sm leading-relaxed text-white/85">{tip}</p>
      </div>
    </div>
  );
}

function Gauge({ value, max }: { value: number; max: number }) {
  const pct = value / max;
  const angle = -90 + pct * 180;
  return (
    <div className="relative h-32 w-56">
      <svg viewBox="0 0 200 110" className="h-full w-full">
        <path
          d="M 20 100 A 80 80 0 0 1 180 100"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d={`M 20 100 A 80 80 0 0 1 ${20 + 160 * pct} ${
            100 - 80 * Math.sin(Math.PI * pct)
          }`}
          stroke="#f59e0b"
          strokeWidth="14"
          fill="none"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-x-0 bottom-2 text-center">
        <p className="font-display text-3xl font-bold text-amber-400">{value}/{max}</p>
        <p className="text-[10px] uppercase tracking-widest text-white/45">días esta semana</p>
      </div>
    </div>
  );
}
