import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface Props {
  /** A monotonically increasing value (e.g. timestamp). Each change triggers a brief "Guardado ✓" flash. */
  trigger: number;
}

export function SaveIndicator({ trigger }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!trigger) return;
    setVisible(true);
    const t = window.setTimeout(() => setVisible(false), 1500);
    return () => window.clearTimeout(t);
  }, [trigger]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className="pointer-events-none fixed bottom-6 right-4 z-[90] flex items-center gap-1.5 rounded-full bg-[#101927]/85 px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg backdrop-blur-md"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
          Guardado
        </motion.div>
      )}
    </AnimatePresence>
  );
}
