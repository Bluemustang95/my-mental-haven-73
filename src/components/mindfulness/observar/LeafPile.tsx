import { motion } from "framer-motion";

interface PiledLeaf {
  id: string;
  /** horizontal offset within the pile, 0..1 */
  x: number;
  /** rotation in degrees */
  rotation: number;
  /** color tint */
  hue: number;
}

interface Props {
  leaves: PiledLeaf[];
}

/**
 * Visual pile of "released thoughts" that accumulates at the bottom.
 */
export function LeafPile({ leaves }: Props) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-44">
      {/* Soft ground gradient */}
      <div
        className="absolute inset-x-0 bottom-0 h-full"
        style={{
          background:
            "linear-gradient(to top, rgba(15,23,42,0.65) 0%, rgba(15,23,42,0.25) 60%, transparent 100%)",
        }}
      />
      {/* Counter */}
      {leaves.length > 0 && (
        <div className="absolute inset-x-0 top-2 text-center text-[11px] uppercase tracking-[0.2em] text-white/55">
          {leaves.length} {leaves.length === 1 ? "pensamiento soltado" : "pensamientos soltados"}
        </div>
      )}
      {/* Pile */}
      <div className="absolute inset-x-0 bottom-0 h-32">
        {leaves.map((leaf, i) => {
          const stackOffset = Math.floor(i / 8) * 4;
          const left = 10 + leaf.x * 80;
          const bottom = 8 + (i % 8) * 3 + stackOffset;
          return (
            <motion.div
              key={leaf.id}
              initial={{ y: -60, opacity: 0, rotate: leaf.rotation - 30 }}
              animate={{ y: 0, opacity: 1, rotate: leaf.rotation }}
              transition={{
                type: "spring",
                stiffness: 60,
                damping: 14,
                opacity: { duration: 0.6 },
              }}
              className="absolute"
              style={{ left: `${left}%`, bottom: `${bottom}px` }}
            >
              <LeafSvg hue={leaf.hue} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function LeafSvg({ hue }: { hue: number }) {
  // Greens/yellows palette around #10B981 / #FCD34D
  const colors = [
    ["#10B981", "#059669"],
    ["#34D399", "#047857"],
    ["#FCD34D", "#D97706"],
    ["#A3E635", "#65A30D"],
    ["#86EFAC", "#16A34A"],
  ];
  const [fill, stroke] = colors[hue % colors.length];
  return (
    <svg width="36" height="36" viewBox="0 0 64 64" aria-hidden>
      <defs>
        <linearGradient id={`lg-${hue}`} x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.95" />
        </linearGradient>
      </defs>
      <path
        d="M32 4 C 18 14, 10 28, 12 44 C 14 56, 26 60, 32 60 C 38 60, 50 56, 52 44 C 54 28, 46 14, 32 4 Z"
        fill={`url(#lg-${hue})`}
        stroke={stroke}
        strokeWidth="1"
      />
      <path d="M32 8 L 32 58" stroke="rgba(15,23,42,0.45)" strokeWidth="1.2" />
      <path d="M32 22 Q 24 26, 18 34" stroke="rgba(15,23,42,0.35)" strokeWidth="0.8" fill="none" />
      <path d="M32 30 Q 40 34, 46 42" stroke="rgba(15,23,42,0.35)" strokeWidth="0.8" fill="none" />
      <path d="M32 40 Q 24 44, 20 50" stroke="rgba(15,23,42,0.35)" strokeWidth="0.8" fill="none" />
    </svg>
  );
}
