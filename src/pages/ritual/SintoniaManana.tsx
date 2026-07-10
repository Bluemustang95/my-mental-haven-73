import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  Leaf,
  Plus,
  Moon,
  Feather,
  Zap,
  Wind,
  Droplet,
  Flame,
  CloudRain,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { RitualShell } from "@/components/ritual/RitualShell";

// ---------- Datos ----------
const EMOCIONES = [
  { id: "calma",       label: "Calma",       color: "#5dbf9a", Icon: Feather,   anim: "orb-anim-breathe", desc: "Serenidad, presencia suave" },
  { id: "alegria",     label: "Energía",     color: "#facb60", Icon: Zap,       anim: "orb-anim-radiate", desc: "Energía luminosa, ganas" },
  { id: "ansiedad",    label: "Ansiedad",    color: "#a996ff", Icon: Wind,      anim: "orb-anim-vibrate", desc: "Aceleración, anticipación" },
  { id: "tristeza",    label: "Tristeza",    color: "#7aa8de", Icon: Droplet,   anim: "orb-anim-wave",    desc: "Peso, ternura sin dirección" },
  { id: "enojo",       label: "Enojo",       color: "#f28b82", Icon: Flame,     anim: "orb-anim-flash",   desc: "Fuego, límite tensionado" },
  { id: "agotamiento", label: "Agotamiento", color: "#b8b8c4", Icon: CloudRain, anim: "orb-anim-sink",    desc: "Escasez, cuerpo pesado" },
];

const VALORES = [
  { id: "presencia",    label: "Presencia",    hint: "Estar acá, ahora" },
  { id: "conexion",     label: "Conexión",     hint: "Cuidar mis vínculos" },
  { id: "creatividad",  label: "Creatividad",  hint: "Crear algo nuevo" },
  { id: "salud",        label: "Salud",        hint: "Cuidar mi cuerpo" },
  { id: "aprendizaje",  label: "Aprendizaje",  hint: "Saber, crecer" },
  { id: "autenticidad", label: "Autenticidad", hint: "Ser fiel a mí" },
  { id: "compasion",    label: "Compasión",    hint: "Trato amable" },
  { id: "trabajo",      label: "Trabajo",      hint: "Aporte con oficio" },
  { id: "libertad",     label: "Libertad",     hint: "Espacio propio" },
  { id: "gratitud",     label: "Gratitud",     hint: "Reconocer lo que hay" },
];

// Paleta por slot — cada hoja se pinta distinto al elegirse
const SLOT_COLORS = [
  { grad: "linear-gradient(135deg, #a9dcc4 0%, #5dbf9a 100%)", border: "#3f9c78", chip: "#3f9c78" }, // esmeralda
  { grad: "linear-gradient(135deg, #ffd58a 0%, #f2a65a 100%)", border: "#c9803a", chip: "#c9803a" }, // ámbar
  { grad: "linear-gradient(135deg, #c9a6ff 0%, #8a6ee0 100%)", border: "#6d4fbf", chip: "#6d4fbf" }, // lavanda
  { grad: "linear-gradient(135deg, #ffb0b0 0%, #f28b82 100%)", border: "#d15a52", chip: "#d15a52" }, // coral
];

