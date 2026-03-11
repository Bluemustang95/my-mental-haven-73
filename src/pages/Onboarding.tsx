import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const lifeStages = [
  { value: "adolescence", label: "Adolescencia", desc: "13 – 17 años" },
  { value: "young-adult", label: "Adultez joven", desc: "18 – 25 años" },
  { value: "adult", label: "Adultez", desc: "26 – 40 años" },
  { value: "mid-adult", label: "Adultez media", desc: "41 – 55 años" },
  { value: "older-adult", label: "Adultez mayor", desc: "56+ años" },
];

const areasOfInterest = [
  "Ansiedad y estrés", "Estado de ánimo", "Hábitos y rutinas",
  "Relaciones interpersonales", "Autoestima y autoconocimiento",
  "Duelo o pérdidas", "Trauma", "Regulación emocional",
  "Productividad y enfoque", "Crianza", "Orientación vocacional",
];

const recentFeelings = [
  { value: "sleep", label: "Me cuesta dormir" },
  { value: "sadness", label: "Me siento triste o sin energía" },
  { value: "anxiety", label: "Estoy muy ansioso/a" },
  { value: "thoughts", label: "Tengo pensamientos que no puedo frenar" },
  { value: "focus", label: "Me cuesta concentrarme" },
  { value: "loneliness", label: "Me siento solo/a" },
  { value: "hardtime", label: "Estoy pasando un momento difícil" },
  { value: "habits", label: "Quiero mejorar mis hábitos" },
  { value: "growth", label: "Estoy bien pero quiero crecer" },
];

const treatmentOptions = [
  { value: "linked", label: "Sí, estoy en tratamiento", desc: "Podés vincularte con tu profesional RESMA" },
  { value: "seeking", label: "No, pero me gustaría empezar", desc: "Te ayudamos a encontrar un profesional" },
  { value: "self", label: "Solo quiero usar las herramientas", desc: "Acceso directo al inicio" },
];

export default function Onboarding() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [lifeStage, setLifeStage] = useState("");
  const [areas, setAreas] = useState<string[]>([]);
  const [feelings, setFeelings] = useState<string[]>([]);
  const [treatment, setTreatment] = useState("");

  const toggleItem = (list: string[], setList: (v: string[]) => void, item: string) => {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  };

  const canProceed = () => {
    if (step === 1) return !!lifeStage;
    if (step === 2) return areas.length > 0;
    if (step === 3) return feelings.length > 0;
    if (step === 4) return !!treatment;
    return true;
  };

  const handleFinish = async () => {
    if (user) {
      await supabase.from("patient_app_profiles").upsert({
        user_id: user.id,
        life_stage: lifeStage,
        areas_of_interest: areas,
        recent_feelings: feelings,
        treatment_status: treatment,
        onboarding_completed: true,
      }, { onConflict: "user_id" });
    }
    navigate("/");
  };

  const next = () => {
    if (step === 4) handleFinish();
    else setStep((s) => s + 1);
  };

  const slideVariants = {
    enter: { x: 80, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -80, opacity: 0 },
  };

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-8 safe-area-top">
      {step > 0 && (
        <div className="mb-8 flex gap-1.5">
          {[1, 2, 3, 4].map((s) => (
            <div key={s} className={cn("h-1 flex-1 rounded-full transition-colors", s <= step ? "bg-accent" : "bg-border")} />
          ))}
        </div>
      )}

      <AnimatePresence mode="wait">
        <motion.div key={step} variants={slideVariants} initial="enter" animate="center" exit="exit" transition={{ duration: 0.25 }} className="flex-1">
          {step === 0 && (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <div className="mb-8 flex h-20 w-20 items-center justify-center rounded-3xl bg-accent/20">
                <span className="font-display text-3xl font-bold text-accent-foreground">R</span>
              </div>
              <h1 className="mb-3 font-display text-2xl font-semibold leading-tight">Tu espacio seguro para cuidar tu salud mental</h1>
              <p className="mb-10 max-w-xs text-sm text-muted-foreground">Herramientas de autogestión, acompañamiento y acceso a tratamiento profesional.</p>
              <button onClick={() => setStep(1)} className="flex items-center gap-2 rounded-2xl bg-primary px-8 py-3 font-display text-sm font-medium text-primary-foreground transition-transform active:scale-95">
                Comenzar <ArrowRight size={16} />
              </button>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="mb-2 font-display text-xl font-semibold">¿En qué etapa de la vida estás?</h2>
              <p className="mb-6 text-sm text-muted-foreground">Esto nos ayuda a personalizar tu experiencia.</p>
              <div className="space-y-3">
                {lifeStages.map((s) => (
                  <button key={s.value} onClick={() => setLifeStage(s.value)} className={cn("w-full rounded-2xl border p-4 text-left transition-all", lifeStage === s.value ? "border-accent bg-accent/10" : "border-border bg-card")}>
                    <p className="font-display text-sm font-medium">{s.label}</p>
                    <p className="text-xs text-muted-foreground">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="mb-2 font-display text-xl font-semibold">¿Qué te gustaría trabajar?</h2>
              <p className="mb-6 text-sm text-muted-foreground">Podés elegir varias opciones.</p>
              <div className="flex flex-wrap gap-2">
                {areasOfInterest.map((area) => (
                  <button key={area} onClick={() => toggleItem(areas, setAreas, area)} className={cn("rounded-full border px-4 py-2 font-display text-xs font-medium transition-all", areas.includes(area) ? "border-accent bg-accent/10 text-accent-foreground" : "border-border bg-card text-muted-foreground")}>
                    {area}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="mb-2 font-display text-xl font-semibold">¿Qué sentís que te estuvo pasando últimamente?</h2>
              <p className="mb-6 text-sm text-muted-foreground">Seleccioná las que te identifiquen.</p>
              <div className="space-y-2">
                {recentFeelings.map((f) => (
                  <button key={f.value} onClick={() => toggleItem(feelings, setFeelings, f.value)} className={cn("w-full rounded-2xl border p-3.5 text-left font-display text-sm transition-all", feelings.includes(f.value) ? "border-accent bg-accent/10 font-medium" : "border-border bg-card text-muted-foreground")}>
                    {f.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="mb-2 font-display text-xl font-semibold">¿Estás actualmente en tratamiento psicológico?</h2>
              <p className="mb-6 text-sm text-muted-foreground">Esto no afecta tu acceso a las herramientas.</p>
              <div className="space-y-3">
                {treatmentOptions.map((opt) => (
                  <button key={opt.value} onClick={() => setTreatment(opt.value)} className={cn("w-full rounded-2xl border p-4 text-left transition-all", treatment === opt.value ? "border-accent bg-accent/10" : "border-border bg-card")}>
                    <p className="font-display text-sm font-medium">{opt.label}</p>
                    <p className="text-xs text-muted-foreground">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {step > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <button onClick={() => setStep((s) => s - 1)} className="flex items-center gap-1 font-display text-sm text-muted-foreground">
            <ArrowLeft size={14} /> Atrás
          </button>
          <button onClick={next} disabled={!canProceed()} className={cn("flex items-center gap-2 rounded-2xl px-6 py-2.5 font-display text-sm font-medium transition-all", canProceed() ? "bg-primary text-primary-foreground active:scale-95" : "bg-muted text-muted-foreground")}>
            {step === 4 ? "Empezar" : "Siguiente"} <ArrowRight size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
