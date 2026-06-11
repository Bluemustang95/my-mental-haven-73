import { motion } from "framer-motion";

interface Props {
  /** base hex color for the deep background */
  base?: string;
  /** accent for the slow gradient sweep */
  accent?: string;
}

/**
 * Layer 1 — Paper-textured base with a slow gradient sweep.
 * Pure SVG, GPU-friendly (transform/opacity only).
 */
export function PaperBackground({ base = "#0F172A", accent = "#10B981" }: Props) {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Solid base */}
      <div className="absolute inset-0" style={{ background: base }} />

      {/* Slow gradient sweep */}
      <motion.div
        className="absolute -inset-[20%]"
        style={{
          background: `radial-gradient(60% 50% at 50% 60%, ${accent}33 0%, transparent 60%)`,
        }}
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 90, ease: "linear", repeat: Infinity }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 50% 40%, transparent 50%, rgba(0,0,0,0.55) 100%)",
        }}
      />

      {/* Paper noise via SVG turbulence */}
      <svg className="absolute inset-0 h-full w-full opacity-[0.08] mix-blend-overlay" aria-hidden>
        <filter id="paperNoise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.5 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#paperNoise)" />
      </svg>
    </div>
  );
}
