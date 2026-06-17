import { motion, AnimatePresence } from "framer-motion";
import { Clock, X } from "lucide-react";

interface Props {
  open: boolean;
  hoursAgo: number;
  emotion?: string | null;
  stageLabel: string;
  onResume: () => void;
  onDiscard: () => void;
}

function formatAgo(hoursAgo: number): string {
  if (hoursAgo < 1) return "hace menos de una hora";
  if (hoursAgo < 24) return `hace ${Math.round(hoursAgo)} h`;
  const days = Math.round(hoursAgo / 24);
  return days === 1 ? "hace 1 día" : `hace ${days} días`;
}

export function ResumeSessionBanner({ open, hoursAgo, emotion, stageLabel, onResume, onDiscard }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -16 }}
          transition={{ duration: 0.25 }}
          className="mx-4 mt-3 rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-[#facb60]/15 via-white to-[#7cc2c8]/10 p-4 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#facb60]/25 text-[#101927]">
              <Clock size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display text-[14px] font-bold text-[#101927]">
                Tenés una sesión sin terminar
              </p>
              <p className="mt-0.5 font-body text-[12px] leading-5 text-[#101927]/70">
                {emotion ? <>Estabas trabajando <strong>{emotion}</strong> en <em>{stageLabel}</em>, </> : <>Quedó pendiente en <em>{stageLabel}</em>, </>}
                {formatAgo(hoursAgo)}.
              </p>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={onResume}
                  className="rounded-full bg-[#101927] px-4 py-1.5 font-display text-[12px] font-semibold text-white"
                >
                  Continuar
                </button>
                <button
                  onClick={onDiscard}
                  className="rounded-full border border-[#101927]/15 bg-white px-3 py-1.5 font-display text-[12px] font-semibold text-[#101927]/70"
                >
                  Empezar de cero
                </button>
              </div>
            </div>
            <button
              onClick={onDiscard}
              aria-label="Cerrar"
              className="text-[#101927]/40 hover:text-[#101927]/70"
            >
              <X size={16} />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
