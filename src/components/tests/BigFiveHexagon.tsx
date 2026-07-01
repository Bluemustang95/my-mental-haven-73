import { motion } from "framer-motion";

const dims = [
  { code: "O", label: "Apertura" },
  { code: "C", label: "Responsabilidad" },
  { code: "E", label: "Extraversión" },
  { code: "A", label: "Amabilidad" },
  { code: "N", label: "Estabilidad" },
];

export function BigFiveHexagon({
  scores,
  preview = false,
  size = 260,
}: {
  /** value 0..1 per dim code (O,C,E,A,N) */
  scores?: Record<string, number>;
  preview?: boolean;
  size?: number;
}) {
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.38;
  const n = dims.length;
  const angle = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / n;

  const axis = (i: number, factor = 1) => ({
    x: cx + Math.cos(angle(i)) * r * factor,
    y: cy + Math.sin(angle(i)) * r * factor,
  });

  const grid = [0.25, 0.5, 0.75, 1].map((f) =>
    dims.map((_, i) => axis(i, f)).map((p) => `${p.x},${p.y}`).join(" ")
  );

  const valuePoly = dims
    .map((d, i) => {
      const v = scores?.[d.code] ?? 0;
      const p = axis(i, Math.max(0.05, v));
      return `${p.x},${p.y}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${size} ${size}`} width={size} height={size} className="mx-auto">
      {grid.map((pts, idx) => (
        <polygon
          key={idx}
          points={pts}
          fill="none"
          stroke="rgba(15,23,42,0.10)"
          strokeWidth={1}
        />
      ))}
      {dims.map((_, i) => {
        const p = axis(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(15,23,42,0.08)" />;
      })}
      {!preview && scores && (
        <motion.polygon
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, type: "spring" }}
          style={{ transformOrigin: `${cx}px ${cy}px` }}
          points={valuePoly}
          fill="rgba(124,194,200,0.35)"
          stroke="#7cc2c8"
          strokeWidth={2}
        />
      )}
      {dims.map((d, i) => {
        const p = axis(i, 1.18);
        return (
          <g key={d.code}>
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#64748b"
              fontSize={11}
              fontWeight={600}
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
