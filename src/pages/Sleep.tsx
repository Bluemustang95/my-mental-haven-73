import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Check, Moon, PencilSimple, Sparkle } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

const sections = [
  {
    title: "Antes de dormir",
    icon: Sparkle,
    decoration: ["✨", "🌙", "😴"],
    items: [
      "Hacé ejercicio regularmente, pero evitalo justo antes de acostarte.",
      "Evitá el alcohol, la cafeína y la nicotina por la tarde y noche.",
      "Si tenés problemas para dormir de noche, no duermas siesta.",
    ],
  },
  {
    title: "En la habitación",
    icon: Moon,
    decoration: ["🌙", "😴", "✨", "🌙"],
    items: [
      "Mantené el cuarto fresco, oscuro y en silencio.",
      "Usá la cama solo para dormir; evitá trabajar, leer o ver TV ahí.",
      "Establecé horarios fijos para acostarte y despertarte.",
      "Tomá un baño, escuchá música suave o leé algo liviano antes de acostarte.",
    ],
  },
  {
    title: "Cuando cuesta dormir",
    icon: PencilSimple,
    decoration: ["😴", "✨"],
    items: [
      "Si estás abrumado, escribí tus preocupaciones para dejarlas de lado.",
      "Si no podés dormir, levantate y hacé algo relajante fuera del cuarto hasta que vuelva el sueño.",
    ],
  },
];

type View = "intro" | "content" | "done";

export default function Sleep() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("intro");
  const [step, setStep] = useState(0);
  const current = sections[step];
  const Icon = current.icon;

  const goBack = () => {
    if (view === "intro") navigate("/herramientas");
    else if (view === "done") setView("content");
    else if (step > 0) setStep(step - 1);
    else setView("intro");
  };

  const goNext = () => {
    if (step < sections.length - 1) setStep(step + 1);
    else setView("done");
  };

  if (view === "intro") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-sleep-bg px-5 pt-12 pb-6 text-resource-sleep-accent safe-area-top">
        <button onClick={() => navigate("/herramientas")} className="mb-8 flex h-11 w-11 items-center justify-center rounded-full bg-card/70 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center justify-center pb-8 text-center">
          <motion.div animate={{ y: [0, -7, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="mb-10 flex h-24 w-24 items-center justify-center">
            <img src={resmitaAvatar} alt="Resmita" className="h-20 w-20 object-contain drop-shadow-md" />
          </motion.div>
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-card/70 shadow-sm shadow-resource-sleep-accent/10">
            <Moon size={28} weight="duotone" />
          </div>
          <h1 className="mb-3 font-mindful text-3xl leading-tight sm:text-4xl">Sueño</h1>
          <p className="max-w-xs font-sans text-xs font-normal leading-6 text-resource-sleep-accent/70 sm:text-sm sm:leading-7">
            La higiene del sueño te ayuda a preparar el descanso con hábitos simples, acompañando al cuerpo y la mente para dormir mejor.
          </p>
        </motion.div>
        <button onClick={() => setView("content")} className="flex w-full items-center justify-center gap-3 rounded-[2.5rem] bg-resource-sleep-accent py-4 font-sans text-base font-bold text-primary-foreground shadow-lg shadow-resource-sleep-accent/20 transition-transform active:scale-[0.98]">
          Ver recomendaciones <ArrowRight size={20} weight="bold" />
        </button>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-resource-sleep-bg px-5 py-8 text-center text-resource-sleep-accent safe-area-top">
        <motion.div initial={{ scale: 0.86, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.6, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
            <img src={resmitaAvatar} alt="Resmita" className="h-20 w-20 object-contain drop-shadow-md" />
          </motion.div>
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-card/80 shadow-xl shadow-resource-sleep-accent/10">
            <Check size={40} weight="bold" />
          </div>
          <h1 className="font-mindful text-3xl leading-tight">¡Dulces sueños!</h1>
          <p className="mt-4 font-sans text-xs font-normal leading-6 text-resource-sleep-accent/75 sm:text-sm sm:leading-7">Si los problemas de sueño son crónicos, la Terapia Cognitivo-Conductual es el enfoque más efectivo para abordarlos de manera profunda.</p>
          <button onClick={() => navigate("/herramientas")} className="mt-9 w-full rounded-[2.5rem] bg-resource-sleep-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-sleep-accent/20 active:scale-[0.98]">
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-resource-sleep-bg px-5 pt-14 pb-5 text-resource-sleep-accent transition-colors safe-area-top">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/70 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div>
          <p className="font-display text-lg font-semibold">Sueño</p>
          <p className="text-xs font-medium text-resource-sleep-accent/65">Paso {step + 1} de {sections.length} · {current.title}</p>
        </div>
      </div>

      <div className="mb-7 flex gap-2">
        {sections.map((section, index) => (
          <div key={section.title} className={cn("h-2 flex-1 rounded-full transition-colors", index <= step ? "bg-resource-sleep-accent" : "bg-card/80")} />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={step} initial={{ opacity: 0, x: 32 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -32 }} transition={{ duration: 0.24 }} className="flex-1">
          <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-[1.75rem] bg-card/70 shadow-sm shadow-resource-sleep-accent/10">
            <Icon size={30} weight="duotone" />
          </div>
          <h1 className="font-mindful text-3xl leading-tight">{current.title}</h1>
          <div className="mt-6 space-y-3">
            {current.items.map((item, index) => (
              <div key={item}>
                {index > 0 && (
                  <div className="my-3 flex items-center justify-center gap-3 text-lg text-resource-sleep-accent/45" aria-hidden="true">
                    <span className="h-px w-12 bg-resource-sleep-accent/10" />
                    <span>{current.decoration[index % current.decoration.length]}</span>
                    <span className="h-px w-12 bg-resource-sleep-accent/10" />
                  </div>
                )}
                <div className="rounded-[2rem] border border-resource-sleep-accent/15 bg-card/70 p-4 shadow-sm backdrop-blur">
                  <p className="text-sm font-semibold leading-6 text-resource-sleep-accent/80">{item}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={goBack} className="rounded-[2.5rem] border border-resource-sleep-accent/20 bg-card/70 py-3.5 font-display text-sm font-semibold shadow-sm active:scale-[0.98]">
          Atrás
        </button>
        <button onClick={goNext} className="rounded-[2.5rem] bg-resource-sleep-accent py-3.5 font-display text-sm font-semibold text-primary-foreground shadow-lg shadow-resource-sleep-accent/20 transition-all active:scale-[0.98]">
          {step === sections.length - 1 ? "Finalizar" : "Siguiente"}
        </button>
      </div>
    </div>
  );
}