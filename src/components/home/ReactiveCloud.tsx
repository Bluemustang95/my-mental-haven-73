import { motion } from "framer-motion";

export type CloudPhase = {
  emoji: string;
  label: string;
  tint: string;
};

export function getCloudPhase(value: number): CloudPhase {
  if (value <= 25) return { emoji: "⛈️", label: "Pésimo descanso con tormenta mental", tint: "rgba(100,116,139,0.18)" };
  if (value <= 50) return { emoji: "☁️", label: "Normal, un poco gris y pesado", tint: "rgba(148,163,184,0.16)" };
  if (value <= 75) return { emoji: "🌤️", label: "Buen descanso, cielo despejado", tint: "rgba(124,194,200,0.18)" };
  return { emoji: "☀️✨", label: "¡Excelente! Energizado y radiante", tint: "rgba(250,203,96,0.22)" };
}

export function ReactiveCloud({ value }: { value: number }) {
  const phase = getCloudPhase(value);
  return (
    <div
      className="relative mx-auto flex h-40 w-full items-center justify-center overflow-hidden rounded-3xl transition-colors duration-500"
      style={{ background: phase.tint }}
    >
      <motion.div
        key={phase.emoji}
        initial={{ scale: 0.7, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="text-7xl drop-shadow-md"
      >
        {phase.emoji}
      </motion.div>
    </div>
  );
}

export function ReactiveCloudCaption({ value }: { value: number }) {
  const phase = getCloudPhase(value);
  return (
    <motion.p
      key={phase.label}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center font-serifElegant text-[15px] italic text-foreground/80"
    >
      {phase.label}
    </motion.p>
  );
}
