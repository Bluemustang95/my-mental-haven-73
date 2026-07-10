import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Check,
  Sparkles,
  Moon,
  Star,
  Sun,
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
  { id: "calma",       label: "Calma",       color: "#5dbf9a", Icon: Feather,   anim: "orb-anim-breathe", desc: "Serenidad, presencia" },
  { id: "alegria",     label: "Alegría",     color: "#facb60", Icon: Zap,       anim: "orb-anim-radiate", desc: "Luz, disfrute" },
  { id: "ansiedad",    label: "Ansiedad",    color: "#a996ff", Icon: Wind,      anim: "orb-anim-vibrate", desc: "Aceleración interna" },
  { id: "tristeza",    label: "Tristeza",    color: "#7aa8de", Icon: Droplet,   anim: "orb-anim-wave",    desc: "Peso, melancolía" },
  { id: "enojo",       label: "Enojo",       color: "#f28b82", Icon: Flame,     anim: "orb-anim-flash",   desc: "Frontera, fuego" },
  { id: "agotamiento", label: "Agotamiento", color: "#b8b8c4", Icon: CloudRain, anim: "orb-anim-sink",    desc: "Cuerpo vacío" },
];

function energyStateFromValue(v: number) {
  if (v < 30) return { label: "Día pesado",       color: "#8994b5", stars: 2 };
  if (v < 55) return { label: "Día mixto",        color: "#a996ff", stars: 3 };
  if (v < 80) return { label: "Día equilibrado",  color: "#7cc2c8", stars: 4 };
  return {          label: "Día luminoso",       color: "#facb60", stars: 5 };
}

