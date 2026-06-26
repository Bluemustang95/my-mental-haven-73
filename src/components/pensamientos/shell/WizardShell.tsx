import { ReactNode, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight, HelpCircle, Menu } from "lucide-react";
import { motion } from "framer-motion";

type Props = {
  step: number;
  totalSteps: number;
  stepTitle: string;
  onBack: () => void;
  onNext: () => void;
  onHelp: () => void;
  onOpenSteps: () => void;
  canContinue: boolean;
  nextLabel?: string;
  backDisabled?: boolean;
  children: ReactNode;
};

export default function WizardShell({
  step, totalSteps, stepTitle, onBack, onNext, onHelp, onOpenSteps,
  canContinue, nextLabel = "Siguiente", backDisabled, children,
}: Props) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  }, [step]);

  return (
    <div className="relative h-[100dvh] overflow-hidden bg-[linear-gradient(180deg,#f9f9fb_0%,#eef2f3_100%)]">
      {/* Ambient orbs */}
      <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-20 h-[300px] w-[300px] rounded-full bg-[#7cc2c8] opacity-[0.18] blur-[110px] animate-[orb-float_14s_ease-in-out_infinite]" />
        <div className="absolute top-1/3 -right-24 h-[340px] w-[340px] rounded-full bg-[#facb60] opacity-[0.16] blur-[110px] animate-[orb-float-2_18s_ease-in-out_infinite]" />
      </div>

      <div className="relative z-10 mx-auto flex h-[100dvh] max-w-[420px] flex-col">
        {/* Header */}
        <div className="px-5 pt-7 pb-2.5 bg-white/45 backdrop-blur-xl border-b border-white/40">
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              disabled={backDisabled}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-[#101927]/8 bg-white shadow-glass active:scale-95 transition disabled:opacity-30"
              aria-label="Atrás"
            >
              <ChevronLeft size={16} className="text-[#101927]" />
            </button>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/45">
                Paso {step} de {totalSteps}
              </p>
              <h1 className="font-display text-[15px] leading-tight font-bold text-[#101927] truncate">
                {stepTitle}
              </h1>
            </div>
            <button
              onClick={onHelp}
              aria-label="Psicoeducación"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#101927]/8 bg-white shadow-glass active:scale-95 transition"
            >
              <HelpCircle size={15} className="text-[#7cc2c8]" />
            </button>
          </div>

          {/* Progress */}
          <div className="mt-2.5 h-[3px] w-full rounded-full bg-[#101927]/8 overflow-hidden">
            <motion.div
              className="h-full bg-[#7cc2c8] rounded-full"
              initial={false}
              animate={{ width: `${(step / totalSteps) * 100}%` }}
              transition={{ duration: 0.5, ease: [0.22, 0.61, 0.36, 1] }}
            />
          </div>
        </div>

        {/* Content (scroll independiente) */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-5 pt-5 pb-28 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 0.61, 0.36, 1] }}
          >
            {children}
          </motion.div>
        </div>

        {/* Navigation footer (absolute within max-w container) */}
        <div
          className="absolute left-3 right-3 z-30"
          style={{ bottom: "calc(env(safe-area-inset-bottom) + 5.5rem)" }}
        >
          <div className="flex items-center gap-2 rounded-[28px] border border-white/70 bg-white/95 px-3 py-2.5 shadow-[0_18px_40px_-18px_rgba(16,25,39,0.25)] backdrop-blur-xl">
            <button
              onClick={onBack}
              disabled={backDisabled}
              className="flex h-11 w-12 items-center justify-center rounded-2xl border border-[#101927]/8 bg-white text-[#101927] active:scale-95 transition disabled:opacity-30"
              aria-label="Atrás"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={onOpenSteps}
              aria-label="Pasos"
              className="flex h-11 w-12 items-center justify-center rounded-2xl border border-[#7cc2c8]/30 bg-white text-[#7cc2c8] active:scale-95 transition"
            >
              <Menu size={16} />
            </button>
            <button
              onClick={onNext}
              disabled={!canContinue}
              className="flex-1 h-11 rounded-2xl bg-[#7cc2c8] font-display text-[13px] font-bold text-white active:scale-[0.98] transition disabled:opacity-40 flex items-center justify-center gap-2 shadow-[0_10px_24px_-12px_rgba(124,194,200,0.7)]"
            >
              {nextLabel}
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
