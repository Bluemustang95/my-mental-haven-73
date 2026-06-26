import { motion } from "framer-motion";

export type MoonPhase = {
  emoji: string;
  label: string;
  tint: string;
};

export function getMoonPhase(value: number): MoonPhase {
  if (value <= 25) return { emoji: "🌑", label: "Día agotador o muy cuesta arriba", tint: "rgba(30,41,59,0.25)" };
  if (value <= 50) return { emoji: "🌙", label: "Día normal, con algunos altibajos", tint: "rgba(99,102,241,0.18)" };
  if (value <= 75) return { emoji: "🌗", label: "Muy buen día, balance positivo", tint: "rgba(124,194,200,0.20)" };
  return { emoji: "🌕✨", label: "¡Excelente día! Pleno de satisfacción", tint: "rgba(250,203,96,0.25)" };
}

export function ReactiveMoon({ value }: { value: number }) {
  const phase = getMoonPhase(value);
  return (
    <div
      className="relative mx-auto flex h-40 w-full items-center justify-center overflow-hidden rounded-3xl transition-colors duration-500"
      style={{ background: phase.tint }}
    >
      <motion.div
        key={phase.emoji}
        initial={{ scale: 0.7, opacity: 0, rotate: -8 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 220, damping: 18 }}
        className="text-7xl drop-shadow-md"
      >
        {phase.emoji}
      </motion.div>
    </div>
  );
}

export function ReactiveMoonCaption({ value }: { value: number }) {
  const phase = getMoonPhase(value);
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