// ---------- Página ----------
export default function BalanceNocturno() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Paso 1 — energía / tono del día
  const [energy, setEnergy] = useState(55);
  // Paso 2 — emociones que sintió durante el día
  const [emotions, setEmotions] = useState<string[]>([]);
  // Paso 3 — valores que honró (chips seleccionables)
  const [morningValues, setMorningValues] = useState<string[]>([]);
  const [morningGoals, setMorningGoals] = useState<string[]>([]);
  const [honored, setHonored] = useState<string[]>([]);
  // Paso 4 — qué mejorar mañana
  const [improve, setImprove] = useState("");
  const [gratitude, setGratitude] = useState("");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("daily_checkins")
        .select("thought_note, day_goal")
        .eq("user_id", user.id)
        .eq("checkin_date", localDateStr(new Date()))
        .eq("mode", "morning")
        .maybeSingle();
      const note = (data as any)?.thought_note ?? "";
      const match = /Valores del día:\s*(.+)/i.exec(note);
      if (match) setMorningValues(match[1].split(",").map((s) => s.trim()).filter(Boolean));
      const goal = (data as any)?.day_goal ?? "";
      if (goal) setMorningGoals(goal.split(" · ").map((s: string) => s.trim()).filter(Boolean));
    })();
  }, [user]);

  const energyState = useMemo(() => energyStateFromValue(energy), [energy]);

  const toggleEmotion = (id: string) =>
    setEmotions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));
  const toggleHonored = (v: string) =>
    setHonored((p) => (p.includes(v) ? p.filter((x) => x !== v) : [...p, v]));

  const save = async () => {
    if (!user) return;
    setSaving(true);
    const moodScore = Math.max(1, Math.min(5, Math.round(energy / 20)));
    const emotionLabels = emotions.map((id) => EMOCIONES.find((e) => e.id === id)?.label ?? id);
    await (supabase as any).from("daily_checkins").upsert(
      {
        user_id: user.id,
        checkin_date: localDateStr(new Date()),
        mode: "night",
        mood_score: moodScore,
        emotions: emotionLabels.length ? emotionLabels : null,
        thought_note: honored.length ? `Valores honrados: ${honored.join(", ")}` : null,
        balance_improve: improve || null,
        gratitude: gratitude || null,
      },
      { onConflict: "user_id,checkin_date,mode" as any }
    );
    setSaving(false);
    toast.success("Balance sellado 🌙", { className: "resma-soft-toast" });
    setStep(3);
  };

  const totalSteps = 4;
  const isLast = step === totalSteps - 1;

  const canAdvance = () => {
    if (step === 0) return true;
    if (step === 1) return emotions.length > 0;
    if (step === 2) return true;
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
        step === 2 ? "Sellar balance" : step === 3 ? "Volver al inicio" : undefined
      }
      accent="gold"
    >
      {/* Fondo nocturno con estrellas */}
      <StarsBackground />

      {step === 0 && (
        <StepHeader
          kicker="Paso 1 · Tono del día"
          title="¿Cómo se sintió tu día?"
          sub="Deslizá para ubicar tu constelación"
        >
          <div className="mt-8 flex items-center justify-center">
            <NightSky value={energy} state={energyState} />
          </div>
          <p className="mt-6 text-center font-serifElegant text-[17px] italic text-resma-navy/80">
            {energyState.label}
          </p>

          <div className="mt-8 space-y-3">
            <input
              type="range"
              min={0}
              max={100}
              value={energy}
              onChange={(e) => setEnergy(parseInt(e.target.value))}
              className="w-full"
              style={{ accentColor: energyState.color, touchAction: "pan-x" }}
            />
            <div className="flex justify-between text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground/70">
              <span>Pesado · 0%</span>
              <span style={{ color: energyState.color }}>{energy}%</span>
              <span>Luminoso · 100%</span>
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Gratitud del día (opcional)
            </p>
            <textarea
              value={gratitude}
              onChange={(e) => setGratitude(e.target.value)}
              placeholder="Algo, alguien o un instante que agradezcas…"
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-foreground/10 bg-white/80 px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-resma-gold/60 focus:outline-none"
              style={{ minHeight: 80 }}
            />
          </div>
        </StepHeader>
      )}

      {step === 1 && (
        <StepHeader
          kicker="Paso 2 · Nebulosa"
          title="¿Qué emociones te habitaron?"
          sub="Sumá todas las que aparecieron"
        >
          <div className="mt-6 -mx-5 overflow-x-auto no-scrollbar">
            <div className="flex snap-x snap-mandatory gap-4 px-5 pb-2">
              {EMOCIONES.map((em) => {
                const on = emotions.includes(em.id);
                return (
                  <button
                    key={em.id}
                    onClick={() => toggleEmotion(em.id)}
                    className={`relative flex w-[150px] shrink-0 snap-center flex-col items-center rounded-3xl border p-4 transition ${
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
                        <Check size={10} strokeWidth={3} /> Vivida
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              Nebulosa emocional del día
            </p>
            <div className="mt-3 flex min-h-[64px] flex-wrap items-center gap-3">
              {emotions.length === 0 && (
                <p className="text-[12px] italic text-muted-foreground/70">
                  Sumá tus emociones para dibujar la nebulosa…
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
          kicker="Paso 3 · Compromiso"
          title="Constelación de valores"
          sub="Marcá los que hoy sí honraste"
        >
          {morningValues.length === 0 ? (
            <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 text-center text-[13px] italic leading-relaxed text-muted-foreground backdrop-blur">
              Hoy no registraste una sintonía matutina.<br />
              Aun así, podés dejar tu intención para mañana en el próximo paso.
            </div>
          ) : (
            <>
              {morningGoals.length > 0 && (
                <div className="mt-4 rounded-2xl border border-resma-gold/30 bg-amber-50/70 p-3.5">
                  <div className="flex items-start gap-2">
                    <Sun size={14} className="mt-0.5 shrink-0 text-resma-gold" />
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-amber-700">
                        Tus intenciones de esta mañana
                      </p>
                      {morningGoals.map((g, i) => (
                        <p key={i} className="mt-0.5 text-[13px] italic leading-snug text-resma-navy/85">
                          "{g}"
                        </p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-5 flex flex-wrap gap-2">
                {morningValues.map((v) => {
                  const on = honored.includes(v);
                  return (
                    <button
                      key={v}
                      onClick={() => toggleHonored(v)}
                      className={`flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[12.5px] font-semibold transition active:scale-95 ${
                        on
                          ? "bg-gradient-to-br from-resma-gold to-amber-400 text-white shadow-[0_10px_20px_-10px_rgba(250,203,96,0.6)]"
                          : "border border-foreground/10 bg-white text-resma-navy"
                      }`}
                    >
                      <Star size={12} strokeWidth={2.5} className={on ? "fill-white" : ""} />
                      {v}
                    </button>
                  );
                })}
              </div>
              <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
                Sin culpa: honrar es un norte, no un examen.
              </p>
            </>
          )}

          <div className="mt-6 rounded-2xl border border-white/60 bg-white/60 p-4 backdrop-blur">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
              ¿Qué querés mejorar mañana?
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground/80">
              Una sola frase. Aparecerá en tu Sintonía matutina.
            </p>
            <textarea
              value={improve}
              onChange={(e) => setImprove(e.target.value)}
              placeholder="Ej: darme una pausa antes de responder…"
              rows={3}
              className="mt-2 w-full resize-y rounded-xl border border-foreground/10 bg-white/80 px-3 py-2.5 text-[13.5px] leading-relaxed focus:border-resma-gold/60 focus:outline-none"
              style={{ minHeight: 90 }}
            />
          </div>
        </StepHeader>
      )}

      {step === 3 && (
        <div className="pt-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 via-purple-600 to-resma-navy shadow-[0_20px_60px_-20px_rgba(93,63,211,0.7)]"
          >
            <Moon size={40} strokeWidth={2} className="text-white" />
          </motion.div>
          <h2 className="mt-8 font-serifElegant text-[26px] font-medium text-resma-navy">
            Tu día quedó sellado
          </h2>
          <p className="mt-2 text-[14px] leading-relaxed text-muted-foreground">
            Descansá tranquila/o.<br />
            Nos vemos mañana con lo que quisiste mejorar.
          </p>

          <div className="mt-8 rounded-3xl border border-white/60 bg-white/60 p-5 text-left backdrop-blur">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-resma-gold" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                Tu balance de hoy
              </p>
            </div>
            {honored.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {honored.map((v) => (
                  <span
                    key={v}
                    className="rounded-full bg-resma-gold/15 px-3 py-1 text-[12px] font-semibold text-resma-navy"
                  >
                    ⭐ {v}
                  </span>
                ))}
              </div>
            )}
            {improve && (
              <div className="mt-4 border-t border-foreground/5 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
                  Mañana quiero mejorar
                </p>
                <p className="mt-1 font-serifElegant text-[15px] italic text-resma-navy/85">
                  "{improve}"
                </p>
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
    <div className="relative">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.22em] text-resma-gold">
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

function StarsBackground() {
  // Estrellas fijas dispersas
  const stars = useMemo(
    () =>
      Array.from({ length: 22 }).map((_, i) => ({
        top: Math.random() * 90,
        left: Math.random() * 100,
        size: 1 + Math.random() * 2,
        delay: Math.random() * 3,
      })),
    []
  );
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className="absolute rounded-full bg-resma-navy/50"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            animation: `orb-radiate 3.6s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

function NightSky({
  value,
  state,
}: {
  value: number;
  state: { color: string; stars: number };
}) {
  const size = 200 + value * 0.4;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 280, height: 280 }}>
      <div
        className="absolute rounded-full blur-3xl"
        style={{ width: size, height: size, background: state.color, opacity: 0.35 }}
      />
      <div
        className="relative flex items-center justify-center rounded-full orb-anim-breathe"
        style={{
          width: size,
          height: size,
          background: `radial-gradient(circle at 32% 28%, rgba(255,255,255,0.9), ${state.color} 55%, #101927 100%)`,
          boxShadow: `0 20px 60px -20px ${state.color}`,
        }}
      >
        <div className="flex gap-1">
          {Array.from({ length: state.stars }).map((_, i) => (
            <Star key={i} size={12} strokeWidth={2} className="fill-white text-white/90" />
          ))}
        </div>
      </div>
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
        style={{ width: 92, height: 92, background: color, opacity: active ? 0.55 : 0.18 }}
      />
      <div
        className={`relative flex h-[78px] w-[78px] items-center justify-center rounded-full transition-transform ${
          active ? anim : ""
        }`}
        style={{
          background: active
            ? `radial-gradient(circle at 32% 30%, rgba(255,255,255,0.92), ${color} 62%, ${color}cc 100%)`
            : color,
          boxShadow: active ? `0 14px 30px -10px ${color}` : `0 6px 16px -8px ${color}88`,
        }}
      >
        <Icon size={30} strokeWidth={2.2} className="text-white drop-shadow" />
      </div>
    </div>
  );
}
