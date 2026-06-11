import { motion } from "framer-motion";
import type { PhaseId } from "@/lib/breathingPatterns";

interface Props {
  phaseId: PhaseId;
  duration: number;
  isActive: boolean;
}

// 4-7-8: punto de luz que sube/baja por un carril con estela.
export function VisualizerSleep({ phaseId, duration }: Props) {
  const y = phaseId === "inhale" || phaseId === "hold" ? -80 : 80;
  const holdGlow = phaseId === "hold";

  const trail = [
    { delay: 0, opacity: 0.9, size: 48 },
    { delay: 0.08, opacity: 0.35, size: 40 },
    { delay: 0.16, opacity: 0.18, size: 32 },
  ];

  return (
    <div className="relative flex h-[220px] w-[220px] items-center justify-center">
      {/* Rail */}
      <div className="relative h-48 w-1 rounded-full bg-slate-700/50">
        {/* Trail dots */}
        {trail.map((t, i) => (
          <motion.div
            key={i}
            className="absolute left-1/2 top-1/2 rounded-full bg-blue-400"
            style={{
              width: t.size,
              height: t.size,
              marginLeft: -t.size / 2,
              marginTop: -t.size / 2,
              boxShadow:
                i === 0
                  ? "0 0 40px rgba(96,165,250,0.85), 0 0 80px rgba(96,165,250,0.4)"
                  : "0 0 18px rgba(96,165,250,0.4)",
              opacity: t.opacity,
            }}
            animate={{
              y,
              scale: holdGlow && i === 0 ? [1, 1.15, 1] : 1,
            }}
            transition={{
              y: { duration: duration - t.delay, ease: "easeInOut", delay: t.delay },
              scale: holdGlow
                ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
                : { duration: 0.3 },
            }}
          />
        ))}
      </div>
    </div>
  );
}
