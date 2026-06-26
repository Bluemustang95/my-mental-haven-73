import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { ReactiveCloud, ReactiveCloudCaption } from "@/components/home/ReactiveCloud";
import { ReactiveMoon, ReactiveMoonCaption } from "@/components/home/ReactiveMoon";
import { RadialWeekProgress } from "@/components/home/RadialWeekProgress";

type Mode = "morning" | "night";

const EMOTIONS = [
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
  const isMorning = mode === "morning";
  const totalSteps = isMorning ? 4 : 3;
  const [step, setStep] = useState(0);

  const [sliderValue, setSliderValue] = useState(60);
  const [emotions, setEmotions] = useState<string[]>([]);
  const [dreamYes, setDreamYes] = useState<boolean | null>(null);
  const [dreamText, setDreamText] = useState("");
  const [thoughtText, setThoughtText] = useState("");
  const [goalText, setGoalText] = useState("");
  const [highlightText, setHighlightText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [weekCount, setWeekCount] = useState(0);
  const [saving, setSaving] = useState(false);
  const [popKey, setPopKey] = useState(0);

  useEffect(() => {
    if (open) {
      setStep(0);
      setSliderValue(isMorning ? 60 : 60);
      setEmotions([]);
      setDreamYes(null);
      setDreamText("");
      setThoughtText("");
      setGoalText("");
      setHighlightText("");
      setImproveText("");
    }
  }, [open, isMorning]);

  // Load week progress for stats step
  useEffect(() => {
    if (!open || !user) return;
    (async () => {
      const start = new Date();
      start.setDate(start.getDate() - 6);
      const { data } = await supabase
        .from("daily_checkins")
        .select("checkin_date")
        .eq("user_id", user.id)
        .gte("checkin_date", localDateStr(start));
      const set = new Set((data ?? []).map((r: any) => r.checkin_date));
      setWeekCount(set.size);
    })();
  }, [open, user]);

  const toggleEmotion = (l: string) => {
    setEmotions((p) => (p.includes(l) ? p.filter((x) => x !== l) : [...p, l]));
    setPopKey((k) => k + 1);
  };

  const submit = async () => {
    if (!user) return;
    setSaving(true);
    const moodScore = Math.max(1, Math.min(5, Math.round(sliderValue / 20)));
    await (supabase as any).from("daily_checkins").upsert(
      {
        user_id: user.id,
        checkin_date: localDateStr(new Date()),
        mood_score: moodScore,
        mode,
        sleep_score: isMorning ? Math.round(sliderValue / 20) : null,
        dawn_score: null,
        emotions: emotions.length ? emotions : null,
        dream_note: isMorning && dreamYes ? dreamText || "Sí, soñé" : null,
        thought_note: isMorning ? thoughtText || null : null,
        day_goal: isMorning ? goalText || null : null,
        balance_highlight: !isMorning ? highlightText || null : null,
        balance_improve: !isMorning ? improveText || null : null,
      },
      { onConflict: "user_id,checkin_date,mode" as any }
    );
    toast.success(isMorning ? "Buen día registrado ✨" : "Cierre del día guardado 🌙");
    setSaving(false);
    onComplete?.();
    onClose();
  };

  const next = () => (step < totalSteps - 1 ? setStep(step + 1) : submit());
  const prev = () => (step > 0 ? setStep(step - 1) : onClose());

  const accentText = isMorning ? "text-resma-teal" : "text-resma-gold";
  const accentBg = isMorning ? "bg-resma-teal" : "bg-resma-gold";

  const EmotionGrid = () => (
    <div className="grid grid-cols-3 gap-3">
      {EMOTIONS.map((em) => {
        const on = emotions.includes(em.l);
        return (
          <button
            key={em.l}
            onClick={() => toggleEmotion(em.l)}
            className={`flex aspect-square flex-col items-center justify-center rounded-2xl border-2 backdrop-blur-md transition ${
              on
                ? `border-resma-teal/70 bg-white shadow-[0_8px_24px_-12px_rgba(124,194,200,0.6)]`
                : "border-white/60 bg-white/45"
            }`}
          >
            <span className={`text-3xl ${on ? "animate-pop" : ""}`} key={`${em.l}-${popKey}`}>{em.e}</span>
            <span className={`mt-1 text-[9.5px] font-bold uppercase tracking-[0.1em] ${on ? "text-resma-navy" : "text-muted-foreground"}`}>
              {em.l}
            </span>
          </button>
        );
      })}
    </div>
  );

  const Slider = () => (
    <div className="space-y-3">
      <input
        type="range"
        min={0}
        max={100}
        value={sliderValue}
        onChange={(e) => setSliderValue(parseInt(e.target.value))}
        className="w-full accent-resma-teal"
        style={{ accentColor: isMorning ? "#7cc2c8" : "#facb60" }}
      />
      <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
        <span>Mínimo</span>
        <span>Máximo</span>
      </div>
    </div>
  );

  const StepHeader = ({ title, sub }: { title: string; sub?: string }) => (
    <div className="mb-5 text-center">
      <h2 className="font-serifElegant text-[26px] font-bold leading-tight text-resma-navy">{title}</h2>
      {sub && <p className="mt-1 text-[12.5px] text-muted-foreground">{sub}</p>}
    </div>
  );

  const stepContent = () => {
    if (isMorning) {
      if (step === 0)
        return (
          <div>
            <StepHeader title="¿Cómo dormiste?" sub="Deslizá para calificar tu descanso" />
            <ReactiveCloud value={sliderValue} />
            <div className="mt-5"><ReactiveCloudCaption value={sliderValue} /></div>
            <div className="mt-6"><Slider /></div>
          </div>
        );
      if (step === 1)
        return (
          <div>
            <StepHeader title="¿Qué emociones sentís?" sub="Elegí todas las que apliquen" />
            <EmotionGrid />
          </div>
        );
      if (step === 2)
        return (
          <div>
            <StepHeader title="Tu diario de la mañana" sub="Fricción mínima, solo lo esencial" />
            <div className="space-y-4">
              <div className="glass-premium rounded-2xl p-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">¿Soñaste algo?</p>
                <div className="mt-2 flex gap-2">
                  {[
                    { v: true, l: "Sí" },
                    { v: false, l: "No" },
                  ].map((o) => (
                    <button
                      key={o.l}
                      onClick={() => setDreamYes(o.v)}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm font-bold transition ${
                        dreamYes === o.v
                          ? "border-resma-teal bg-resma-teal/15 text-resma-navy"
                          : "border-foreground/10 bg-white text-muted-foreground"
                      }`}
                    >
                      {o.l}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {dreamYes && (
                    <motion.textarea
                      initial={{ height: 0, opacity: 0, marginTop: 0 }}
                      animate={{ height: "auto", opacity: 1, marginTop: 8 }}
                      exit={{ height: 0, opacity: 0, marginTop: 0 }}
                      value={dreamText}
                      onChange={(e) => setDreamText(e.target.value)}
                      placeholder="Contame brevemente tu sueño…"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-foreground/10 bg-white/80 px-3 py-2 text-[13px] focus:border-resma-teal/60 focus:outline-none"
                    />
                  )}
                </AnimatePresence>
              </div>
              <textarea
                value={thoughtText}
                onChange={(e) => setThoughtText(e.target.value)}
                placeholder="Algún pensamiento particular para hoy…"
                rows={2}
                className="w-full resize-none rounded-2xl border border-foreground/10 bg-white/70 px-3.5 py-3 text-[13px] focus:border-resma-teal/60 focus:outline-none"
              />
              <div>
                <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">Tu objetivo de hoy</p>
                <textarea
                  value={goalText}
                  onChange={(e) => setGoalText(e.target.value)}
                  placeholder="¿Qué te proponés para hoy?"
                  rows={2}
                  className="w-full resize-none rounded-2xl border border-resma-gold/40 bg-white px-3.5 py-3 text-[13px] focus:border-resma-gold focus:outline-none"
                />
              </div>
            </div>
          </div>
        );
      return (
        <div>
          <StepHeader title="Tu progreso semanal" sub="Cada día cuenta" />
          <RadialWeekProgress value={Math.max(weekCount, 1)} />
          <p className="mt-4 px-4 text-center font-serifElegant text-[15px] italic text-muted-foreground">
            "La constancia es más poderosa que la intensidad."
          </p>
        </div>
      );
    }

    // NIGHT
    if (step === 0)
      return (
        <div>
          <StepHeader title="¿Cómo estuvo tu día?" sub="Deslizá según cómo lo viviste" />
          <ReactiveMoon value={sliderValue} />
          <div className="mt-5"><ReactiveMoonCaption value={sliderValue} /></div>
          <div className="mt-6"><Slider /></div>
        </div>
      );
    if (step === 1)
      return (
        <div>
          <StepHeader title="Emociones predominantes" sub="El cierre del día" />
          <EmotionGrid />
        </div>
      );
    return (
      <div>
        <StepHeader title="Balance nocturno" sub="Un cierre introspectivo" />
        <div className="space-y-3">
          <div>
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground/80">¿Qué destacarías de tu día?</p>
            <textarea
              value={highlightText}
              onChange={(e) => setHighlightText(e.target.value)}
              placeholder="Una cosa que te llevás…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-foreground/10 bg-white/70 px-3.5 py-3 text-[13px] focus:border-resma-teal/60 focus:outline-none"
            />
          </div>
          <div>
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-resma-gold">✨ ¿Qué te gustaría mejorar mañana?</p>
            <textarea
              value={improveText}
              onChange={(e) => setImproveText(e.target.value)}
              placeholder="Se propagará a tu mañana de mañana…"
              rows={3}
              className="w-full resize-none rounded-2xl border border-resma-gold/40 bg-amber-50/60 px-3.5 py-3 text-[13px] focus:border-resma-gold focus:outline-none"
            />
          </div>
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-md"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            className="resma-bg-gradient relative mx-auto min-h-screen w-full max-w-md px-5 pt-10 pb-32"
          >
            <div className="glow-blob animate-blob-a" style={{ background: "#7cc2c8", width: 240, height: 240, top: -60, left: -40 }} />
            <div className="glow-blob animate-blob-b" style={{ background: "#facb60", width: 220, height: 220, bottom: 80, right: -60 }} />

            <div className="relative mb-6 flex items-center gap-3">
              <button
                onClick={prev}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 bg-white/70 backdrop-blur-md"
              >
                <ArrowLeft size={16} />
              </button>
              <div className="flex flex-1 justify-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all ${
                      i === step ? `w-8 ${accentBg}` : i < step ? `w-3 ${accentBg} opacity-60` : "w-3 bg-foreground/10"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 bg-white/70 backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>

            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.28 }}
              className="relative"
            >
              {stepContent()}
            </motion.div>

            <div className="fixed inset-x-0 bottom-0 mx-auto max-w-md px-5 pb-6 pt-4">
              <button
                disabled={saving}
                onClick={next}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-resma-navy py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-xl transition disabled:opacity-50 active:scale-[0.98]"
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
