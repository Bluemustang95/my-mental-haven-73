import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Pause, Play, RotateCcw, Snowflake, Waves, Wind, Zap, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

type View =
  | "intro"
  | "menu"
  | "stop"
  | "tipMenu"
  | "tipPrecaution"
  | "tipIce"
  | "tipExercise"
  | "tipBreath"
  | "tipParallel"
  | "finish";

const stopSteps = [
  { letter: "S", title: "Stop · ¡Pará!", text: "Congelate. No reacciones. Tus emociones quieren que actúes sin pensar.", color: "hsl(199 89% 48%)" },
  { letter: "T", title: "Tomá un paso atrás", text: "Alejate de la situación. Respirá profundo y dale tiempo a tu mente.", color: "hsl(199 89% 55%)" },
  { letter: "O", title: "Observá", text: "¿Qué pasa adentro tuyo? ¿Qué pasa afuera? Notá sin juzgar.", color: "hsl(199 89% 62%)" },
  { letter: "P", title: "Procedé con Mindfulness", text: "Consultá a tu Mente Sabia: ¿qué acción te acerca a lo que querés?", color: "hsl(199 89% 70%)" },
];

export default function EmotionalRegulation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>("menu");

  // STOP swipe
  const [stopIndex, setStopIndex] = useState(0);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.4, 1, 0.4]);

  // Ice timer
  const [iceRunning, setIceRunning] = useState(false);
  const [iceSeconds, setIceSeconds] = useState(30);
  const iceRef = useRef<number | null>(null);

  // Exercise timer (60s)
  const [exRunning, setExRunning] = useState(false);
  const [exSeconds, setExSeconds] = useState(60);
  const exRef = useRef<number | null>(null);

  // Breath cycle
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");

  // Parallel relaxation
  const [parallelRunning, setParallelRunning] = useState(false);
  const [parallelPhase, setParallelPhase] = useState<"tense" | "release">("tense");

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (tool === "stop") setView("stop");
    else if (tool === "tip") {
      const step = searchParams.get("step");
      if (step === "temperatura") setView("tipIce");
      else setView("tipMenu");
    }
  }, [searchParams]);

  // Ice timer
  useEffect(() => {
    if (!iceRunning) return;
    iceRef.current = window.setInterval(() => {
      setIceSeconds((s) => {
        if (s <= 1) { setIceRunning(false); if (iceRef.current) window.clearInterval(iceRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (iceRef.current) window.clearInterval(iceRef.current); };
  }, [iceRunning]);

  // Exercise timer
  useEffect(() => {
    if (!exRunning) return;
    exRef.current = window.setInterval(() => {
      setExSeconds((s) => {
        if (s <= 1) { setExRunning(false); if (exRef.current) window.clearInterval(exRef.current); return 0; }
        return s - 1;
      });
    }, 1000);
    return () => { if (exRef.current) window.clearInterval(exRef.current); };
  }, [exRunning]);

  // Breath
  useEffect(() => {
    if (!breathRunning) return;
    setBreathPhase("inhale");
    let timeout: number;
    const loop = (phase: "inhale" | "exhale") => {
      timeout = window.setTimeout(() => {
        const next = phase === "inhale" ? "exhale" : "inhale";
        setBreathPhase(next);
        loop(next);
      }, phase === "inhale" ? 5000 : 7000);
    };
    loop("inhale");
    return () => { if (timeout) window.clearTimeout(timeout); };
  }, [breathRunning]);

  // Parallel relaxation
  useEffect(() => {
    if (!parallelRunning) return;
    setParallelPhase("tense");
    let timeout: number;
    const loop = (phase: "tense" | "release") => {
      timeout = window.setTimeout(() => {
        const next = phase === "tense" ? "release" : "tense";
        setParallelPhase(next);
        loop(next);
      }, phase === "tense" ? 5000 : 5000);
    };
    loop("tense");
    return () => { if (timeout) window.clearTimeout(timeout); };
  }, [parallelRunning]);

  const close = () => navigate("/herramientas");
  const goBack = () => {
    if (view === "intro") close();
    else if (view === "menu") setView("intro");
    else if (view === "stop") { setStopIndex(0); setView("menu"); }
    else if (view === "tipMenu") setView("menu");
    else if (view === "tipPrecaution") setView("tipMenu");
    else setView("tipMenu");
  };

  const advanceStop = () => {
    if (stopIndex >= stopSteps.length - 1) { setView("finish"); setStopIndex(0); }
    else setStopIndex((i) => i + 1);
    dragX.set(0);
  };

  const resetIce = () => { setIceRunning(false); setIceSeconds(30); };
  const resetEx = () => { setExRunning(false); setExSeconds(60); };

  const Header = ({ title }: { title: string }) => (
    <header className="mb-4 flex items-center justify-between">
      <button onClick={goBack} aria-label="Volver" className="flex h-11 w-11 items-center justify-center rounded-full border border-resource-regulation-accent/15 bg-card/75 text-resource-regulation-accent shadow-sm transition-transform active:scale-95">
        <ArrowLeft size={20} />
      </button>
      <span className="rounded-full bg-card/75 px-4 py-2 font-mindful text-xs font-semibold text-resource-regulation-accent shadow-sm">{title}</span>
    </header>
  );

  return (
    <main className="min-h-screen bg-resource-regulation-bg px-4 pb-28 pt-10 font-sans text-resource-regulation-accent transition-colors duration-500 safe-area-top">
      <div className="mx-auto flex min-h-[calc(100vh-9.5rem)] w-full max-w-md flex-col">
        <AnimatePresence mode="wait">

          {/* INTRO */}
          {view === "intro" && (
            <motion.section key="intro" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Regulación Emocional" />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <motion.div animate={{ y: [-8, 8, -8], rotate: [-2, 2, -2] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} className="relative flex h-40 w-40 items-center justify-center sm:h-48 sm:w-48">
                  <img src={resmitaAvatar} alt="Resmita" className="h-full w-full object-contain drop-shadow-2xl" />
                </motion.div>
                <div className="px-3 py-3 sm:px-6 sm:py-5">
                  <h1 className="mb-3 font-mindful text-3xl leading-tight sm:text-4xl">Regulación Emocional</h1>
                  <p className="font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm sm:leading-7">
                    Regular tus emociones es la capacidad de manejar el malestar sin actuar por impulso. Te permite recuperar el equilibrio para elegir con claridad lo que de verdad querés hacer.
                  </p>
                </div>
                <button onClick={() => setView("menu")} className="w-full rounded-[3rem] bg-resource-regulation-accent px-8 py-4 font-mindful text-base font-bold text-primary-foreground shadow-lg shadow-resource-regulation-accent/25 active:scale-[0.98] sm:py-5">
                  ¿Empezamos?
                </button>
              </div>
            </motion.section>
          )}

          {/* MENU */}
          {view === "menu" && (
            <motion.section key="menu" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Elegí tu técnica" />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-card/80 shadow-sm">
                  <Waves size={38} strokeWidth={2.2} />
                </div>
                <h1 className="font-mindful text-3xl leading-tight sm:text-4xl">¿Qué necesitás ahora?</h1>
                <p className="px-3 font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">Elegí una habilidad para frenar el impulso o cambiar tu química corporal.</p>

                <div className="mt-2 w-full space-y-3">
                  <button onClick={() => { setStopIndex(0); setView("stop"); }} className="flex w-full items-center gap-4 rounded-[3rem] bg-resource-regulation-accent px-6 py-5 text-left font-sans text-primary-foreground shadow-lg shadow-resource-regulation-accent/25 transition-transform active:scale-95">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-card/20 font-mindful text-xl font-bold">S</span>
                    <span><span className="block font-mindful text-base font-bold">Habilidad STOP</span><span className="text-xs font-semibold opacity-80">Frená el impulso · 4 pasos</span></span>
                  </button>
                  <button onClick={() => setView("tipMenu")} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-5 text-left font-sans text-resource-regulation-accent shadow-sm transition-transform active:scale-95">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg font-mindful text-xl font-bold">T</span>
                    <span><span className="block font-mindful text-base font-bold">Habilidades TIPP</span><span className="text-xs font-semibold opacity-70">Cambio químico rápido</span></span>
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* STOP swipe */}
          {view === "stop" && (
            <motion.section key="stop" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="STOP" />
              <div className="mb-4 grid grid-cols-4 gap-2">
                {stopSteps.map((s, i) => (
                  <span key={s.letter} className={cn("h-2 rounded-full", i <= stopIndex ? "bg-resource-regulation-accent" : "bg-resource-regulation-accent/15")} />
                ))}
              </div>
              <div className="relative flex flex-1 flex-col items-center justify-center">
                <motion.div
                  drag="x"
                  dragConstraints={{ left: -250, right: 0 }}
                  dragElastic={0.2}
                  style={{ x: dragX, opacity: dragOpacity }}
                  onDragEnd={(_, info) => { if (info.offset.x < -120) advanceStop(); else dragX.set(0); }}
                  className="relative w-full cursor-grab rounded-[3rem] border border-resource-regulation-accent/15 bg-card/90 p-7 text-center shadow-lg active:cursor-grabbing"
                >
                  <p className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full font-mindful text-3xl font-bold text-primary-foreground" style={{ backgroundColor: stopSteps[stopIndex].color }}>
                    {stopSteps[stopIndex].letter}
                  </p>
                  <h2 className="font-mindful text-3xl leading-tight">{stopSteps[stopIndex].title}</h2>
                  <p className="mt-3 font-sans text-sm leading-7 text-resource-regulation-accent/75">{stopSteps[stopIndex].text}</p>
                </motion.div>
                <motion.div animate={{ x: [0, 14, 0] }} transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }} className="mt-6 flex items-center gap-1 text-xs font-semibold text-resource-regulation-accent/65">
                  Deslizá <ChevronRight size={16} /><ChevronRight size={16} />
                </motion.div>
              </div>
              <button onClick={advanceStop} className="mt-4 w-full rounded-[3rem] border border-resource-regulation-accent/20 bg-card/80 py-3 font-mindful text-sm font-semibold active:scale-[0.98]">
                {stopIndex === stopSteps.length - 1 ? "Terminar" : "Avanzar"}
              </button>
            </motion.section>
          )}

          {/* TIPP menu */}
          {view === "tipMenu" && (
            <motion.section key="tipMenu" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="TIPP" />
              <div className="flex flex-1 flex-col gap-3">
                <div className="text-center">
                  <h1 className="font-mindful text-3xl leading-tight">Habilidades TIPP</h1>
                  <p className="mt-1 px-3 font-sans text-xs leading-6 text-resource-regulation-accent/75">Cambiá la química de tu cuerpo en minutos.</p>
                </div>

                <button onClick={() => setView("tipPrecaution")} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-4 text-left shadow-sm active:scale-95">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Snowflake size={22} /></span>
                  <span><span className="block font-mindful text-base font-bold">T · Temperatura</span><span className="text-xs opacity-70">Hielo o agua fría · 30 s</span></span>
                </button>

                <button onClick={() => { resetEx(); setView("tipExercise"); }} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-4 text-left shadow-sm active:scale-95">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Zap size={22} /></span>
                  <span><span className="block font-mindful text-base font-bold">I · Ejercicio Intenso</span><span className="text-xs opacity-70">Descargá energía · 60 s</span></span>
                </button>

                <button onClick={() => { setBreathRunning(false); setView("tipBreath"); }} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-4 text-left shadow-sm active:scale-95">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Wind size={22} /></span>
                  <span><span className="block font-mindful text-base font-bold">P · Respiración Pausada</span><span className="text-xs opacity-70">Inhalá 5 s · Soltá 7 s</span></span>
                </button>

                <button onClick={() => { setParallelRunning(false); setView("tipParallel"); }} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-4 text-left shadow-sm active:scale-95">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Activity size={22} /></span>
                  <span><span className="block font-mindful text-base font-bold">P · Relajación en Paralelo</span><span className="text-xs opacity-70">Tensá al inhalar · soltá al exhalar</span></span>
                </button>

                <div className="mt-2 flex items-start gap-2 rounded-[2rem] border border-resource-regulation-accent/15 bg-card/70 p-4 text-left">
                  <AlertTriangle size={18} className="mt-0.5 shrink-0 opacity-70" />
                  <p className="font-sans text-[11px] leading-5 text-resource-regulation-accent/75">
                    Consultá a tu médico antes de usar TIPP si tenés afecciones cardíacas, trastornos alimentarios, alteraciones del ritmo cardíaco o tomás betabloqueantes.
                  </p>
                </div>
              </div>
            </motion.section>
          )}

          {/* TIP precaution (when entering ice) */}
          {view === "tipPrecaution" && (
            <motion.section key="tipPrec" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Precaución" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-card/85 shadow-sm"><AlertTriangle size={38} /></div>
                <h1 className="font-mindful text-3xl leading-tight">Antes de empezar</h1>
                <p className="mt-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 p-6 font-sans text-xs leading-6 text-resource-regulation-accent/75 shadow-sm sm:text-sm">
                  Consultá a tu médico antes de usar TIPP si tenés afecciones cardíacas, trastornos alimentarios, alteraciones de la frecuencia cardíaca o tomás betabloqueantes.
                </p>
              </div>
              <button onClick={() => { resetIce(); setView("tipIce"); }} className="mt-6 w-full rounded-[3rem] bg-resource-regulation-accent py-4 font-mindful text-base font-bold text-primary-foreground shadow-lg active:scale-[0.98]">Entiendo, iniciar</button>
            </motion.section>
          )}

          {/* TIP Ice */}
          {view === "tipIce" && (
            <motion.section key="tipIce" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Temperatura" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="font-mindful text-3xl leading-tight">Sumergí la cara en agua fría</h1>
                <p className="mt-2 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/70 sm:text-sm">O apoyá hielo en mejillas y frente. Tocá el hielo para empezar.</p>
                <button onClick={() => !iceRunning && iceSeconds > 0 && setIceRunning(true)} className="relative mt-8 flex h-56 w-56 items-center justify-center" aria-label="Iniciar cronómetro de hielo">
                  {iceRunning && [0, 1, 2].map((i) => (
                    <motion.span key={i} initial={{ scale: 0.6, opacity: 0.6 }} animate={{ scale: 1.6, opacity: 0 }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }} className="absolute inset-0 rounded-full border-2 border-resource-regulation-accent/40" />
                  ))}
                  <motion.div animate={iceRunning ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }} transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} className="relative flex h-44 w-44 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-[hsl(199_95%_85%)] to-[hsl(199_95%_65%)] shadow-2xl shadow-resource-regulation-accent/30">
                    <Snowflake size={80} strokeWidth={1.6} className="text-white drop-shadow" />
                  </motion.div>
                </button>
                <p className="mt-8 font-mindful text-5xl font-semibold tabular-nums">{String(iceSeconds).padStart(2, "0")}s</p>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setIceRunning((r) => !r)} disabled={iceSeconds === 0} className="flex h-14 w-14 items-center justify-center rounded-full bg-resource-regulation-accent text-primary-foreground shadow-lg active:scale-95 disabled:opacity-50">
                    {iceRunning ? <Pause size={22} /> : <Play size={22} />}
                  </button>
                  <button onClick={resetIce} className="flex h-14 w-14 items-center justify-center rounded-full border border-resource-regulation-accent/20 bg-card/80 active:scale-95">
                    <RotateCcw size={20} />
                  </button>
                </div>
                {iceSeconds === 0 && (
                  <button onClick={() => setView("finish")} className="mt-6 w-full rounded-[3rem] bg-resource-regulation-accent py-4 font-mindful text-base font-bold text-primary-foreground shadow-lg active:scale-[0.98]">Terminé</button>
                )}
              </div>
            </motion.section>
          )}

          {/* TIP Exercise */}
          {view === "tipExercise" && (
            <motion.section key="tipEx" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Ejercicio Intenso" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="font-mindful text-3xl leading-tight">Descargá la energía</h1>
                <p className="mt-3 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">
                  Hacé saltos en el lugar, sentadillas o subí escaleras a paso rápido durante 1 minuto. Mové el cuerpo con intensidad para bajar la activación.
                </p>
                <motion.div animate={exRunning ? { y: [-12, 0, -12] } : { y: 0 }} transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }} className="mt-8 flex h-44 w-44 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-[hsl(199_95%_85%)] to-[hsl(199_95%_55%)] shadow-2xl shadow-resource-regulation-accent/30">
                  <Zap size={80} strokeWidth={1.6} className="text-white drop-shadow" />
                </motion.div>
                <p className="mt-8 font-mindful text-5xl font-semibold tabular-nums">{String(exSeconds).padStart(2, "0")}s</p>
                <div className="mt-6 flex gap-3">
                  <button onClick={() => setExRunning((r) => !r)} disabled={exSeconds === 0} className="flex h-14 w-14 items-center justify-center rounded-full bg-resource-regulation-accent text-primary-foreground shadow-lg active:scale-95 disabled:opacity-50">
                    {exRunning ? <Pause size={22} /> : <Play size={22} />}
                  </button>
                  <button onClick={resetEx} className="flex h-14 w-14 items-center justify-center rounded-full border border-resource-regulation-accent/20 bg-card/80 active:scale-95">
                    <RotateCcw size={20} />
                  </button>
                </div>
                <button onClick={() => setView("finish")} className="mt-6 w-full rounded-[3rem] border border-resource-regulation-accent/20 bg-card/80 py-3 font-mindful text-sm font-semibold active:scale-[0.98]">Terminé</button>
              </div>
            </motion.section>
          )}

          {/* TIP Breath */}
          {view === "tipBreath" && (
            <motion.section key="tipBreath" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Respiración Pausada" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="font-mindful text-3xl leading-tight">Inhalá 5 s · Soltá 7 s</h1>
                <p className="mt-2 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/70">Seguí el círculo con tu respiración.</p>
                <div className="relative mt-8 flex h-64 w-64 items-center justify-center">
                  <motion.div animate={breathRunning ? { scale: breathPhase === "inhale" ? 1.4 : 0.7 } : { scale: 1 }} transition={{ duration: breathPhase === "inhale" ? 5 : 7, ease: "easeInOut" }} className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(199_85%_75%)] to-[hsl(199_85%_55%)] shadow-2xl shadow-resource-regulation-accent/30" />
                  <span className="relative font-mindful text-2xl font-semibold text-white drop-shadow">
                    {breathRunning ? (breathPhase === "inhale" ? "Inhalá" : "Soltá") : "Empezá"}
                  </span>
                </div>
                <button onClick={() => setBreathRunning((r) => !r)} className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-resource-regulation-accent text-primary-foreground shadow-lg active:scale-95">
                  {breathRunning ? <Pause size={22} /> : <Play size={22} />}
                </button>
                <button onClick={() => { setBreathRunning(false); setView("finish"); }} className="mt-6 w-full rounded-[3rem] border border-resource-regulation-accent/20 bg-card/80 py-3 font-mindful text-sm font-semibold active:scale-[0.98]">Terminé</button>
              </div>
            </motion.section>
          )}

          {/* TIP Parallel */}
          {view === "tipParallel" && (
            <motion.section key="tipPar" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Relajación en Paralelo" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="font-mindful text-3xl leading-tight">Tensá y soltá</h1>
                <p className="mt-3 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">
                  Mientras inhalás, tensá los músculos (manos, hombros, mandíbula). Al exhalar, soltalos diciendo mentalmente "Relajate".
                </p>
                <div className="relative mt-8 flex h-64 w-64 items-center justify-center">
                  <motion.div animate={parallelRunning ? { scale: parallelPhase === "tense" ? 1.15 : 0.85 } : { scale: 1 }} transition={{ duration: 5, ease: "easeInOut" }} className="absolute inset-0 rounded-[3rem] bg-gradient-to-br from-[hsl(199_85%_80%)] to-[hsl(199_85%_55%)] shadow-2xl shadow-resource-regulation-accent/30" />
                  <span className="relative font-mindful text-2xl font-semibold text-white drop-shadow">
                    {parallelRunning ? (parallelPhase === "tense" ? "Tensá" : "Relajate") : "Empezá"}
                  </span>
                </div>
                <button onClick={() => setParallelRunning((r) => !r)} className="mt-8 flex h-14 w-14 items-center justify-center rounded-full bg-resource-regulation-accent text-primary-foreground shadow-lg active:scale-95">
                  {parallelRunning ? <Pause size={22} /> : <Play size={22} />}
                </button>
                <button onClick={() => { setParallelRunning(false); setView("finish"); }} className="mt-6 w-full rounded-[3rem] border border-resource-regulation-accent/20 bg-card/80 py-3 font-mindful text-sm font-semibold active:scale-[0.98]">Terminé</button>
              </div>
            </motion.section>
          )}

          {/* FINISH */}
          {view === "finish" && (
            <motion.section key="finish" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-card/85 shadow-xl shadow-resource-regulation-accent/15"><CheckCircle2 size={48} /></div>
              <h1 className="font-mindful text-3xl leading-tight">Mente en control</h1>
              <p className="mt-4 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">Cambiaste tu química corporal. Volvé cuando lo necesites.</p>
              <div className="mt-8 flex w-full gap-3">
                <button onClick={() => setView("menu")} className="flex-1 rounded-[3rem] border border-resource-regulation-accent/20 bg-card/85 py-4 font-mindful text-sm font-bold shadow-sm active:scale-[0.98]">Otra técnica</button>
                <button onClick={close} className="flex-1 rounded-[3rem] bg-resource-regulation-accent py-4 font-mindful text-sm font-bold text-primary-foreground shadow-lg active:scale-[0.98]">Cerrar</button>
              </div>
            </motion.section>
          )}

        </AnimatePresence>
      </div>
    </main>
  );
}
