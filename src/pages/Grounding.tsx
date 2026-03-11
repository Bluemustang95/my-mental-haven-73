import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Check } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const senses = [
  { count: 5, sense: "cosas que podés VER", placeholder: "Ej: la pared, una luz, mis manos, un cuadro, el techo" },
  { count: 4, sense: "cosas que podés TOCAR", placeholder: "Ej: la silla, mi ropa, el piso, mi cara" },
  { count: 3, sense: "cosas que podés ESCUCHAR", placeholder: "Ej: el viento, mi respiración, ruido de fondo" },
  { count: 2, sense: "cosas que podés OLER", placeholder: "Ej: el aire, perfume" },
  { count: 1, sense: "cosa que podés SABOREAR", placeholder: "Ej: el café que tomé" },
];

export default function Grounding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>(Array(5).fill(""));
  const [completed, setCompleted] = useState(false);

  const current = senses[step];

  const next = () => {
    if (step < 4) {
      setStep(step + 1);
      setInputs(Array(senses[step + 1].count).fill(""));
    } else {
      setCompleted(true);
    }
  };

  const canNext = inputs.slice(0, current.count).some((v) => v.trim().length > 0);

  if (completed) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 safe-area-top">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <Check size={28} className="text-success" weight="bold" />
          </div>
          <h2 className="mb-2 font-display text-lg font-semibold">Ejercicio completado</h2>
          <p className="mb-6 text-sm text-muted-foreground">Buen trabajo anclándote al presente.</p>
          <button
            onClick={() => navigate("/herramientas")}
            className="rounded-2xl bg-primary px-6 py-2.5 font-display text-sm font-medium text-primary-foreground"
          >
            Volver a herramientas
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/herramientas")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Grounding 5-4-3-2-1</h1>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-1">
        {senses.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-border")} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ x: 60, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -60, opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          <div className="mb-2 font-display text-5xl font-light text-accent">{current.count}</div>
          <h2 className="mb-6 font-display text-base font-medium">
            Nombrá {current.count} {current.sense}
          </h2>

          <div className="space-y-3">
            {Array.from({ length: current.count }).map((_, i) => (
              <input
                key={i}
                type="text"
                value={inputs[i] || ""}
                onChange={(e) => {
                  const newInputs = [...inputs];
                  newInputs[i] = e.target.value;
                  setInputs(newInputs);
                }}
                placeholder={i === 0 ? current.placeholder : `${i + 1}.`}
                className="w-full rounded-xl border border-border bg-card p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                autoFocus={i === 0}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <button
        onClick={next}
        disabled={!canNext}
        className={cn(
          "mt-6 w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
          canNext ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground"
        )}
      >
        {step === 4 ? "Finalizar" : "Siguiente"}
      </button>
    </div>
  );
}
