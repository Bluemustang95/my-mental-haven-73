import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Leaf, Plus, ArrowLeft, Moon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { RitualShell } from "@/components/ritual/RitualShell";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

// ---------- Datos ----------
const EMOCIONES = [
  { id: "calma",     label: "Calma",       color: "#7cc2c8", anim: "orb-anim-breathe",  desc: "Serenidad, presencia suave" },
  { id: "alegria",   label: "Alegría",     color: "#facb60", anim: "orb-anim-radiate",  desc: "Energía luminosa, ganas" },
  { id: "ansiedad",  label: "Ansiedad",    color: "#c9a6ff", anim: "orb-anim-vibrate",  desc: "Aceleración, anticipación" },
  { id: "tristeza",  label: "Tristeza",    color: "#8fb3d9", anim: "orb-anim-wave",     desc: "Peso, ternura sin dirección" },
  { id: "enojo",     label: "Enojo",       color: "#f28b82", anim: "orb-anim-flash",    desc: "Fuego, límite tensionado" },
  { id: "agotamiento", label: "Agotamiento", color: "#b8b8c4", anim: "orb-anim-sink",    desc: "Escasez, cuerpo pesado" },
];

const VALORES = [
  { id: "presencia",    label: "Presencia",     hint: "Estar acá, ahora" },
  { id: "conexion",     label: "Conexión",      hint: "Cuidar mis vínculos" },
  { id: "creatividad",  label: "Creatividad",   hint: "Crear algo nuevo" },
  { id: "salud",        label: "Salud",         hint: "Cuidar mi cuerpo" },
  { id: "aprendizaje",  label: "Aprendizaje",   hint: "Saber, crecer" },
  { id: "autenticidad", label: "Autenticidad",  hint: "Ser fiel a mí" },
  { id: "compasion",    label: "Compasión",     hint: "Trato amable" },
  { id: "trabajo",      label: "Trabajo",       hint: "Aporte con oficio" },
  { id: "libertad",     label: "Libertad",      hint: "Espacio propio" },
  { id: "gratitud",     label: "Gratitud",      hint: "Reconocer lo que hay" },
];

// ---------- Helpers ----------
function sleepStateFromValue(v: number) {
  if (v < 40) return { label: "Poco reparador", color: "#b8b8c4", anim: "orb-anim-sink" };
  if (v < 65) return { label: "Aceptable",      color: "#facb60", anim: "orb-anim-breathe" };
  if (v < 85) return { label: "Reparador",      color: "#7cc2c8", anim: "orb-anim-breathe" };
  return {          label: "Profundo",         color: "#5dbf9a", anim: "orb-anim-radiate" };
}

