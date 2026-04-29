import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

const senses = [
  { count: 5, title: "Vista", action: "Mirá", prompt: "Nombrá 5 cosas que podés ver", placeholder: "Algo que ves" },
  { count: 4, title: "Tacto", action: "Tocá", prompt: "Nombrá 4 cosas que podés tocar", placeholder: "Algo que tocás" },
  { count: 3, title: "Oído", action: "Escuchá", prompt: "Nombrá 3 sonidos que podés escuchar", placeholder: "Algo que escuchás" },
  { count: 2, title: "Olfato", action: "Sentí", prompt: "Nombrá 2 aromas que podés oler", placeholder: "Algo que olés" },
  { count: 1, title: "Gusto", action: "Sentí", prompt: "Nombrá 1 sabor que podés saborear", placeholder: "Algo que saboreás" },
];

const supportMessages = [
  "No hay apuro, tomate tu tiempo",
  "No hay apuro, tomate tu tiempo",
  "si te distraes no te juzgues, vuelve de a poco a conectar con el presente",
  "si te distraes no te juzgues, vuelve de a poco a conectar con el presente",
  "si te distraes no te juzgues, vuelve de a poco a conectar con el presente",
];
const stepBackgrounds = ["bg-resource-grounding-bg", "bg-resource-grounding-bg", "bg-resource-grounding-bg", "bg-resource-grounding-bg", "bg-resource-grounding-bg"];

type View = "intro" | "exercise" | "done";

export default function Grounding() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("intro");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[][]>(senses.map((sense) => Array(sense.count).fill("")));

  const current = senses[step];
  const canNext = answers[step].some((value) => value.trim().length > 0);

  const updateAnswer = (index: number, value: string) => {
    setAnswers((prev) => prev.map((group, groupIndex) => groupIndex === step ? group.map((item, itemIndex) => itemIndex === index ? value : item) : group));
  };

  const goBack = () => {
    if (view === "intro") navigate("/herramientas");
    else if (view === "done") setView("exercise");
    else if (step > 0) setStep(step - 1);
    else setView("intro");
  };

  const goNext = () => {
    if (step < senses.length - 1) setStep(step + 1);
    else setView("done");
  };

  if (view === "intro") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-grounding-bg px-5 pt-12 pb-6 safe-area-top">
        <button onClick={() => navigate("/herramientas")} className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-card/70 text-resource-grounding-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>

        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="mb-12 flex h-24 w-24 items-center justify-center"
          >
            <img src={resmitaAvatar} alt="Resmita" className="h-20 w-20 object-contain drop-shadow-md" />
          </motion.div>
          <h1 className="mb-3 font-mindful text-3xl leading-tight text-resource-grounding-accent sm:text-4xl">Grounding</h1>
          <p className="max-w-xs font-sans text-xs font-normal leading-6 text-resource-grounding-accent/70 sm:text-sm sm:leading-7">
            Es una técnica para volver al presente. Te ayuda a bajar la ansiedad rápido conectando con tus 5 sentidos.
          </p>
        </motion.div>

        <button onClick={() => setView("exercise")} className="flex w-full items-center justify-center gap-3 rounded-[2.5rem] bg-resource-grounding-accent py-4 font-sans text-base font-bold text-primary-foreground shadow-lg shadow-resource-grounding-accent/20 transition-transform active:scale-[0.98]">
          Comenzar <ArrowRight size={20} weight="bold" />
        </button>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-resource-grounding-bg px-5 py-8 text-center safe-area-top">
        <motion.div initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full bg-card/80 text-resource-grounding-accent shadow-xl shadow-resource-grounding-accent/10">
            <Check size={48} weight="bold" />
          </div>
          <h1 className="font-mindful text-3xl leading-tight text-foreground">Aquí y ahora.</h1>
          <p className="mt-4 font-sans text-xs font-normal leading-6 text-foreground/75 sm:text-sm sm:leading-7">Lograste reconectar con tu entorno. Tu cuerpo y tu mente te lo agradecen.</p>
          <button onClick={() => navigate("/herramientas")} className="mt-9 w-full rounded-[2.5rem] bg-resource-grounding-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-grounding-accent/20 active:scale-[0.98]">
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen flex-col overflow-x-hidden px-5 pt-14 pb-5 transition-colors safe-area-top", stepBackgrounds[step])}>
      <div className="mb-5 flex items-center gap-3">
        <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/70 text-resource-grounding-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="font-display text-lg font-semibold text-foreground">Grounding</p>
          <p className="text-xs font-medium text-resource-grounding-accent">Paso {step + 1} de 5 · {current.title}</p>
        </div>
      </div>

      <div className="mb-7 flex gap-2">
        {senses.map((sense, index) => (
          <div key={sense.title} className={cn("h-2 flex-1 rounded-full transition-colors", index <= step ? "bg-resource-grounding-accent" : "bg-card/80")} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.24 }} className="flex-1">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="font-display text-6xl font-semibold leading-none text-resource-grounding-accent">{current.count}</p>
              <h1 className="mt-3 font-mindful text-3xl leading-tight text-foreground">{current.action} alrededor</h1>
              <p className="mt-2 font-sans text-xs font-normal leading-6 text-foreground/70 sm:text-sm sm:leading-7">{current.prompt}.</p>
            </div>
          </div>

          <div className="space-y-3">
            {Array.from({ length: current.count }).map((_, index) => (
              <input
                key={`${current.title}-${index}`}
                type="text"
                value={answers[step][index] || ""}
                onChange={(event) => updateAnswer(index, event.target.value)}
                placeholder={`${index + 1}. ${current.placeholder}`}
                className="w-full rounded-2xl border border-card/70 bg-card/75 px-4 py-3.5 font-sans text-sm text-foreground shadow-sm shadow-resource-grounding-accent/5 outline-none backdrop-blur placeholder:text-foreground/35 focus:border-resource-grounding-accent/40 focus:ring-2 focus:ring-resource-grounding-accent/15"
                autoFocus={index === 0}
              />
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-6 flex items-center gap-3 rounded-[2rem] bg-card/60 p-3 shadow-sm backdrop-blur">
        <img src={resmitaAvatar} alt="Resmita" className="h-10 w-10 shrink-0 object-contain" />
        <p className="font-display text-xs font-semibold leading-5 text-resource-grounding-accent sm:text-sm">{supportMessages[step]}</p>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={goBack} className="rounded-[2.5rem] border border-resource-grounding-accent/20 bg-card/70 py-3.5 font-display text-sm font-semibold text-resource-grounding-accent shadow-sm active:scale-[0.98]">
          Atrás
        </button>
        <button onClick={goNext} disabled={!canNext} className={cn("rounded-[2.5rem] py-3.5 font-display text-sm font-semibold shadow-lg transition-all active:scale-[0.98]", canNext ? "bg-resource-grounding-accent text-primary-foreground shadow-resource-grounding-accent/20" : "bg-card/70 text-foreground/35 shadow-none")}>
          {step === senses.length - 1 ? "Finalizar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}
