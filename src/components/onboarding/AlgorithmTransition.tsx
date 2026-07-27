import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ResmaIsotipoMark } from "@/components/brand/ResmaIsotipoMark";

const TEAL = "#7cc2c8";
const INK = "#101927";

const MESSAGES = [
  "Analizando tus respuestas…",
  "Diseñando tu camino…",
  "Preparando tu rincón…",
];

export function AlgorithmTransition({ onDone }: { onDone: () => void }) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    // Delay deliberado: transmite que el algoritmo está procesando.
    const a = setTimeout(() => setIdx(1), 1600);
    const b = setTimeout(() => setIdx(2), 3400);
    const c = setTimeout(() => onDone(), 5200);
    return () => {
      clearTimeout(a);
      clearTimeout(b);
      clearTimeout(c);
    };
  }, [onDone]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6">
      <div className="relative h-40 w-40">
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{ background: TEAL, opacity: 0.18, filter: "blur(20px)" }}
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute inset-4 rounded-full"
          style={{ background: TEAL, opacity: 0.35 }}
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            animate={{ rotateY: 360 }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "linear" }}
            style={{ transformStyle: "preserve-3d" }}
          >
            <ResmaIsotipoMark size={74} color={INK} />
          </motion.div>
        </div>
      </div>

      <motion.p
        key={idx}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="mt-10 text-center text-[15px] font-semibold"
        style={{ color: INK }}
      >
        {MESSAGES[idx]}
      </motion.p>
      <p className="mt-2 text-center text-xs" style={{ color: "rgba(16,25,39,0.55)" }}>
        Personalizando tu plan en base a tus respuestas.
      </p>
    </div>
  );
}
