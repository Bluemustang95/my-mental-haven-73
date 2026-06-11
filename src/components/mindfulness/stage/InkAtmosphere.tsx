import { motion } from "framer-motion";

interface Props {
  /** breathing factor 0..1 — 0 contracted, 1 expanded */
  breath?: number;
  /** main accent color */
  accent?: string;
  /** secondary accent */
  secondary?: string;
  /** duration of the breath transition in seconds */
  duration?: number;
}

/**
 * Layer 2 — Three watercolor blobs that softly drift and "breathe".
 * When `breath` is provided, the atmosphere expands/contracts with the user.
 * Otherwise it loops gently on its own.
 */
export function InkAtmosphere({
  breath,
  accent = "#10B981",
  secondary = "#FCD34D",
  duration = 4,
}: Props) {
  const driven = typeof breath === "number";
  const scaleA = driven ? 0.85 + breath * 0.4 : undefined;
  const scaleB = driven ? 0.75 + breath * 0.5 : undefined;

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden mix-blend-screen">
      <motion.div
        className="absolute left-[-15%] top-[10%] h-[60vh] w-[60vh] rounded-full blur-3xl"
        style={{ background: accent, opacity: 0.28 }}
        animate={
          driven
            ? { scale: scaleA }
            : { scale: [0.9, 1.1, 0.9], x: [-10, 20, -10], y: [0, -15, 0] }
        }
        transition={
          driven
            ? { duration, ease: "easeInOut" }
            : { duration: 16, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute right-[-20%] bottom-[5%] h-[55vh] w-[55vh] rounded-full blur-3xl"
        style={{ background: secondary, opacity: 0.18 }}
        animate={
          driven
            ? { scale: scaleB }
            : { scale: [1, 0.85, 1], x: [10, -10, 10], y: [10, -10, 10] }
        }
        transition={
          driven
            ? { duration, ease: "easeInOut" }
            : { duration: 20, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute left-[30%] top-[40%] h-[40vh] w-[40vh] rounded-full blur-3xl"
        style={{ background: "#FDFCFB", opacity: 0.06 }}
        animate={{ scale: [0.95, 1.15, 0.95] }}
        transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}
