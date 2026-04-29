import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, ArrowLeft, Brain, CheckCircle2, Dumbbell, Eye, Footprints, Hand, Shield, Snowflake, Waves, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

type View = "intro" | "stop" | "tipPrecaution" | "tip" | "finish";

const skyShadow = "shadow-[0_18px_35px_hsl(var(--resource-regulation-accent)/0.18)]";

const stopSteps = [
  {
    letter: "S",
    title: "Stop (Pará)",
    text: "¡Congelate! No reacciones. Tus emociones intentan que actúes sin pensar. Mantené el control.",
    icon: Hand,
  },
  {
    letter: "T",
    title: "Tomá un paso atrás",
    text: "Alejate de la situación. Tomate un descanso y respirá profundo. No dejes que las emociones decidan por vos.",
    icon: Footprints,
  },
  {
    letter: "O",
    title: "Observá",
    text: "Mirá qué pasa adentro y afuera tuyo. ¿Qué sentís? ¿Qué piensan los otros?",
    icon: Eye,
  },
  {
    letter: "P",
    title: "Procedé con Mindfulness",
    text: "Consultá a tu Mente Sabia. Pensá en tus objetivos: ¿Qué acción mejoraría la situación ahora?",
    icon: Brain,
  },
];

const tipSteps = [
  {
    letter: "T",
    title: "Temperatura",
    text: "Sumergí la cara en agua fría o usá una compresa fría por 30 segundos.",
    icon: Snowflake,
  },
  {
    letter: "I",
    title: "Ejercicio Intenso",
    text: "Corré, saltá o bailá por un tiempo corto para gastar la energía acumulada por la emoción.",
    icon: Dumbbell,
  },
  {
    letter: "P",
    title: "Respiración y Relajación",
    text: "Inhalá profundo durante 5 segundos y exhalá lento durante 7 segundos. Sumá relajación muscular: tensá y soltá de a poco.",
    icon: Wind,
  },
];

