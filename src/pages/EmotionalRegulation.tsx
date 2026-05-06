import { useEffect, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";
import { AlertTriangle, ArrowLeft, CheckCircle2, ChevronRight, Pause, Play, RotateCcw, Snowflake, Thermometer, Waves, Wind } from "lucide-react";
import { cn } from "@/lib/utils";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

type View = "intake" | "menu" | "stop" | "tipMenu" | "tipPrecaution" | "tipIce" | "tipBreath" | "finish";

const stopSteps = [
  { letter: "S", title: "Stop (Pará)", text: "Congelate. No reacciones. Tus emociones intentan que actúes sin pensar.", color: "hsl(199 89% 48%)" },
  { letter: "T", title: "Tomá un paso atrás", text: "Alejate de la situación. Tomate un descanso y respirá profundo.", color: "hsl(199 89% 55%)" },
  { letter: "O", title: "Observá", text: "Mirá qué pasa adentro y afuera tuyo. ¿Qué sentís? ¿Qué piensan los otros?", color: "hsl(199 89% 62%)" },
  { letter: "P", title: "Procedé con conciencia", text: "Pensá en tus objetivos: ¿qué acción mejoraría la situación ahora?", color: "hsl(199 89% 70%)" },
];

export default function EmotionalRegulation() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [view, setView] = useState<View>("intake");
  const [intensity, setIntensity] = useState(5);

  // STOP swipe state
  const [stopIndex, setStopIndex] = useState(0);
  const dragX = useMotionValue(0);
  const dragOpacity = useTransform(dragX, [-200, 0, 200], [0.4, 1, 0.4]);

  // Ice timer
  const [iceRunning, setIceRunning] = useState(false);
  const [iceSeconds, setIceSeconds] = useState(30);
  const iceRef = useRef<number | null>(null);

  // Breath cycle
  const [breathRunning, setBreathRunning] = useState(false);
  const [breathPhase, setBreathPhase] = useState<"inhale" | "exhale">("inhale");

  useEffect(() => {
    const tool = searchParams.get("tool");
    if (tool === "stop") setView("stop");
    else if (tool === "tip") {
      const step = searchParams.get("step");
      if (step === "temperatura") setView("tipIce");
      else setView("tipPrecaution");
    }
  }, [searchParams]);

  // Ice timer
  useEffect(() => {
    if (!iceRunning) return;
    iceRef.current = window.setInterval(() => {
      setIceSeconds((s) => {
        if (s <= 1) {
          setIceRunning(false);
          if (iceRef.current) window.clearInterval(iceRef.current);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => { if (iceRef.current) window.clearInterval(iceRef.current); };
  }, [iceRunning]);

  // Breath cycle (5s inhale, 7s exhale)
  useEffect(() => {
    if (!breathRunning) return;
    setBreathPhase("inhale");
    const tick = () => {
      setBreathPhase((p) => (p === "inhale" ? "exhale" : "inhale"));
    };
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [breathRunning]);

  const close = () => navigate("/herramientas");
  const goBack = () => {
    if (view === "intake") close();
    else if (view === "menu") setView("intake");
    else if (view === "stop") { setStopIndex(0); setView("menu"); }
    else if (view === "tipMenu") setView("menu");
    else if (view === "tipPrecaution") setView("tipMenu");
    else if (view === "tipIce" || view === "tipBreath") setView("tipMenu");
    else setView("intake");
  };

  const recommended: "stop" | "tip" = intensity >= 7 ? "tip" : "stop";

  const advanceStop = () => {
    if (stopIndex >= stopSteps.length - 1) {
      setView("finish");
      setStopIndex(0);
    } else {
      setStopIndex((i) => i + 1);
    }
    dragX.set(0);
  };

  const resetIce = () => { setIceRunning(false); setIceSeconds(30); };

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
          {/* INTAKE: Termómetro */}
          {view === "intake" && (
            <motion.section key="intake" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Regulación Emocional" />
              <div className="flex flex-1 flex-col items-center text-center">
                <motion.div animate={{ y: [-5, 5, -5] }} transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut" }} className="flex h-20 w-20 items-center justify-center">
                  <img src={resmitaAvatar} alt="Resmita" className="h-16 w-16 object-contain drop-shadow-xl" />
                </motion.div>
                <h1 className="mt-3 font-mindful text-3xl leading-tight sm:text-4xl">¿Cuán intenso es tu malestar?</h1>
                <p className="mt-3 max-w-xs font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">Marcá tu nivel del 1 al 10 para que te recomiende la técnica más útil ahora.</p>

                {/* Termómetro */}
                <div className="mt-8 flex items-center gap-5">
                  <div className="relative flex h-64 w-12 flex-col items-center justify-end overflow-hidden rounded-full border-2 border-resource-regulation-accent/20 bg-card/70 shadow-inner">
                    <motion.div
                      animate={{ height: `${intensity * 10}%` }}
                      transition={{ type: "spring", stiffness: 120, damping: 18 }}
                      className="w-full rounded-b-full"
                      style={{ background: "linear-gradient(to top, hsl(199 89% 55%), hsl(280 70% 60%), hsl(0 80% 60%))" }}
                    />
                    <Thermometer size={20} className="absolute top-2 text-resource-regulation-accent/60" />
                  </div>

                  <div className="flex flex-col items-center">
                    <span className="font-mindful text-6xl font-semibold leading-none">{intensity}</span>
                    <span className="mt-1 font-sans text-xs text-resource-regulation-accent/65">/ 10</span>
                    <input
                      type="range" min={1} max={10} step={1}
                      value={intensity}
                      onChange={(e) => setIntensity(Number(e.target.value))}
                      className="mt-4 w-32 accent-[hsl(var(--resource-regulation-accent))]"
                      aria-label="Nivel de malestar"
                    />
                  </div>
                </div>

                <div className="mt-6 rounded-[2rem] border border-resource-regulation-accent/15 bg-card/85 p-4 text-left shadow-sm">
                  <p className="font-mindful text-sm font-semibold">
                    {recommended === "tip" ? "Resmita te recomienda TIP" : "Resmita te sugiere STOP"}
                  </p>
                  <p className="mt-1 font-sans text-xs leading-5 text-resource-regulation-accent/70">
                    {recommended === "tip"
                      ? "El malestar es alto. Necesitás un cambio químico rápido en el cuerpo."
                      : "Hay tiempo para frenar el impulso y elegir con conciencia."}
                  </p>
                </div>
              </div>
              <button onClick={() => setView("menu")} className="mt-6 w-full rounded-[3rem] bg-resource-regulation-accent py-4 font-mindful text-base font-bold text-primary-foreground shadow-lg shadow-resource-regulation-accent/20 active:scale-[0.98]">
                Continuar
              </button>
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
                <h1 className="font-mindful text-3xl leading-tight sm:text-4xl">Regulación Emocional</h1>
                <p className="px-3 font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">Cambiá la química de tu cuerpo y retomá el control.</p>

                <div className="mt-2 w-full space-y-3">
                  <button onClick={() => { setStopIndex(0); setView("stop"); }} className={cn("flex w-full items-center gap-4 rounded-[3rem] px-6 py-5 text-left font-sans transition-transform active:scale-95", recommended === "stop" ? "bg-resource-regulation-accent text-primary-foreground shadow-lg shadow-resource-regulation-accent/30" : "border border-resource-regulation-accent/15 bg-card/85 text-resource-regulation-accent shadow-sm")}>
                    <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", recommended === "stop" ? "bg-card/20" : "bg-resource-regulation-bg")}>S</span>
                    <span><span className="block text-base font-bold">Habilidad STOP</span><span className="text-xs font-semibold opacity-80">Frená impulsos · deslizá para avanzar</span></span>
                  </button>
                  <button onClick={() => setView("tipMenu")} className={cn("flex w-full items-center gap-4 rounded-[3rem] px-6 py-5 text-left font-sans transition-transform active:scale-95", recommended === "tip" ? "bg-resource-regulation-accent text-primary-foreground shadow-lg shadow-resource-regulation-accent/30" : "border border-resource-regulation-accent/15 bg-card/85 text-resource-regulation-accent shadow-sm")}>
                    <span className={cn("flex h-12 w-12 items-center justify-center rounded-full", recommended === "tip" ? "bg-card/20" : "bg-resource-regulation-bg")}><Waves size={22} /></span>
                    <span><span className="block text-base font-bold">Habilidad TIP</span><span className="text-xs font-semibold opacity-80">Cambio químico rápido</span></span>
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
                  onDragEnd={(_, info) => {
                    if (info.offset.x < -120) advanceStop();
                    else dragX.set(0);
                  }}
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
                {stopIndex === stopSteps.length - 1 ? "Terminar" : "Avanzar igual"}
              </button>
            </motion.section>
          )}

          {/* TIP menu */}
          {view === "tipMenu" && (
            <motion.section key="tipMenu" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="TIP" />
              <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[2rem] bg-card/80 shadow-sm"><Waves size={36} /></div>
                <h1 className="font-mindful text-3xl leading-tight">Habilidad TIP</h1>
                <p className="px-3 font-sans text-xs leading-6 text-resource-regulation-accent/75">Elegí cómo querés cambiar la química de tu cuerpo.</p>
                <div className="w-full space-y-3">
                  <button onClick={() => setView("tipPrecaution")} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-5 text-left shadow-sm active:scale-95">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Snowflake size={24} /></span>
                    <span><span className="block font-mindful text-base font-bold">Temperatura · Hielo</span><span className="text-xs opacity-70">Cronómetro de 30 segundos</span></span>
                  </button>
                  <button onClick={() => { setBreathRunning(false); setView("tipBreath"); }} className="flex w-full items-center gap-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 px-6 py-5 text-left shadow-sm active:scale-95">
                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-resource-regulation-bg"><Wind size={24} /></span>
                    <span><span className="block font-mindful text-base font-bold">Respiración pausada</span><span className="text-xs opacity-70">Inhalá 5s · Exhalá 7s</span></span>
                  </button>
                </div>
              </div>
            </motion.section>
          )}

          {/* TIP precaution */}
          {view === "tipPrecaution" && (
            <motion.section key="tipPrec" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Precaución" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <div className="mb-5 flex h-20 w-20 items-center justify-center rounded-[2rem] bg-card/85 shadow-sm"><AlertTriangle size={38} /></div>
                <h1 className="font-mindful text-3xl leading-tight">Antes de empezar</h1>
                <p className="mt-4 rounded-[3rem] border border-resource-regulation-accent/15 bg-card/85 p-6 font-sans text-xs leading-6 text-resource-regulation-accent/75 shadow-sm sm:text-sm">
                  Consultá a tu médico antes de usar TIP si tenés afecciones cardíacas, trastornos alimentarios, cambios en la frecuencia cardíaca o tomás betabloqueantes.
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

                <button
                  onClick={() => !iceRunning && iceSeconds > 0 && setIceRunning(true)}
                  className="relative mt-8 flex h-56 w-56 items-center justify-center"
                  aria-label="Iniciar cronómetro de hielo"
                >
                  {/* ondas de agua fría */}
                  {iceRunning && [0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      initial={{ scale: 0.6, opacity: 0.6 }}
                      animate={{ scale: 1.6, opacity: 0 }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.6, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border-2 border-resource-regulation-accent/40"
                    />
                  ))}
                  <motion.div
                    animate={iceRunning ? { rotate: [0, -8, 8, 0] } : { rotate: 0 }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="relative flex h-44 w-44 items-center justify-center rounded-[2.5rem] bg-gradient-to-br from-[hsl(199_95%_85%)] to-[hsl(199_95%_65%)] shadow-2xl shadow-resource-regulation-accent/30"
                  >
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

          {/* TIP Breath */}
          {view === "tipBreath" && (
            <motion.section key="tipBreath" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col">
              <Header title="Respiración pausada" />
              <div className="flex flex-1 flex-col items-center justify-center text-center">
                <h1 className="font-mindful text-3xl leading-tight">Inhalá 5s · Soltá 7s</h1>
                <p className="mt-2 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/70">Seguí el círculo con tu respiración.</p>
                <div className="relative mt-8 flex h-64 w-64 items-center justify-center">
                  <motion.div
                    animate={breathRunning ? { scale: breathPhase === "inhale" ? 1.4 : 0.7 } : { scale: 1 }}
                    transition={{ duration: breathPhase === "inhale" ? 5 : 7, ease: "easeInOut" }}
                    className="absolute inset-0 rounded-full bg-gradient-to-br from-[hsl(199_85%_75%)] to-[hsl(199_85%_55%)] shadow-2xl shadow-resource-regulation-accent/30"
                  />
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

          {/* FINISH */}
          {view === "finish" && (
            <motion.section key="finish" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} transition={{ duration: 0.35 }} className="flex flex-1 flex-col items-center justify-center text-center">
              <motion.div animate={{ y: [-7, 7, -7], rotate: [-2, 2, -2] }} transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }} className="mb-6 flex h-32 w-32 items-center justify-center">
                <img src={resmitaAvatar} alt="Resmita" className="h-28 w-28 object-contain drop-shadow-2xl" />
              </motion.div>
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-card/85 shadow-xl"><CheckCircle2 size={42} /></div>
              <h1 className="font-mindful text-3xl leading-tight">Mente en control</h1>
              <p className="mt-4 px-4 font-sans text-xs leading-6 text-resource-regulation-accent/75 sm:text-sm">Cambiando tu química corporal, recuperás el control de tu mente.</p>
              <div className="mt-8 flex w-full gap-3">
                <button onClick={() => setView("intake")} className="flex-1 rounded-[3rem] border border-resource-regulation-accent/20 bg-card/85 py-4 font-mindful text-sm font-bold shadow-sm active:scale-[0.98]">Volver</button>
                <button onClick={close} className="flex-1 rounded-[3rem] bg-resource-regulation-accent py-4 font-mindful text-sm font-bold text-primary-foreground shadow-lg active:scale-[0.98]">Cerrar</button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
