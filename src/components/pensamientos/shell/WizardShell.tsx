import { ReactNode, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, RotateCcw, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  onNext?: () => void;
  onReset?: () => void;
  canContinue: boolean;
  nextLabel?: string;
  children: ReactNode;
};

export default function WizardShell({
  step, totalSteps, onBack, onNext, onReset, canContinue,
  nextLabel = "Guardar y Continuar", children,
}: Props) {
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#f9f9fb_0%,#f2f4f8_100%)]">
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 h-[420px] w-[420px] rounded-full bg-[#7cc2c8] opacity-[0.22] blur-[100px] animate-[orb-float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 h-[460px] w-[460px] rounded-full bg-[#facb60] opacity-[0.20] blur-[100px] animate-[orb-float-2_18s_ease-in-out_infinite]" />
      </div>

      <div ref={scrollRef} className="relative z-10 mx-auto max-w-[480px] h-screen overflow-y-auto pb-40">
        {/* Header */}
        <div className="sticky top-0 z-20 px-5 pt-10 pb-4 backdrop-blur-[18px] bg-white/40 border-b border-white/40">
          <div className="flex items-start justify-between gap-3">
            <button
              onClick={() => (onBack ? onBack() : navigate(-1))}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.18)] active:scale-95 transition"
              aria-label="Atrás"
            >
              <ArrowLeft size={18} className="text-[#101927]" />
            </button>
            <div className="flex-1 pt-1">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#101927]/45">
                Workspace
              </p>
              <h1 className="font-serif text-[20px] leading-tight font-bold text-[#101927]">
                Gestión de Pensamientos
              </h1>
            </div>
            {onReset && (
              <button
                onClick={() => {
                  if (confirm("¿Querés reiniciar esta sesión? Se borrará todo lo cargado.")) onReset();
                }}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.18)] active:scale-95 transition"
                aria-label="Reiniciar"
              >
                <RotateCcw size={16} className="text-[#101927]/70" />
              </button>
            )}
          </div>

          {/* Progress */}
          <div className="mt-4 flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-all ${
                  i + 1 <= step ? "bg-[#101927]" : "bg-[#101927]/10"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          className="px-5 py-6"
        >
          {children}
        </motion.div>
      </div>

      {/* Sticky footer */}
      <div className="fixed bottom-0 left-0 right-0 z-30 px-5 pb-[max(env(safe-area-inset-bottom),20px)] pt-3 bg-gradient-to-t from-[#f2f4f8] via-[#f2f4f8]/85 to-transparent">
        <div className="mx-auto flex max-w-[480px] gap-3">
          <button
            onClick={() => (onBack ? onBack() : navigate(-1))}
            className="flex-1 rounded-2xl border border-white/70 bg-white/70 backdrop-blur-[20px] py-4 font-display text-sm font-semibold text-[#101927] shadow-[0_6px_18px_-10px_rgba(16,25,39,0.15)] active:scale-[0.98] transition"
          >
            Atrás
          </button>
          <button
            onClick={onNext}
            disabled={!canContinue || !onNext}
            className="flex-[1.4] rounded-2xl bg-[#101927] py-4 font-display text-sm font-semibold text-white shadow-[0_10px_30px_-12px_rgba(16,25,39,0.45)] active:scale-[0.98] transition disabled:opacity-40 disabled:active:scale-100 flex items-center justify-center gap-2"
          >
            {nextLabel}
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