export default function EmotionalRegulation() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("intro");
  const [stopIndex, setStopIndex] = useState(0);
  const [showPrecaution, setShowPrecaution] = useState(false);

  const close = () => navigate("/herramientas");
  const goBack = () => {
    if (view === "intro") close();
    else setView("intro");
  };

  const currentStop = stopSteps[stopIndex];
  const StopIcon = currentStop.icon;

  return (
    <main className="min-h-screen bg-resource-regulation-bg px-4 pb-28 pt-10 font-sans text-resource-regulation-accent safe-area-top">
      <div className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-md flex-col">
        <header className="mb-4 flex items-center justify-between">
          <button
            onClick={goBack}
            className="flex h-11 w-11 items-center justify-center rounded-full border border-resource-regulation-accent/15 bg-card/75 text-resource-regulation-accent shadow-sm transition-transform active:scale-95"
            aria-label="Volver"
          >
            <ArrowLeft size={20} />
          </button>
          <span className="rounded-full bg-card/75 px-4 py-2 font-sans text-xs font-semibold text-resource-regulation-accent shadow-sm">
            Regulación Emocional
          </span>
        </header>

        <AnimatePresence mode="wait">
          {view === "intro" && (
            <motion.section
              key="intro"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-1 flex-col items-center justify-center gap-4 text-center"
            >
              <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} className="relative flex h-24 w-24 items-center justify-center">
                <img src={resmitaAvatar} alt="Resmita" className="relative h-20 w-20 object-contain drop-shadow-xl" />
              </motion.div>

              <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-card/80 shadow-sm shadow-resource-regulation-accent/10">
                <Zap size={38} strokeWidth={2.2} />
              </div>

              <div className="px-5 py-5 sm:px-6 sm:py-7">
                <h1 className="mb-3 font-mindful text-3xl leading-tight text-resource-regulation-accent sm:text-4xl">Regulación Emocional</h1>
                <p className="font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm sm:leading-7">
                  Herramientas de emergencia para cambiar la química de tu cuerpo y retomar el control cuando tus emociones te agobian.
                </p>
              </div>

              <div className="w-full space-y-3">
                <button onClick={() => { setStopIndex(0); setView("stop"); }} className={cn("flex w-full items-center gap-4 rounded-[3rem] bg-resource-regulation-accent px-6 py-5 text-left font-sans text-primary-foreground transition-transform active:scale-95", coralShadow)}>
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card/20"><Shield size={24} /></span>
                  <span><span className="block text-base font-bold">Habilidad STOP</span><span className="text-xs font-semibold opacity-85">Para frenar impulsos</span></span>
                </button>
                <button onClick={() => setView("tip")} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-5 text-left font-sans text-resource-regulation-accent shadow-sm transition-transform active:scale-95">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Zap size={24} /></span>
                  <span><span className="block text-base font-bold">Habilidad TIP</span><span className="text-xs font-semibold opacity-70">Para cambiar la química corporal</span></span>
                </button>
              </div>
            </motion.section>
          )}

          {view === "stop" && (
            <motion.section key="stop" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className="flex flex-1 flex-col justify-center">
              <div className="mb-6 text-center">
                <h1 className="font-mindful text-3xl leading-tight text-resource-regulation-accent sm:text-4xl">Habilidad STOP</h1>
                <p className="mt-2 font-sans text-xs font-normal leading-6 text-resource-regulation-accent/65 sm:text-sm sm:leading-7">Avanzá paso a paso antes de actuar.</p>
              </div>

              <div className="rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 p-6 text-center shadow-sm">
                <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-[2.25rem] bg-resource-regulation-bg shadow-inner">
                  <StopIcon size={36} />
                </div>
                <p className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-accent font-display text-2xl font-semibold text-primary-foreground">{currentStop.letter}</p>
                <h2 className="font-mindful text-3xl leading-tight">{currentStop.title}</h2>
                <p className="mt-4 font-sans text-sm font-normal leading-7 text-resource-regulation-accent/75">{currentStop.text}</p>
              </div>

              <div className="mt-5 grid grid-cols-4 gap-2">
                {stopSteps.map((step, index) => <span key={step.letter} className={cn("h-2 rounded-full", index <= stopIndex ? "bg-resource-regulation-accent" : "bg-resource-regulation-accent/15")} />)}
              </div>

              <button onClick={() => stopIndex === stopSteps.length - 1 ? setView("finish") : setStopIndex((index) => index + 1)} className={cn("mt-6 w-full rounded-[3rem] bg-resource-regulation-accent px-8 py-4 font-sans text-base font-bold text-primary-foreground transition-transform active:scale-95 sm:py-5", coralShadow)}>
                {stopIndex === stopSteps.length - 1 ? "Terminar" : "Siguiente"}
              </button>
            </motion.section>
          )}

          {view === "tip" && (
            <motion.section key="tip" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className="flex flex-1 flex-col justify-center">
              <div className="mb-5 text-center">
                <h1 className="font-mindful text-3xl leading-tight text-resource-regulation-accent sm:text-4xl">Habilidad TIP</h1>
                <p className="mt-2 font-sans text-xs font-normal leading-6 text-resource-regulation-accent/65 sm:text-sm sm:leading-7">Técnicas de choque biológico para bajar la intensidad emocional.</p>
              </div>

              <div className="space-y-3">
                {tipSteps.map((step) => {
                  const Icon = step.icon;
                  return (
                    <div key={step.letter} className="rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 p-5 shadow-sm">
                      <div className="mb-3 flex items-center gap-3">
                        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-accent font-display text-xl font-semibold text-primary-foreground">{step.letter}</span>
                        <Icon size={24} />
                        <h2 className="font-mindful text-2xl leading-tight">{step.title}</h2>
                      </div>
                      <p className="font-sans text-xs font-normal leading-6 text-resource-regulation-accent/75 sm:text-sm sm:leading-7">{step.text}</p>
                    </div>
                  );
                })}
              </div>

              <button onClick={() => setShowPrecaution((value) => !value)} className="mt-4 flex w-full items-center justify-center gap-2 rounded-[3rem] border border-resource-regulation-accent/20 bg-card/85 px-5 py-3.5 font-sans text-xs font-bold shadow-sm active:scale-[0.98]">
                <AlertTriangle size={17} /> Precaución TIP
              </button>
              <AnimatePresence>
                {showPrecaution && (
                  <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden px-4 pt-3 text-center font-sans text-xs font-semibold leading-6 text-resource-regulation-accent/70">
                    Consultá a tu médico antes de usar TIP si tenés afecciones cardíacas, trastornos alimentarios o tomás betabloqueantes.
                  </motion.p>
                )}
              </AnimatePresence>

              <button onClick={() => setView("finish")} className={cn("mt-5 w-full rounded-[3rem] bg-resource-regulation-accent px-8 py-4 font-sans text-base font-bold text-primary-foreground transition-transform active:scale-95 sm:py-5", coralShadow)}>
                Terminar
              </button>
            </motion.section>
          )}

          {view === "finish" && (
            <motion.section key="finish" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }} className="flex flex-1 flex-col items-center justify-center text-center">
              <motion.div animate={{ y: [-7, 7, -7], rotate: [-2, 2, -2] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} className="mb-6 flex h-32 w-32 items-center justify-center">
                <img src={resmitaAvatar} alt="Resmita" className="h-28 w-28 object-contain drop-shadow-2xl" />
              </motion.div>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-card/85 shadow-xl shadow-resource-regulation-accent/10">
                <CheckCircle2 size={42} />
              </div>
              <h1 className="font-mindful text-3xl leading-tight text-resource-regulation-accent sm:text-4xl">Mente en control</h1>
              <p className="mt-4 font-sans text-xs font-normal leading-6 text-resource-regulation-accent/75 sm:text-sm sm:leading-7">Cambiando tu química corporal, recuperás el control de tu mente.</p>
              <div className="mt-8 flex w-full gap-3">
                <button onClick={() => setView("intro")} className="flex-1 rounded-[3rem] border border-resource-regulation-accent/20 bg-card/85 py-4 font-sans text-sm font-bold shadow-sm active:scale-[0.98]">Volver</button>
                <button onClick={close} className="flex-1 rounded-[3rem] bg-resource-regulation-accent py-4 font-sans text-sm font-bold text-primary-foreground shadow-lg shadow-resource-regulation-accent/20 active:scale-[0.98]">Cerrar</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
