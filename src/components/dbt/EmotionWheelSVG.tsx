import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EMOTION_TINT, type DbtEmotion } from "@/lib/dbt/data";
import { EMOTION_NUANCES, WHEEL_ORDER } from "@/lib/dbt/emotionWheel";

interface Props {
  selected: DbtEmotion | null;
  onSelect: (e: DbtEmotion, nuance?: string) => void;
}

const SIZE = 320;
const CX = SIZE / 2;
const CY = SIZE / 2;
const R_OUTER = 150;
const R_INNER = 56;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number, rOuter: number, rInner: number) {
  const a = polar(CX, CY, rOuter, startDeg);
  const b = polar(CX, CY, rOuter, endDeg);
  const c = polar(CX, CY, rInner, endDeg);
  const d = polar(CX, CY, rInner, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${a.x} ${a.y} A ${rOuter} ${rOuter} 0 ${large} 1 ${b.x} ${b.y} L ${c.x} ${c.y} A ${rInner} ${rInner} 0 ${large} 0 ${d.x} ${d.y} Z`;
}

/**
 * Rueda de emociones interactiva (Plutchik adaptada a DBT).
 * Tap en un sector → expande mostrando matices clínicos (intensidad creciente).
 * Tap fuera → vuelve a la rueda completa.
 */
export function EmotionWheelSVG({ selected, onSelect }: Props) {
  const [expanded, setExpanded] = useState<DbtEmotion | null>(selected);
  const step = 360 / WHEEL_ORDER.length;

  const handleSectorClick = (em: DbtEmotion) => {
    if (expanded === em) {
      // Segundo tap: confirmar emoción primaria sin matiz.
      onSelect(em);
    } else {
      setExpanded(em);
      onSelect(em);
    }
  };

  const nuances = expanded ? EMOTION_NUANCES[expanded] : [];

  return (
    <div className="relative mx-auto" style={{ width: SIZE, maxWidth: "100%" }}>
      <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-auto select-none">
        {/* Sectores primarios */}
        {WHEEL_ORDER.map((em, i) => {
          const start = i * step;
          const end = start + step;
          const mid = start + step / 2;
          const labelPos = polar(CX, CY, (R_OUTER + R_INNER) / 2, mid);
          const tint = EMOTION_TINT[em];
          const isExpanded = expanded === em;
          const dim = expanded && !isExpanded ? 0.25 : 1;
          return (
            <g key={em} style={{ cursor: "pointer" }} onClick={() => handleSectorClick(em)}>
              <motion.path
                d={arcPath(start, end, R_OUTER, R_INNER)}
                fill={tint}
                initial={false}
                animate={{ opacity: dim * (isExpanded ? 0.95 : 0.75) }}
                whileTap={{ scale: 0.97 }}
              />
              <text
                x={labelPos.x} y={labelPos.y}
                textAnchor="middle" dominantBaseline="middle"
                fontSize={isExpanded ? 13 : 11}
                fontWeight={isExpanded ? 800 : 600}
                fill="#101927"
                opacity={dim}
                style={{ pointerEvents: "none" }}
              >
                {em}
              </text>
            </g>
          );
        })}

        {/* Núcleo */}
        <circle cx={CX} cy={CY} r={R_INNER - 4} fill="#fff" stroke="#101927" strokeOpacity="0.08" />
        <text x={CX} y={CY - 6} textAnchor="middle" fontSize="9" fontWeight="700" fill="#7cc2c8" style={{ letterSpacing: 1 }}>
          ELEGÍ
        </text>
        <text x={CX} y={CY + 8} textAnchor="middle" fontSize="9" fill="#101927" opacity="0.55">
          una emoción
        </text>
      </svg>

      {/* Matices del sector expandido */}
      <AnimatePresence mode="wait">
        {expanded && nuances.length > 0 && (
          <motion.div
            key={expanded}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            className="mt-4 rounded-[24px] border p-4"
            style={{
              borderColor: `${EMOTION_TINT[expanded]}55`,
              background: `linear-gradient(180deg, ${EMOTION_TINT[expanded]}15, #ffffff)`,
            }}
          >
            <div className="flex items-center justify-between mb-2">
              <p className="font-display text-[10px] tracking-[0.12em] uppercase font-bold" style={{ color: "#101927" }}>
                Matices de {expanded}
              </p>
              <button
                onClick={() => setExpanded(null)}
                className="text-[10px] font-display font-semibold text-[#101927]/50 active:scale-95"
                aria-label="Cerrar matices"
              >
                cerrar
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {nuances.map((n) => (
                <button
                  key={n.label}
                  onClick={() => onSelect(expanded, n.label)}
                  className="rounded-full border px-3 py-1.5 font-display text-[12px] font-semibold active:scale-95 transition"
                  style={{
                    borderColor: `${EMOTION_TINT[expanded]}${Math.round(n.intensity * 99)}`,
                    background: `${EMOTION_TINT[expanded]}${Math.round(n.intensity * 40 + 10).toString(16).padStart(2, "0")}`,
                    color: "#101927",
                  }}
                >
                  {n.label}
                </button>
              ))}
            </div>
            <p className="mt-3 font-body text-[11px] text-[#101927]/55">
              Tocá un matiz para usarlo, o seguí con <strong>{expanded}</strong>.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
