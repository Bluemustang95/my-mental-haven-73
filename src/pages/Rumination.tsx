import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Brain, Check, Cloud, Notepad, Sparkle } from "@phosphor-icons/react";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

type View = "intro" | "record" | "observer" | "done";

const recordSteps = [
  { key: "situation", title: "Situación", prompt: "¿Qué pasó? Describí el acontecimiento.", type: "textarea" },
  { key: "emotion", title: "Emociones", prompt: "¿Qué sentís?", type: "emotion" },
  { key: "thought", title: "Pensamientos automáticos", prompt: "¿Qué te dijiste?", type: "belief" },
  { key: "alternative", title: "Respuesta alternativa", prompt: "¿Qué otra explicación más equilibrada existe?", type: "textarea" },
  { key: "result", title: "Resultado", prompt: "Reevaluá cuánto creés ahora en el primer pensamiento y cómo te sentís.", type: "result" },
];

export default function Rumination() {
  const navigate = useNavigate();
  const [view, setView] = useState<View>("intro");
  const [recordStep, setRecordStep] = useState(0);
  const [recordData, setRecordData] = useState<Record<string, string | number>>({ intensity: 50, belief: 50, finalBelief: 50 });
  const [thought, setThought] = useState("");
  const [cloudText, setCloudText] = useState("");
  const [isReleasing, setIsReleasing] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const current = recordSteps[recordStep];

  const goBack = () => {
    if (view === "intro") navigate("/herramientas");
    else if (view === "record" && recordStep > 0) setRecordStep(recordStep - 1);
    else setView("intro");
  };

  const finish = () => setView("done");

  const transformThought = () => {
    const trimmed = thought.trim();
    if (!trimmed) return;
    setShowSparkles(false);
    setIsReleasing(false);
    setCloudText(`Estoy teniendo el pensamiento de que ${trimmed.toLowerCase()}`);
  };

  const releaseCloud = () => {
    if (!cloudText || isReleasing) return;
    setIsReleasing(true);
    window.setTimeout(() => {
      setCloudText("");
      setThought("");
      setIsReleasing(false);
      setShowSparkles(true);
      window.setTimeout(() => setShowSparkles(false), 1800);
    }, 2600);
  };

  if (view === "intro") {
    return (
      <div className="flex min-h-screen flex-col bg-resource-rumination-bg px-5 pt-12 pb-6 text-resource-rumination-accent safe-area-top">
        <button onClick={() => navigate("/herramientas")} className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="flex flex-1 flex-col items-center text-center">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }} className="mb-4 flex h-20 w-20 items-center justify-center">
            <img src={resmitaAvatar} alt="Resmita" className="h-16 w-16 object-contain drop-shadow-md" />
          </motion.div>
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-[2rem] bg-card/80 shadow-sm shadow-resource-rumination-accent/10">
            <Brain size={34} weight="duotone" />
          </div>
          <h1 className="font-display text-4xl font-semibold leading-tight">Rumiación</h1>
          <p className="mt-4 max-w-sm text-base font-semibold leading-7 text-resource-rumination-accent/75">
            La rumiación es cuando tu mente da vueltas sobre el mismo tema una y otra vez. Estas herramientas te ayudan a ver tus pensamientos desde afuera para que dejen de pesarte tanto.
          </p>
          <p className="mt-4 rounded-[2rem] bg-card/65 px-5 py-3 text-sm font-semibold leading-6 text-resource-rumination-accent/70">
            No hay apuro, tomate tu tiempo
          </p>
          <div className="mt-7 w-full space-y-3">
            <button onClick={() => { setRecordStep(0); setView("record"); }} className="flex w-full items-center gap-4 rounded-[2.5rem] border border-resource-rumination-accent/15 bg-card/85 p-5 text-left shadow-sm active:scale-[0.98]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-resource-rumination-accent/10"><Notepad size={24} weight="duotone" /></span>
              <span><span className="block font-display text-base font-semibold">Registro de Pensamientos</span><span className="text-xs font-semibold opacity-65">Cuadro TCC paso a paso</span></span>
            </button>
            <button onClick={() => setView("observer")} className="flex w-full items-center gap-4 rounded-[2.5rem] border border-resource-rumination-accent/15 bg-card/85 p-5 text-left shadow-sm active:scale-[0.98]">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-resource-rumination-accent/10"><Cloud size={24} weight="duotone" /></span>
              <span><span className="block font-display text-base font-semibold">Nube de Pensamientos</span><span className="text-xs font-semibold opacity-65">Defusión ACT</span></span>
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (view === "done") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-resource-rumination-bg px-5 py-8 text-center text-resource-rumination-accent safe-area-top">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm">
          <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut" }} className="mx-auto mb-7 flex h-24 w-24 items-center justify-center">
            <img src={resmitaAvatar} alt="Resmita" className="h-20 w-20 object-contain drop-shadow-md" />
          </motion.div>
          <div className="mx-auto mb-7 flex h-20 w-20 items-center justify-center rounded-full bg-card/85 shadow-xl shadow-resource-rumination-accent/10">
            <Check size={40} weight="bold" />
          </div>
          <h1 className="font-display text-3xl font-semibold leading-tight">¡Mente clara!</h1>
          <p className="mt-4 text-base font-semibold leading-7 text-resource-rumination-accent/75">Mirar tus pensamientos es el primer paso para liberarte de ellos. ¡Mente clara!</p>
          <p className="mt-4 rounded-[2rem] bg-card/65 px-5 py-3 text-sm font-semibold leading-6 text-resource-rumination-accent/70">
            si te distraes no te juzgues, vuelve de a poco a conectar con el presente
          </p>
          <button onClick={() => navigate("/herramientas")} className="mt-9 w-full rounded-[2.5rem] bg-resource-rumination-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-rumination-accent/20 active:scale-[0.98]">
            Cerrar
          </button>
        </motion.div>
      </div>
    );
  }

  if (view === "observer") {
    return (
      <div className="relative flex min-h-screen flex-col overflow-hidden bg-resource-rumination-bg px-5 pt-14 pb-5 text-resource-rumination-accent safe-area-top">
        <span className="absolute left-8 top-28 text-resource-rumination-accent/25">✦</span>
        <span className="absolute right-10 top-44 text-resource-rumination-accent/30">✨</span>
        <span className="absolute bottom-32 left-12 text-resource-rumination-accent/20">✧</span>
        <div className="mb-5 flex items-center gap-3">
          <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm"><ArrowLeft size={20} /></button>
          <div><p className="font-display text-lg font-semibold">Nube de Pensamientos</p><p className="text-xs font-semibold text-resource-rumination-accent/65">Observalo y soltalo</p></div>
        </div>
        <div className="rounded-[2.5rem] border border-resource-rumination-accent/15 bg-card/85 p-5 shadow-sm backdrop-blur">
          <p className="mb-3 text-center text-sm font-semibold leading-6 text-resource-rumination-accent/75">Escribí un pensamiento que te esté molestando.</p>
          <textarea value={thought} onChange={(e) => setThought(e.target.value)} placeholder="No voy a poder..." className="min-h-[92px] w-full resize-none rounded-[2rem] border border-resource-rumination-accent/15 bg-resource-rumination-bg/70 p-4 text-center text-sm font-semibold outline-none placeholder:text-resource-rumination-accent/35 focus:ring-2 focus:ring-resource-rumination-accent/20" />
          <button onClick={transformThought} className="mt-3 w-full rounded-[2.5rem] bg-resource-rumination-accent py-3.5 font-display text-sm font-semibold text-primary-foreground shadow-lg shadow-resource-rumination-accent/20 active:scale-[0.98]">
            Transformar
          </button>
        </div>
        <div className="relative mt-5 flex min-h-[230px] flex-1 items-center justify-center overflow-hidden rounded-[2.5rem] border border-resource-rumination-accent/10 bg-card/35">
          <AnimatePresence>
            {cloudText && (
              <motion.div
                key={cloudText}
                initial={{ opacity: 0, y: 26, scale: 0.9 }}
                animate={isReleasing ? { opacity: 0, y: -190, scale: 0.08 } : { opacity: 1, y: [0, -8, 0], scale: 1 }}
                exit={{ opacity: 0, y: -190, scale: 0.08 }}
                transition={isReleasing ? { duration: 2.6, ease: "easeInOut" } : { duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="max-w-[310px] rounded-[3rem] border border-resource-rumination-accent/15 bg-card px-7 py-6 text-center shadow-xl shadow-resource-rumination-accent/10"
              >
                <Cloud className="mx-auto mb-2" size={34} weight="duotone" />
                <p className="text-base font-semibold leading-7 text-resource-rumination-accent/80">{cloudText}</p>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {showSparkles && (
              <motion.div initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: [0, 1, 0], scale: [0.7, 1.2, 1.5] }} exit={{ opacity: 0 }} transition={{ duration: 1.4 }} className="absolute flex items-center gap-4 text-resource-rumination-accent/65">
                <Sparkle size={22} weight="fill" />
                <span className="text-2xl">✦</span>
                <Sparkle size={18} weight="fill" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <p className="my-4 rounded-[2rem] bg-card/65 p-4 text-center text-sm font-semibold leading-6 text-resource-rumination-accent/70">No sos tu pensamiento. Sos quien lo observa pasar.</p>
        <div className="grid grid-cols-2 gap-3">
          <button onClick={releaseCloud} disabled={!cloudText || isReleasing} className="rounded-[2.5rem] bg-resource-rumination-accent py-4 font-display text-base font-semibold text-primary-foreground shadow-lg shadow-resource-rumination-accent/20 active:scale-[0.98] disabled:opacity-45">Soltá</button>
          <button onClick={finish} className="rounded-[2.5rem] border border-resource-rumination-accent/20 bg-card/80 py-4 font-display text-base font-semibold shadow-sm active:scale-[0.98]">Finalizar</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-resource-rumination-bg px-5 pt-14 pb-5 text-resource-rumination-accent safe-area-top">
      <div className="mb-5 flex items-center gap-3">
        <button onClick={goBack} className="flex h-11 w-11 items-center justify-center rounded-full bg-card/80 shadow-sm"><ArrowLeft size={20} /></button>
        <div><p className="font-display text-lg font-semibold">Registro de Pensamientos</p><p className="text-xs font-semibold text-resource-rumination-accent/65">Paso {recordStep + 1} de {recordSteps.length}</p></div>
      </div>
      <p className="mb-5 rounded-[2rem] bg-card/65 p-4 text-sm font-semibold leading-6 text-resource-rumination-accent/70">Cuando sientas una emoción desagradable, anotá lo que está pasando para evaluarlo mejor.</p>
      <div className="mb-6 flex gap-2">{recordSteps.map((step, index) => <div key={step.key} className={cn("h-2 flex-1 rounded-full", index <= recordStep ? "bg-resource-rumination-accent" : "bg-card/80")} />)}</div>
      <AnimatePresence mode="wait">
        <motion.div key={current.key} initial={{ opacity: 0, x: 28 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -28 }} className="flex-1">
          <h1 className="font-display text-3xl font-semibold leading-tight">{current.title}</h1>
          <p className="mt-2 text-sm font-semibold leading-6 text-resource-rumination-accent/70">{current.prompt}</p>
          <div className="mt-6 rounded-[2.5rem] border border-resource-rumination-accent/15 bg-card p-5 shadow-sm">
            {current.type === "textarea" && <textarea value={(recordData[current.key] as string) || ""} onChange={(e) => setRecordData({ ...recordData, [current.key]: e.target.value })} placeholder="Anotá acá..." className="min-h-[170px] w-full resize-none bg-transparent text-base font-semibold leading-7 outline-none placeholder:text-resource-rumination-accent/35" autoFocus />}
            {current.type === "emotion" && <div className="space-y-5"><input value={(recordData.emotion as string) || ""} onChange={(e) => setRecordData({ ...recordData, emotion: e.target.value })} placeholder="Triste, ansioso, enojado..." className="w-full bg-transparent text-base font-semibold outline-none placeholder:text-resource-rumination-accent/35" autoFocus /><div><p className="mb-3 text-center font-display text-4xl font-semibold">{recordData.intensity}</p><input type="range" min="1" max="100" value={(recordData.intensity as number) || 50} onChange={(e) => setRecordData({ ...recordData, intensity: Number(e.target.value) })} className="w-full accent-resource-rumination-accent" /></div></div>}
            {current.type === "belief" && <div className="space-y-5"><textarea value={(recordData.thought as string) || ""} onChange={(e) => setRecordData({ ...recordData, thought: e.target.value })} placeholder="Me dije que..." className="min-h-[110px] w-full resize-none bg-transparent text-base font-semibold leading-7 outline-none placeholder:text-resource-rumination-accent/35" autoFocus /><div><p className="mb-3 text-center font-display text-4xl font-semibold">{recordData.belief}</p><input type="range" min="1" max="100" value={(recordData.belief as number) || 50} onChange={(e) => setRecordData({ ...recordData, belief: Number(e.target.value) })} className="w-full accent-resource-rumination-accent" /></div></div>}
            {current.type === "result" && <div className="space-y-5"><div><p className="mb-3 text-center font-display text-4xl font-semibold">{recordData.finalBelief}</p><input type="range" min="1" max="100" value={(recordData.finalBelief as number) || 50} onChange={(e) => setRecordData({ ...recordData, finalBelief: Number(e.target.value) })} className="w-full accent-resource-rumination-accent" /></div><textarea value={(recordData.result as string) || ""} onChange={(e) => setRecordData({ ...recordData, result: e.target.value })} placeholder="Ahora me siento..." className="min-h-[115px] w-full resize-none rounded-[2rem] border border-resource-rumination-accent/15 bg-resource-rumination-bg/55 p-4 text-base font-semibold leading-7 outline-none placeholder:text-resource-rumination-accent/35" autoFocus /></div>}
          </div>
        </motion.div>
      </AnimatePresence>
      <div className="mt-5 grid grid-cols-2 gap-3">
        <button onClick={goBack} className="rounded-[2.5rem] border border-resource-rumination-accent/20 bg-card/80 py-3.5 font-display text-sm font-semibold shadow-sm active:scale-[0.98]">Atrás</button>
        <button onClick={() => recordStep < recordSteps.length - 1 ? setRecordStep(recordStep + 1) : finish()} className="flex items-center justify-center gap-2 rounded-[2.5rem] bg-resource-rumination-accent py-3.5 font-display text-sm font-semibold text-primary-foreground shadow-lg shadow-resource-rumination-accent/20 active:scale-[0.98]">{recordStep === recordSteps.length - 1 ? "Finalizar" : "Siguiente"}<ArrowRight size={16} /></button>
      </div>
    </div>
  );
}
