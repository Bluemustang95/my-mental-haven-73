import { motion } from "framer-motion";
import type { PhaseId } from "@/lib/breathingPatterns";

interface Props {
  phaseId: PhaseId;
  duration: number;
  isActive: boolean;
}

// Coherencia 5-5: orbe + anillos sinusoidales lentos.
export function VisualizerCoherence({ phaseId, duration }: Props) {
  const scale = phaseId === "inhale" ? 1.8 : 1;

  return (
    <div className="relative flex h-[220px] w-[220px] items-center justify-center">
      {/* Halo de fondo */}
      <motion.div
        className="absolute h-[200px] w-[200px] rounded-full bg-teal-400/20 blur-2xl"
        animate={{ scale: scale * 1.1 }}
        transition={{ duration, ease: "easeInOut" }}
      />
      {/* Anillos sinusoidales (rotación lenta continua) */}
      <motion.svg
        className="absolute h-[220px] w-[220px]"
        viewBox="-110 -110 220 220"
        animate={{ rotate: 360 }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        aria-hidden
      >
        <circle
          cx="0"
          cy="0"
          r="85"
          fill="none"
          stroke="rgba(45,212,191,0.35)"
          strokeWidth="1"
          strokeDasharray="4 8"
        />
        <circle
          cx="0"
          cy="0"
          r="70"
          fill="none"
          stroke="rgba(94,234,212,0.25)"
          strokeWidth="1"
          strokeDasharray="2 10"
        />
      </motion.svg>
      {/* Orbe central */}
      <motion.div
        className="relative h-24 w-24 rounded-full bg-teal-400/80"
        style={{
          boxShadow:
            "0 0 60px rgba(45,212,191,0.6), 0 0 120px rgba(45,212,191,0.3)",
        }}
        animate={{ scale }}
        transition={{ duration, ease: "easeInOut" }}
      />
    </div>
  );
}
