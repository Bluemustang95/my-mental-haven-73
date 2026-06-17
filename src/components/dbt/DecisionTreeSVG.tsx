import { motion } from "framer-motion";

interface Props {
  fitsFacts: boolean | null;
  isEffective: boolean | null;
}

/**
 * Árbol de decisión animado para Ficha 9 (Mente Sabia).
 * Muestra cómo (fitsFacts × isEffective) determina el camino: Resolver vs Acción Opuesta.
 */
export function DecisionTreeSVG({ fitsFacts, isEffective }: Props) {
  const path: "problem" | "opposite" | null =
    fitsFacts === null || isEffective === null
      ? null
      : fitsFacts && isEffective
        ? "problem"
        : "opposite";

  const stroke = (active: boolean) => (active ? "#7cc2c8" : "#101927");
  const opacity = (active: boolean) => (active ? 1 : 0.15);

  return (
    <div className="rounded-[24px] bg-white border border-[#101927]/8 p-4">
      <p className="font-display text-[10px] tracking-[0.12em] uppercase text-[#7cc2c8] font-bold mb-3">
        Camino sugerido
      </p>
      <svg viewBox="0 0 320 180" className="w-full h-auto">
        {/* nodo raíz */}
        <motion.circle
          cx="160" cy="22" r="14"
          fill="#101927"
          initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.4 }}
        />
        <text x="160" y="26" textAnchor="middle" fontSize="11" fill="#facb60" fontWeight="700">Tu emoción</text>

        {/* línea hacia decisión fitsFacts */}
        <motion.line
          x1="160" y1="36" x2="160" y2="64"
          stroke="#101927" strokeWidth="2"
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: 0.1 }}
        />

        {/* nodo fitsFacts */}
        <rect x="100" y="62" width="120" height="28" rx="14" fill="#f2f2f2" stroke="#101927" strokeOpacity="0.1"/>
        <text x="160" y="80" textAnchor="middle" fontSize="11" fill="#101927" fontWeight="600">
          ¿Se ajusta a los hechos?
        </text>

        {/* ramas SI/NO */}
        <motion.path
          d="M 130 90 Q 90 110 70 130"
          stroke={stroke(fitsFacts === true)} strokeWidth={fitsFacts === true ? 3 : 2}
          fill="none" strokeOpacity={opacity(fitsFacts === true)}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }}
        />
        <motion.path
          d="M 190 90 Q 230 110 250 130"
          stroke={stroke(fitsFacts === false)} strokeWidth={fitsFacts === false ? 3 : 2}
          fill="none" strokeOpacity={opacity(fitsFacts === false)}
          initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.4, delay: 0.2 }}
        />
        <text x="100" y="108" textAnchor="middle" fontSize="9" fill="#101927" opacity={opacity(fitsFacts === true)} fontWeight="700">SÍ</text>
        <text x="220" y="108" textAnchor="middle" fontSize="9" fill="#101927" opacity={opacity(fitsFacts === false)} fontWeight="700">NO</text>

        {/* hojas: ¿efectivo? */}
        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
        >
          <rect x="20" y="128" width="100" height="38" rx="12"
            fill={path === "problem" ? "#7cc2c8" : "#ffffff"}
            stroke="#7cc2c8" strokeOpacity={path === "problem" ? 1 : 0.3}
            strokeWidth={path === "problem" ? 2.5 : 1.5}
          />
          <text x="70" y="146" textAnchor="middle" fontSize="10"
            fill={path === "problem" ? "#ffffff" : "#101927"} fontWeight="700">Resolver</text>
          <text x="70" y="160" textAnchor="middle" fontSize="9"
            fill={path === "problem" ? "#facb60" : "#101927"} opacity="0.7">Ficha 12</text>
        </motion.g>

        <motion.g
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
        >
          <rect x="200" y="128" width="100" height="38" rx="12"
            fill={path === "opposite" ? "#facb60" : "#ffffff"}
            stroke="#facb60" strokeOpacity={path === "opposite" ? 1 : 0.4}
            strokeWidth={path === "opposite" ? 2.5 : 1.5}
          />
          <text x="250" y="146" textAnchor="middle" fontSize="10"
            fill="#101927" fontWeight="700">Acción Opuesta</text>
          <text x="250" y="160" textAnchor="middle" fontSize="9"
            fill="#101927" opacity="0.7">Ficha 10 · 13</text>
        </motion.g>
      </svg>

      {path && (
        <motion.p
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="mt-2 text-center font-body text-[12px] text-[#101927]/70"
        >
          {path === "problem"
            ? "Tu emoción es válida y actuar es efectivo → resolvemos el problema."
            : "El impulso no te acerca a lo que querés → trabajamos Acción Opuesta."}
        </motion.p>
      )}
    </div>
  );
}
