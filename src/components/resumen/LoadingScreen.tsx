import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";

export function LoadingScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex min-h-[70vh] flex-col items-center justify-center gap-6 px-8 text-center"
    >
      <motion.div
        animate={{ y: [0, -12, 0] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
        className="flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-[#7cc2c8] to-[#5aa8ae] shadow-[0_10px_30px_rgba(124,194,200,0.4)]"
      >
        <Sparkles size={32} className="text-white" />
      </motion.div>
      <div>
        <p className="font-display text-[18px] font-semibold text-[#0f172a]">Preparando tu resumen…</p>
        <p className="mt-1.5 text-[12.5px] text-[#64748b]">
          Estamos organizando lo que elegiste compartir.
        </p>
      </div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
            className="h-1.5 w-1.5 rounded-full bg-[#7cc2c8]"
          />
        ))}
      </div>
    </motion.div>
  );
}