const MAX_VALUES = 4;
const MAX_GOALS = 3;

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

  // Paso 1
  const [sleep, setSleep] = useState(60);
  const [dreamYes, setDreamYes] = useState<boolean | null>(null);
  const [dreamText, setDreamText] = useState("");
  // Paso 2
  const [emotions, setEmotions] = useState<string[]>([]);
  // Paso 3
  const [values, setValues] = useState<string[]>([]);
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [goals, setGoals] = useState<string[]>([""]);
  const [improveFromYesterday, setImproveFromYesterday] = useState<string | null>(null);

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

  // Tinte de fondo según emociones seleccionadas (paso 2)
  const emotionTint = useMemo(() => {
    if (!emotions.length) return null;
    const colors = emotions
      .map((id) => EMOCIONES.find((e) => e.id === id)?.color)
      .filter(Boolean) as string[];
    if (!colors.length) return null;
    return `radial-gradient(circle at 20% 15%, ${colors[0]}55, transparent 55%), radial-gradient(circle at 85% 30%, ${
      colors[1] ?? colors[0]
    }44, transparent 60%), radial-gradient(circle at 50% 90%, ${
      colors[2] ?? colors[0]
    }33, transparent 65%)`;
  }, [emotions]);

  const toggleEmotion = (id: string) =>
    setEmotions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const pickValueForSlot = (valueId: string) => {
    setValues((prev) => {
      if (pickerSlot == null) return prev;
      // Si ya está en otro slot, no duplicar
      if (prev.includes(valueId) && prev[pickerSlot] !== valueId) return prev;
      const next = [...prev];
      while (next.length <= pickerSlot) next.push("");
      next[pickerSlot] = valueId;
      return next;
    });
    setPickerSlot(null);
  };

  const clearSlot = (slotIdx: number) => {
    setValues((prev) => {
      const next = [...prev];
      next[slotIdx] = "";
      return next;
    });
  };

  const filledValues = values.filter(Boolean);

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
        thought_note: filledValues.length
          ? `Valores del día: ${filledValues
              .map((v) => VALORES.find((x) => x.id === v)?.label ?? v)
              .join(", ")}`
          : null,
        day_goal: goals.filter((g) => g.trim()).join(" · ") || null,
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
    if (step === 2) return filledValues.length > 0;
    return true;
  };

  const handleNext = () => {
    if (step === 2) return save();
    if (step === 3) return navigate("/");
    setStep((s) => Math.min(totalSteps - 1, s + 1));
  };

  const handleBack = () => {
    if (step === 0 || step === 3) navigate("/");
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
      {/* Tint sutil según emociones */}
      {step === 1 && emotionTint && (
        <div
          className="pointer-events-none fixed inset-0 -z-10 transition-opacity duration-700"
          style={{ background: emotionTint, opacity: 0.55 }}
        />
      )}

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
              <span>Poco · 0%</span>
              <span className="text-resma-navy" style={{ color: sleepState.color }}>
                {sleep}%
              </span>
              <span>Profundo · 100%</span>
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
                  animate={{ height: 160, opacity: 1, marginTop: 10 }}
                  exit={{ height: 0, opacity: 0, marginTop: 0 }}
                  value={dreamText}
                  onChange={(e) => setDreamText(e.target.value)}
                  placeholder="Contame tu sueño con el detalle que quieras…"
                  className="w-full resize-y rounded-xl border border-foreground/10 bg-white/80 px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-resma-teal/60 focus:outline-none"
                  style={{ minHeight: 120 }}
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
          sub="Tocá para sintonizar. Podés elegir varias."
        >
          <div className="mt-6 -mx-5 overflow-x-auto no-scrollbar">
            <div className="flex snap-x snap-mandatory gap-4 px-5 pb-2">
              {EMOCIONES.map((em) => {
                const on = emotions.includes(em.id);
                return (
                  <button
                    key={em.id}
                    onClick={() => toggleEmotion(em.id)}
                    className={`group relative flex w-[150px] shrink-0 snap-center flex-col items-center rounded-3xl border p-4 transition ${
                      on
                        ? "border-white/90 bg-white/80 shadow-[0_18px_44px_-18px_rgba(16,25,39,0.28)]"
                        : "border-white/50 bg-white/45"
                    }`}
                  >
                    <EmotionOrb em={em} active={on} />
                    <p className="mt-4 font-serifElegant text-[16px] font-semibold text-resma-navy">
                      {em.label}
                    </p>
                    <p className="mt-1 text-center text-[11px] leading-snug text-muted-foreground">
                      {em.desc}
                    </p>
                    {on && (
                      <span
                        className="mt-3 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9.5px] font-bold uppercase tracking-[0.1em]"
                        style={{ background: `${em.color}22`, color: em.color }}
                      >
                        <Check size={10} strokeWidth={3} /> Elegida
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Nebulosa emocional — siempre visible */}
          <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Tu nebulosa emocional
            </p>
            <div className="relative mt-3 flex min-h-[64px] flex-wrap items-center gap-3">
              {emotions.length === 0 && (
                <p className="text-[12px] italic text-muted-foreground/70">
                  Elegí una emoción para empezar a formarla…
                </p>
              )}
              <AnimatePresence>
                {emotions.map((id) => {
                  const em = EMOCIONES.find((x) => x.id === id)!;
                  return (
                    <motion.div
                      key={id}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      className="flex items-center gap-1.5"
                    >
                      <span
                        className="inline-block h-5 w-5 rounded-full"
                        style={{
                          background: `radial-gradient(circle at 32% 30%, #ffffffcc, ${em.color} 65%)`,
                          boxShadow: `0 0 14px ${em.color}`,
                        }}
                      />
                      <span className="text-[12px] font-medium text-resma-navy">{em.label}</span>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>
        </StepHeader>
      )}

      {step === 2 && (
        <StepHeader
          kicker="Paso 3 · Intención"
          title="¿Qué valores riegan tu día?"
          sub="Tocá una hoja para cultivarla"
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

          <div className="mt-6">
            <ValueBranch
              selected={values}
              onSlot={(idx) => setPickerSlot(idx)}
              onClear={clearSlot}
              valueLabel={(id) => VALORES.find((v) => v.id === id)?.label ?? ""}
            />
          </div>

          <div className="mt-4 rounded-2xl border border-white/60 bg-white/60 p-3 text-center text-[12.5px] leading-relaxed text-muted-foreground backdrop-blur">
            Presioná una hoja punteada para <b className="text-resma-navy">elegir un valor</b> y cultivar tus intenciones de hoy 🌱
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                Intenciones de hoy (opcional)
              </p>
              <span className="text-[10px] font-semibold text-muted-foreground/70">
                {goals.filter((g) => g.trim()).length}/{MAX_GOALS}
              </span>
            </div>
            <div className="space-y-2">
              {goals.map((g, i) => (
                <div key={i} className="relative">
                  <textarea
                    value={g}
                    onChange={(e) =>
                      setGoals((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))
                    }
                    placeholder={
                      i === 0
                        ? "Una frase corta que oriente tu día…"
                        : `Otra intención (${i + 1}/${MAX_GOALS})`
                    }
                    rows={2}
                    className="w-full resize-y rounded-2xl border border-resma-gold/40 bg-white px-3.5 py-3 pr-9 text-[13.5px] leading-relaxed focus:border-resma-gold focus:outline-none"
                    style={{ minHeight: 60 }}
                  />
                  {goals.length > 1 && (
                    <button
                      onClick={() =>
                        setGoals((prev) => prev.filter((_, idx) => idx !== i))
                      }
                      aria-label="Quitar intención"
                      className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white/90 text-muted-foreground shadow-sm active:scale-90"
                    >
                      <X size={12} />
                    </button>
                  )}
                </div>
              ))}
              {goals.length < MAX_GOALS && (
                <button
                  onClick={() => setGoals((prev) => [...prev, ""])}
                  className="flex w-full items-center justify-center gap-1.5 rounded-2xl border border-dashed border-resma-gold/50 bg-white/60 px-3 py-2.5 text-[12px] font-semibold text-resma-gold active:scale-[0.98]"
                >
                  <Plus size={13} /> Agregar otra intención
                </button>
              )}
            </div>
          </div>

          {/* Picker propio (evita colisión de z-index con RitualShell) */}
          <ValuePicker
            open={pickerSlot != null}
            onClose={() => setPickerSlot(null)}
            values={VALORES}
            disabledIds={values.filter((v, i) => v && i !== pickerSlot)}
            currentId={pickerSlot != null ? values[pickerSlot] : undefined}
            onPick={pickValueForSlot}
          />
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
              {filledValues.length ? (
                filledValues.map((v) => {
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
            {goals.filter((g) => g.trim()).length > 0 && (
              <div className="mt-4 space-y-2 border-t border-foreground/5 pt-3">
                {goals.filter((g) => g.trim()).map((g, i) => (
                  <p key={i} className="font-serifElegant text-[14.5px] italic leading-snug text-resma-navy/85">
                    "{g}"
                  </p>
                ))}
              </div>
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
          boxShadow: `0 20px 60px -20px ${state.color}`,
        }}
      />
    </div>
  );
}

function EmotionOrb({
  em,
  active,
}: {
  em: { color: string; anim: string; Icon: React.ComponentType<any> };
  active: boolean;
}) {
  const { color, anim, Icon } = em;
  return (
    <div className="relative flex h-[92px] w-[92px] items-center justify-center">
      <div
        className="absolute rounded-full blur-xl transition-opacity"
        style={{
          width: 92,
          height: 92,
          background: color,
          opacity: active ? 0.55 : 0.18,
        }}
      />
      <div
        className={`relative flex h-[78px] w-[78px] items-center justify-center rounded-full transition-transform ${
          active ? anim : ""
        }`}
        style={{
          background: active
            ? `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.92), ${color} 62%, ${color}cc 100%)`
            : `${color}`,
          boxShadow: active
            ? `0 14px 30px -10px ${color}`
            : `0 6px 16px -8px ${color}88`,
        }}
      >
        <Icon size={30} strokeWidth={2.2} className="text-white drop-shadow" />
      </div>
    </div>
  );
}

// Rama con 4 hojas: 2 izquierda, 2 derecha
function ValueBranch({
  selected,
  onSlot,
  onClear,
  valueLabel,
}: {
  selected: string[];
  onSlot: (idx: number) => void;
  onClear: (idx: number) => void;
  valueLabel: (id: string) => string;
}) {
  // Slots: {side: 'L'|'R', yPct, idx}
  const slots = [
    { idx: 0, side: "L" as const, y: 22 },
    { idx: 1, side: "R" as const, y: 40 },
    { idx: 2, side: "L" as const, y: 62 },
    { idx: 3, side: "R" as const, y: 80 },
  ];

  return (
    <div className="relative mx-auto h-[340px] w-full max-w-[320px]">
      {/* Trunk */}
      <svg
        viewBox="0 0 100 340"
        preserveAspectRatio="none"
        className="absolute left-1/2 top-0 h-full -translate-x-1/2"
        width="60"
        height="340"
      >
        <line x1="50" y1="10" x2="50" y2="330" stroke="#8a7a66" strokeWidth="3" strokeLinecap="round" />
        {slots.map((s) => (
          <line
            key={s.idx}
            x1="50"
            y1={s.y * 3.4}
            x2={s.side === "L" ? 20 : 80}
            y2={s.y * 3.4 - (s.side === "L" ? 8 : -8)}
            stroke="#8a7a66"
            strokeWidth="1.2"
            strokeDasharray="2 3"
            opacity="0.6"
          />
        ))}
      </svg>

      {slots.map((s) => {
        const id = selected[s.idx];
        const filled = !!id;
        const palette = SLOT_COLORS[s.idx % SLOT_COLORS.length];
        const style: React.CSSProperties = {
          top: `${s.y}%`,
          [s.side === "L" ? "right" : "left"]: "52%",
          transform: `translateY(-50%) ${s.side === "L" ? "rotate(-14deg)" : "rotate(14deg)"}`,
        };
        return (
          <div key={s.idx} className="absolute" style={style}>
            <button
              onClick={() => (filled ? onClear(s.idx) : onSlot(s.idx))}
              className={`group relative flex h-[58px] w-[126px] items-center justify-center px-3 text-[11.5px] font-bold uppercase tracking-[0.12em] transition ${
                filled ? "text-resma-navy" : "text-muted-foreground/70"
              }`}
              style={{
                background: filled ? palette.grad : "rgba(255,255,255,0.55)",
                border: filled ? `1.5px solid ${palette.border}` : "1.5px dashed #b8b3a8",
                borderRadius: s.side === "L" ? "60% 20% 60% 20% / 50% 30% 70% 50%" : "20% 60% 20% 60% / 30% 50% 50% 70%",
                backdropFilter: "blur(4px)",
                boxShadow: filled ? `0 12px 26px -14px ${palette.border}aa` : undefined,
              }}
            >
              {filled ? (
                <span className="flex items-center gap-1 text-center leading-tight">
                  <Leaf size={12} className="shrink-0" style={{ color: palette.border }} />
                  <span className="truncate">{valueLabel(id)}</span>
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Plus size={13} strokeWidth={2.5} />
                  Valor {s.idx + 1}
                </span>
              )}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function ValuePicker({
  open,
  onClose,
  values,
  disabledIds,
  currentId,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  values: { id: string; label: string; hint: string }[];
  disabledIds: string[];
  currentId?: string;
  onPick: (id: string) => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", stiffness: 260, damping: 28 }}
            className="fixed inset-x-0 bottom-0 z-[121] max-h-[82vh] overflow-y-auto rounded-t-3xl border-t border-white/60 bg-white/95 px-5 pt-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] shadow-2xl backdrop-blur-xl"
          >
            <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-foreground/15" />
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-resma-teal">
                  Herbario de valores
                </p>
                <h3 className="mt-0.5 font-serifElegant text-[20px] text-resma-navy">
                  Elegir un valor
                </h3>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-foreground/10 bg-white active:scale-95"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2.5 pb-4">
              {values.map((v) => {
                const disabled = disabledIds.includes(v.id) && v.id !== currentId;
                const active = v.id === currentId;
                return (
                  <button
                    key={v.id}
                    disabled={disabled}
                    onClick={() => onPick(v.id)}
                    className={`rounded-2xl border p-3 text-left transition ${
                      active
                        ? "border-resma-teal bg-resma-teal/15"
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
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
