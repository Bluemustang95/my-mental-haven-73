import { motion } from "framer-motion";

interface Props {
  emotion: string;
  before: string;
  afterLabel: string;
  after: string;
}

/**
 * Tarjetas comparativas Antes / Después en glassmorphism.
 * Visualiza la transformación: del impulso/evento al plan de Mente Sabia.
 */
export function BeforeAfterCompare({ emotion, before, afterLabel, after }: Props) {
  if (!before && !after) return null;
  return (
    <div className="grid grid-cols-2 gap-2.5">
      <motion.div
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        className="rounded-[20px] border border-[#101927]/10 bg-white/60 backdrop-blur-md p-3.5 min-h-[140px] flex flex-col"
      >
        <p className="font-display text-[9px] tracking-[0.12em] uppercase text-[#101927]/50 font-bold mb-1.5">
          Antes
        </p>
        <p className="font-display text-[13px] font-bold text-[#101927] mb-1.5">
          {emotion}
        </p>
        <p className="font-body text-[12px] leading-5 text-[#101927]/70 line-clamp-5">
          {before || "—"}
        </p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
        className="rounded-[20px] border border-[#7cc2c8]/40 bg-gradient-to-br from-[#7cc2c8]/15 via-white/60 to-[#facb60]/10 backdrop-blur-md p-3.5 min-h-[140px] flex flex-col"
      >
        <p className="font-display text-[9px] tracking-[0.12em] uppercase text-[#7cc2c8] font-bold mb-1.5">
          {afterLabel}
        </p>
        <p className="font-display text-[13px] font-bold text-[#101927] mb-1.5">
          Mente Sabia
        </p>
        <p className="font-body text-[12px] leading-5 text-[#101927]/80 line-clamp-5">
          {after || "—"}
        </p>
      </motion.div>
    </div>
  );
}
