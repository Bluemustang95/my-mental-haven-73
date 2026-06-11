import { motion } from "framer-motion";
import type { PhaseId } from "@/lib/breathingPatterns";

interface Props {
  phaseId: PhaseId;
  duration: number;
  isActive: boolean;
}

// Suspiro fisiológico: burbuja rosa que se llena en dos tiempos.
export function VisualizerSigh({ phaseId, duration }: Props) {
  const fill =
    phaseId === "inhale"
      ? 60
      : phaseId === "inhale2"
        ? 100
        : phaseId === "exhale"
          ? 10
          : 10;

  const pop = phaseId === "inhale2";

  return (
    <div className="relative flex h-[220px] w-[220px] items-center justify-center">
      <motion.div
        className="relative h-40 w-40 overflow-hidden rounded-full border-2 border-rose-300/40 bg-slate-900/40 backdrop-blur-sm"
        animate={{ scale: pop ? [1, 1.08, 1] : 1 }}
        transition={{ duration: pop ? 0.3 : 0.2 }}
        style={{
          boxShadow: "inset 0 0 30px rgba(251,113,133,0.15)",
        }}
      >
        {/* Líquido */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-rose-500 to-rose-300"
          style={{
            boxShadow: "0 -8px 30px rgba(251,113,133,0.7)",
          }}
          animate={{ height: `${fill}%` }}
          transition={{ duration, ease: "easeInOut" }}
        />
        {/* Reflejo */}
        <div className="absolute left-6 top-6 h-12 w-6 rounded-full bg-white/20 blur-md" />
      </motion.div>
    </div>
  );
}
