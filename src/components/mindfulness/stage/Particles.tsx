import { useMemo } from "react";
import { motion } from "framer-motion";

interface Props {
  count?: number;
  /** color of the motes */
  color?: string;
  /** size factor */
  scale?: number;
}

/**
 * Layer 4 — Light/pollen motes drifting upward. GPU-friendly.
 */
export function Particles({ count = 16, color = "#FDFCFB", scale = 1 }: Props) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }).map((_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: (1 + Math.random() * 2.4) * scale,
        delay: Math.random() * 12,
        duration: 14 + Math.random() * 14,
        drift: (Math.random() - 0.5) * 60,
        opacity: 0.25 + Math.random() * 0.45,
      })),
    [count, scale]
  );

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {motes.map((m) => (
        <motion.div
          key={m.id}
          className="absolute bottom-[-10%] rounded-full"
          style={{
            left: `${m.left}%`,
            width: m.size * 4,
            height: m.size * 4,
            background: color,
            opacity: m.opacity,
            boxShadow: `0 0 ${m.size * 6}px ${color}`,
          }}
          animate={{
            y: ["0vh", "-115vh"],
            x: [0, m.drift, -m.drift, 0],
            opacity: [0, m.opacity, m.opacity, 0],
          }}
          transition={{
            duration: m.duration,
            delay: m.delay,
            repeat: Infinity,
            ease: "linear",
            opacity: { duration: m.duration, delay: m.delay, repeat: Infinity, times: [0, 0.1, 0.9, 1] },
          }}
        />
      ))}
    </div>
  );
}
