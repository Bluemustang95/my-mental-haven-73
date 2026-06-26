import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { STEP_HELP } from "@/lib/pensamientos/stepHelp";

type Props = { open: boolean; step: number; onClose: () => void };

export default function PsicoeducacionModal({ open, step, onClose }: Props) {
  const help = STEP_HELP[step];
  if (!help) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/30 backdrop-blur-sm px-5"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-[380px] rounded-[28px] border border-white/70 bg-white/95 p-6 shadow-2xl backdrop-blur-xl"
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-[#101927]/5 active:scale-95"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>

            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">
              Psicoeducación
            </p>
            <h3 className="mt-1 font-serif text-[24px] font-bold leading-tight text-[#101927]">
              {help.title}
            </h3>

            <div className="mt-3 space-y-2.5">
              {help.body.map((p, i) => (
                <p key={i} className="font-serif text-[14px] leading-relaxed text-[#101927]/75">
                  {p}
                </p>
              ))}
            </div>

            <div className="mt-4 rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-[#facb60]/20 to-white/40 p-4">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                Pregunta llave
              </p>
              <p className="mt-1 font-serif text-[16px] italic leading-snug text-[#101927]">
                "{help.llave}"
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
