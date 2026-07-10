import { ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Check, X } from "lucide-react";
import { useHideBottomNav } from "@/hooks/useUiChrome";

export function RitualShell({
  step,
  totalSteps,
  onBack,
  onClose,
  onNext,
  nextLabel,
  nextDisabled,
  isLast,
  accent = "teal",
  children,
}: {
  step: number;
  totalSteps: number;
  onBack: () => void;
  onClose: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  isLast?: boolean;
  accent?: "teal" | "gold";
  children: ReactNode;
}) {
  useHideBottomNav(true);
  const accentBg = accent === "teal" ? "bg-resma-teal" : "bg-resma-gold";

  return (
    <div className="fixed inset-0 z-[90] flex flex-col overflow-hidden">
      <div className="resma-bg-gradient absolute inset-0" />
      <div
        className="glow-blob animate-blob-a"
        style={{ background: "#7cc2c8", width: 340, height: 340, top: -100, left: -80 }}
      />
      <div
        className="glow-blob animate-blob-b"
        style={{ background: "#facb60", width: 300, height: 300, bottom: -60, right: -80 }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-3">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-white/70 backdrop-blur-md active:scale-95"
          aria-label="Atrás"
        >
          <ArrowLeft size={16} />
        </button>
        <div className="flex flex-1 justify-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? `w-8 ${accentBg}` : i < step ? `w-3 ${accentBg} opacity-60` : "w-3 bg-foreground/15"
              }`}
            />
          ))}
        </div>
        <button
          onClick={onClose}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-foreground/10 bg-white/70 backdrop-blur-md active:scale-95"
          aria-label="Cerrar"
        >
          <X size={16} />
        </button>
      </header>

      {/* Body scrollable */}
      <div className="relative z-10 flex-1 overflow-y-auto no-scrollbar smooth-scroll">
        <div className="mx-auto max-w-md px-5 pb-56 pt-2">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* Footer CTA */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 z-20 bg-gradient-to-t from-white/95 via-white/70 to-transparent px-5 pt-6"
        style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
      >
        <button
          disabled={nextDisabled}
          onClick={onNext}
          className="pointer-events-auto flex w-full items-center justify-center gap-2 rounded-2xl bg-resma-navy py-4 text-sm font-bold uppercase tracking-[0.16em] text-white shadow-xl transition disabled:opacity-40 active:scale-[0.98]"
        >
          {isLast ? (
            <>
              <Check size={18} /> {nextLabel ?? "Guardar"}
            </>
          ) : (
            <>
              {nextLabel ?? "Siguiente"} <ArrowRight size={18} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
