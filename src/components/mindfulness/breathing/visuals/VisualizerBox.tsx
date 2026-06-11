import { motion } from "framer-motion";
import type { PhaseId } from "@/lib/breathingPatterns";

interface Props {
  phaseId: PhaseId;
  duration: number;
  isActive: boolean;
}

// Loto/mandala: 4 pétalos que se abren rotando en cada ciclo.
export function VisualizerBox({ phaseId, duration, isActive }: Props) {
  const open = phaseId === "inhale" || phaseId === "hold";
  const rotation =
    phaseId === "inhale"
      ? 45
      : phaseId === "hold"
        ? 45
        : phaseId === "exhale"
          ? 90
          : 0;

  const petals = [
    { color: "#818CF8", x: 0, y: -1 }, // indigo - top
    { color: "#C084FC", x: 1, y: 0 }, // purple - right
    { color: "#60A5FA", x: 0, y: 1 }, // blue - bottom
    { color: "#2DD4BF", x: -1, y: 0 }, // teal - left
  ];

  const spread = open ? 42 : 0;

  return (
    <div className="relative h-[220px] w-[220px]">
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={{ rotate: rotation, scale: open ? 1 : 0.85 }}
        transition={{ duration, ease: "easeInOut" }}
      >
        {petals.map((p, i) => (
          <motion.div
            key={i}
            className="absolute h-[110px] w-[110px] rounded-full mix-blend-screen blur-[2px]"
            style={{ background: p.color, opacity: 0.55 }}
            animate={{
              x: p.x * spread,
              y: p.y * spread,
              scale: isActive ? (open ? 1 : 0.7) : 0.7,
            }}
            transition={{ duration, ease: "easeInOut" }}
          />
        ))}
        <div
          className="absolute h-[60px] w-[60px] rounded-full bg-white/80 blur-sm"
          aria-hidden
        />
      </motion.div>
    </div>
  );
}
