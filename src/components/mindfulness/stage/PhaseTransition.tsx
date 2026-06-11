import { ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";

interface Props {
  phaseKey: string;
  children: ReactNode;
  /** "in" = sube acuarela floreciendo, "out" = se disuelve hacia arriba */
  variant?: "in" | "out" | "cross";
}

/**
 * Cinematographic transitions for intro → play → outro stacks.
 */
export function PhaseTransition({ phaseKey, children, variant = "cross" }: Props) {
  const initial =
    variant === "in"
      ? { opacity: 0, y: 40, scale: 0.96 }
      : variant === "out"
        ? { opacity: 0, y: 30, scale: 1.02 }
        : { opacity: 0, scale: 0.98 };

  const exit =
    variant === "out"
      ? { opacity: 0, y: -40, scale: 1.04, filter: "blur(8px)" }
      : { opacity: 0, scale: 1.02, filter: "blur(4px)" };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={phaseKey}
        initial={initial}
        animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
        exit={exit}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="absolute inset-0"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