// ---------- Página principal ----------
export default function SintoniaManana() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Paso 1 — Sueño
  const [sleep, setSleep] = useState(60);
  const [dreamYes, setDreamYes] = useState<boolean | null>(null);
  const [dreamText, setDreamText] = useState("");
  // Paso 2 — Emociones
  const [emotions, setEmotions] = useState<string[]>([]);
  // Paso 3 — Valores + intención
  const [values, setValues] = useState<string[]>([]);
  const [valuesSheet, setValuesSheet] = useState(false);
  const [goalText, setGoalText] = useState("");
  const [improveFromYesterday, setImproveFromYesterday] = useState<string | null>(null);

  // Cargar puente noche→mañana
  useEffect(() => {
    if (!user) return;
    (async () => {
      const yStr = localDateStr(new Date(Date.now() - 86400000));
      const { data } = await supabase
        .from("daily_checkins")
        .select("balance_improve")
        .eq("user_id", user.id)
        .eq("checkin_date", yStr)
        .eq("mode", "night")
        .maybeSingle();
      if ((data as any)?.balance_improve) setImproveFromYesterday((data as any).balance_improve);
    })();
  }, [user]);

  const sleepState = useMemo(() => sleepStateFromValue(sleep), [sleep]);

  const toggleEmotion = (id: string) =>
    setEmotions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleValue = (id: string) =>
    setValues((p) =>
      p.includes(id) ? p.filter((x) => x !== id) : p.length >= 3 ? p : [...p, id]
    );

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const moodScore = Math.max(1, Math.min(5, Math.round(sleep / 20)));
    const emotionLabels = emotions.map((id) => EMOCIONES.find((e) => e.id === id)?.label ?? id);
    await (supabase as any).from("daily_checkins").upsert(
      {
        user_id: user.id,
        checkin_date: localDateStr(new Date()),
        mode: "morning",
        mood_score: moodScore,
        sleep_score: Math.round(sleep / 20),
        emotions: emotionLabels.length ? emotionLabels : null,
        dream_note: dreamYes ? dreamText || "Sí, soñé" : null,
        thought_note: values.length
          ? `Valores del día: ${values
              .map((v) => VALORES.find((x) => x.id === v)?.label ?? v)
              .join(", ")}`
          : null,
        day_goal: goalText || null,
      },
      { onConflict: "user_id,checkin_date,mode" as any }
    );
    setSaving(false);
    toast.success("Sintonía guardada ✨", { className: "resma-soft-toast" });
    setStep(3);
  };

  const totalSteps = 4;
  const isLast = step === totalSteps - 1;

  const canAdvance = () => {
    if (step === 0) return true;
    if (step === 1) return emotions.length > 0;
    if (step === 2) return values.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 2) {
      save();
      return;
    }
    if (step === 3) {
      navigate("/");
      return;
    }
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const handleBack = () => {
    if (step === 0) navigate("/");
    else if (step === 3) navigate("/");
    else setStep((s) => s - 1);
  };

  return (
    <RitualShell
      step={step}
      totalSteps={totalSteps}
      onBack={handleBack}
      onClose={() => navigate("/")}
      onNext={handleNext}
      nextDisabled={saving || !canAdvance()}
      isLast={isLast}
      nextLabel={
        step === 2 ? "Sellar sintonía" : step === 3 ? "Volver al inicio" : undefined
      }
      accent="teal"
    >
      {step === 0 && (
        <StepHeader
          kicker="Paso 1 · Cuerpo"
          title="¿Cómo despertaste?"
          sub="Deslizá para sintonizar tu descanso"
        >
          <div className="mt-8 flex items-center justify-center">
            <SleepOrb value={sleep} state={sleepState} />
          </div>
          <p className="mt-6 text-center font-serifElegant text-[17px] italic text-resma-navy/80">
            {sleepState.label}
          </p>

          <div className="mt-8 space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              value={sleep}
              onChange={(e) => setSleep(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: sleepState.color, touchAction: "pan-x" }}
            />
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              <span>Poco</span>
              <span>Profundo</span>
            </div>
          </div>

          {sleep < 40 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 rounded-2xl border border-amber-200/70 bg-amber-50/70 p-4"
            >
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-700">
                Autocompasión
              </p>
              <p className="mt-1 text-[13.5px] leading-snug text-resma-navy/85">
                Dormiste poco. No te exijas de más hoy — el cuerpo necesita bajar el estándar sin culpa.
              </p>
            </motion.div>
          )}

          <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              ¿Soñaste algo?
            </p>
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
        </StepHeader>
      )}

      {step === 1 && (
        <StepHeader
          kicker="Paso 2 · Emociones"
          title="¿Qué te habita hoy?"
          sub="Elegí las que sentís al despertar"
        >
          <div className="mt-6 -mx-5 overflow-x-auto no-scrollbar">
            <div className="flex snap-x snap-mandatory gap-4 px-5 pb-2">
              {EMOCIONES.map((em) => {
                const on = emotions.includes(em.id);
                return (
                  <button
                    key={em.id}
                    onClick={() => toggleEmotion(em.id)}
                    className={`group relative flex w-[150px] shrink-0 snap-center flex-col items-center rounded-3xl border p-4 backdrop-blur transition ${
                      on
                        ? "border-white/90 bg-white/75 shadow-[0_12px_36px_-16px_rgba(16,25,39,0.25)]"
                        : "border-white/50 bg-white/40"
                    }`}
                  >
                    <EmotionOrb color={em.color} anim={em.anim} active={on} />
                    <p className="mt-4 font-serifElegant text-[16px] font-semibold text-resma-navy">
                      {em.label}
                    </p>
                    <p className="mt-1 text-center text-[11px] leading-snug text-muted-foreground">
                      {em.desc}
                    </p>
                    {on && (
                      <span className="mt-3 inline-flex items-center gap-1 rounded-full bg-resma-teal/15 px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em] text-resma-teal">
                        <Check size={10} strokeWidth={3} /> Elegida
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {emotions.length > 0 && (
            <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Tu nebulosa emocional
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                {emotions.map((id) => {
                  const em = EMOCIONES.find((x) => x.id === id)!;
                  return (
                    <div key={id} className="flex items-center gap-1.5">
                      <span
                        className="inline-block h-4 w-4 rounded-full"
                        style={{ background: em.color, boxShadow: `0 0 12px ${em.color}` }}
                      />
                      <span className="text-[12px] text-resma-navy">{em.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </StepHeader>
      )}

      {step === 2 && (
        <StepHeader
          kicker="Paso 3 · Intención"
          title="¿Qué valores riegan tu día?"
          sub="Elegí hasta 3 hojas para tu rama"
        >
          {improveFromYesterday && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 rounded-2xl border border-resma-gold/40 bg-amber-50/70 p-3.5"
            >
              <div className="flex items-start gap-2">
                <Moon size={14} className="mt-0.5 shrink-0 text-resma-gold" />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                    Anoche quisiste mejorar
                  </p>
                  <p className="mt-0.5 text-[13px] italic leading-snug text-resma-navy/85">
                    "{improveFromYesterday}"
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          <div className="mt-6 flex justify-center">
            <ValueBranch selected={values} />
          </div>

          <button
            onClick={() => setValuesSheet(true)}
            className="mx-auto mt-6 flex items-center gap-2 rounded-full border border-foreground/10 bg-white/70 px-5 py-2.5 text-[12.5px] font-semibold text-resma-navy backdrop-blur active:scale-95"
          >
            <Plus size={14} /> Elegir del herbario
          </button>

          <div className="mt-6">
            <p className="mb-1 px-1 text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Intención de hoy (opcional)
            </p>
            <textarea
              value={goalText}
              onChange={(e) => setGoalText(e.target.value)}
              placeholder="Una frase corta que oriente tu día…"
              rows={2}
              className="w-full resize-none rounded-2xl border border-resma-gold/40 bg-white px-3.5 py-3 text-[13px] focus:border-resma-gold focus:outline-none"
            />
          </div>

          <Sheet open={valuesSheet} onOpenChange={setValuesSheet}>
            <SheetContent side="bottom" className="max-h-[80vh] rounded-t-3xl">
              <SheetHeader>
                <SheetTitle className="font-serifElegant text-[20px] text-resma-navy">
                  Herbario de valores
                </SheetTitle>
                <p className="text-[12px] text-muted-foreground">
                  {values.length}/3 elegidas
                </p>
              </SheetHeader>
              <div className="mt-4 grid grid-cols-2 gap-2.5 overflow-y-auto pb-6">
                {VALORES.map((v) => {
                  const on = values.includes(v.id);
                  const disabled = !on && values.length >= 3;
                  return (
                    <button
                      key={v.id}
                      disabled={disabled}
                      onClick={() => toggleValue(v.id)}
                      className={`rounded-2xl border p-3 text-left transition ${
                        on
                          ? "border-resma-teal bg-resma-teal/10"
                          : disabled
                            ? "border-foreground/5 bg-white/40 opacity-40"
                            : "border-foreground/10 bg-white active:scale-[0.98]"
                      }`}
                    >
                      <div className="flex items-center gap-1.5">
                        <Leaf size={12} className="text-resma-teal" />
                        <p className="font-serifElegant text-[15px] font-semibold text-resma-navy">
                          {v.label}
                        </p>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{v.hint}</p>
                    </button>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        </StepHeader>
      )}

      {step === 3 && (
        <div className="pt-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-resma-teal to-emerald-400 shadow-[0_20px_60px_-20px_rgba(124,194,200,0.7)]"
          >
            <Check size={44} strokeWidth={3} className="text-white" />
          </motion.div>
          <h2 className="mt-8 font-serifElegant text-[26px] font-medium text-resma-navy">
            Estás en sintonía
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Tu mañana quedó cultivada.<br />
            Nos vemos a la noche para cerrar el ciclo.
          </p>

          <div className="mt-8 rounded-3xl border border-white/60 bg-white/60 p-5 text-left backdrop-blur">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-resma-gold" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Tu rama de hoy
              </p>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {values.length ? (
                values.map((v) => {
                  const val = VALORES.find((x) => x.id === v);
                  return (
                    <span
                      key={v}
                      className="rounded-full bg-resma-teal/15 px-3 py-1 text-[12px] font-semibold text-resma-navy"
                    >
                      🌿 {val?.label}
                    </span>
                  );
                })
              ) : (
                <span className="text-[12.5px] italic text-muted-foreground">
                  Sin valores elegidos hoy.
                </span>
              )}
            </div>
            {goalText && (
              <p className="mt-4 border-t border-foreground/5 pt-3 font-serifElegant text-[15px] italic text-resma-navy/85">
                "{goalText}"
              </p>
            )}
          </div>
        </div>
      )}
    </RitualShell>
  );
}

// ---------- Sub-componentes ----------
function StepHeader({
  kicker,
  title,
  sub,
  children,
}: {
  kicker: string;
  title: string;
  sub?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-resma-teal">
        {kicker}
      </p>
      <h1 className="mt-2 text-center font-serifElegant text-[28px] font-medium leading-tight text-resma-navy">
        {title}
      </h1>
      {sub && <p className="mt-2 text-center text-[13px] text-muted-foreground">{sub}</p>}
      {children}
    </div>
  );
}

function SleepOrb({
  value,
  state,
}: {
  value: number;
  state: { color: string; anim: string; label: string };
}) {
  const size = 190 + value * 0.4;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 260, height: 260 }}>
      <div
        className="absolute rounded-full blur-2xl"
        style={{ width: size, height: size, background: state.color, opacity: 0.35 }}
      />
      <div
        className={`relative rounded-full ${state.anim}`}
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.85), ${state.color} 55%, ${state.color}dd 100%)`,
          color: state.color,
          boxShadow: `0 20px 60px -20px ${state.color}`,
        }}
      />
    </div>
  );
}

function EmotionOrb({ color, anim, active }: { color: string; anim: string; active: boolean }) {
  return (
    <div className="relative flex h-[90px] w-[90px] items-center justify-center">
      <div
        className="absolute rounded-full blur-xl transition-opacity"
        style={{
          width: 90,
          height: 90,
          background: color,
          opacity: active ? 0.55 : 0.28,
        }}
      />
      <div
        className={`relative h-[76px] w-[76px] rounded-full ${anim}`}
        style={{
          background: `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.9), ${color} 60%, ${color}cc 100%)`,
          color,
          boxShadow: `0 10px 26px -10px ${color}`,
        }}
      />
    </div>
  );
}

function ValueBranch({ selected }: { selected: string[] }) {
  return (
    <svg viewBox="0 0 260 200" width="260" height="200" className="overflow-visible">
      <path
        d="M 30 180 Q 90 140 130 100 T 240 30"
        stroke="#5a4a3a"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {[
        { x: 88, y: 145, rot: -30, idx: 0 },
        { x: 145, y: 92, rot: 20, idx: 1 },
        { x: 210, y: 55, rot: -10, idx: 2 },
      ].map((slot) => {
        const filled = !!selected[slot.idx];
        const label = filled
          ? VALORES.find((v) => v.id === selected[slot.idx])?.label
          : null;
        return (
          <g key={slot.idx} transform={`translate(${slot.x} ${slot.y}) rotate(${slot.rot})`}>
            {filled ? (
              <g className="animate-grow-leaf">
                <path
                  d="M 0 0 Q 14 -22 28 -8 Q 20 8 0 6 Z"
                  fill="#7cc2c8"
                  opacity="0.85"
                />
                <path d="M 2 2 Q 14 -10 26 -6" stroke="#3f7a80" strokeWidth="1" fill="none" />
                <text
                  x={14}
                  y={22}
                  fontSize="9"
                  fill="#101927"
                  textAnchor="middle"
                  fontWeight="600"
                  transform={`rotate(${-slot.rot} 14 22)`}
                >
                  {label}
                </text>
              </g>
            ) : (
              <circle
                cx={10}
                cy={-4}
                r={9}
                fill="rgba(255,255,255,0.7)"
                stroke="#c9b89a"
                strokeDasharray="3 3"
                strokeWidth="1.5"
              />
            )}
          </g>
        );
      })}
    </svg>
  );
}
