import { motion } from "framer-motion";

interface Props {
  onDone: () => void;
}

/**
 * Micro-onboarding 15s: un orbe respira un ciclo completo y un texto explica
 * cómo seguirlo. Se muestra solo la primera vez.
 */
export function BreathingOnboarding({ onDone }: Props) {
  return (
    <div className="fixed inset-0 z-[110] flex flex-col items-center justify-center bg-[#0F172A] px-6 text-center text-white">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/40">Cómo se usa</p>
      <h2 className="mt-2 font-serif text-2xl font-bold">Respirá con el orbe</h2>
      <p className="mt-2 max-w-xs text-sm text-white/65">
        Inhalá mientras crece, sostené cuando se queda quieto y exhalá mientras se achica.
      </p>

      <div className="relative my-8 flex h-56 w-56 items-center justify-center">
        <motion.div
          initial={{ scale: 0.7, opacity: 0.5 }}
          animate={{
            scale: [0.7, 1.15, 1.15, 0.7, 0.7],
            opacity: [0.55, 1, 1, 0.6, 0.55],
          }}
          transition={{ duration: 7, ease: "easeInOut", times: [0, 0.28, 0.45, 0.85, 1] }}
          className="absolute inset-0 rounded-full bg-gradient-to-br from-[#FB923C] to-[#FCD34D] blur-2xl"
        />
        <motion.div
          initial={{ scale: 0.7 }}
          animate={{ scale: [0.7, 1.15, 1.15, 0.7, 0.7] }}
          transition={{ duration: 7, ease: "easeInOut", times: [0, 0.28, 0.45, 0.85, 1] }}
          className="relative z-10 flex h-32 w-32 items-center justify-center rounded-full bg-white/15 backdrop-blur"
        >
          <motion.span
            animate={{ opacity: [0, 1, 1, 1, 0] }}
            transition={{ duration: 7, times: [0, 0.05, 0.45, 0.85, 1] }}
            className="font-display text-sm font-semibold text-white"
          >
            Respirá conmigo
          </motion.span>
        </motion.div>
      </div>

      <button
        onClick={onDone}
        className="rounded-full bg-white px-8 py-3 text-sm font-semibold text-[#0F172A] shadow-xl"
      >
        Entendido
      </button>
      <button onClick={onDone} className="mt-3 text-[11px] text-white/40">
        Saltar
      </button>
    </div>
  );
}
