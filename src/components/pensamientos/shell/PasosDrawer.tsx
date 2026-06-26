import { X, Check, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { STEP_TITLES, STEP_GROUPS } from "@/lib/pensamientos/stepHelp";
import { getResolutionMode, type ThoughtDraft } from "@/lib/pensamientos/state";

type Props = {
  open: boolean;
  currentStep: number;
  draft: ThoughtDraft;
  isStepComplete: (step: number) => boolean;
  onJump: (step: number) => void;
  onClose: () => void;
};

export default function PasosDrawer({ open, currentStep, draft, isStepComplete, onJump, onClose }: Props) {
  const mode = getResolutionMode(draft);
  const titles = [...STEP_TITLES];
  titles[7] = mode === "abordaje" ? "Resolución de Problema" : "Reestructuración";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 280 }}
            onClick={(e) => e.stopPropagation()}
            className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto rounded-t-[28px] bg-[#f9f9fb] p-5 pb-10"
          >
            <div className="mx-auto max-w-[420px]">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/45">
                    Ruta de trabajo
                  </p>
                  <h3 className="mt-0.5 font-display text-[20px] font-bold text-[#101927]">
                    Navegación del Proceso
                  </h3>
                </div>
                <button
                  onClick={onClose}
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/10 bg-white active:scale-95"
                  aria-label="Cerrar"
                >
                  <X size={14} />
                </button>
              </div>

              <div className="mt-4 space-y-2">
                {titles.map((t, i) => {
                  const stepNum = i + 1;
                  const done = isStepComplete(stepNum);
                  const isCurrent = currentStep === stepNum;
                  return (
                    <button
                      key={i}
                      onClick={() => { onJump(stepNum); onClose(); }}
                      className={`flex w-full items-center gap-3 rounded-2xl border bg-white p-3 text-left shadow-sm active:scale-[0.98] transition ${
                        isCurrent ? "border-[#7cc2c8]" : "border-white"
                      }`}
                    >
                      <div
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                          done ? "bg-[#A7F3D0]/60" : "bg-[#101927]/5"
                        }`}
                      >
                        {done ? (
                          <Check size={14} className="text-[#065f46]" />
                        ) : (
                          <span className="text-[11px] font-bold text-[#101927]/40">{stepNum}</span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-display text-[14px] font-semibold text-[#101927]">{t}</p>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/45">
                          {STEP_GROUPS[i]}
                        </p>
                      </div>
                      <ChevronRight size={14} className="text-[#101927]/30" />
                    </button>
                  );
                })}
              </div>

              <button
                onClick={onClose}
                className="mt-4 w-full rounded-2xl border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 py-3.5 font-display text-[13px] font-bold text-[#101927] active:scale-[0.98]"
              >
                Volver a la Sesión
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
