type Props = {
  values: number[];
  width?: number;
  height?: number;
  stroke?: string;
  nodeFill?: string;
  showLabels?: boolean;
  labelFill?: string;
  className?: string;
};

export function Sparkline({
  values,
  width = 320,
  height = 56,
  stroke = "#7cc2c8",
  nodeFill = "#101927",
  showLabels = false,
  labelFill = "#7cc2c8",
  className,
}: Props) {
  if (!values.length) return null;
  const max = Math.max(...values);
  const min = Math.min(...values);
  const span = Math.max(1, max - min);
  const padX = 8;
  const padY = showLabels ? 18 : 8;
  const usableW = width - padX * 2;
  const usableH = height - padY * 2;
  const pts = values.map((v, i) => {
    const x = padX + (usableW * i) / Math.max(1, values.length - 1);
    const y = padY + usableH - ((v - min) / span) * usableH;
    return { x, y, v };
  });
  const d = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height={height}
      className={className}
      preserveAspectRatio="none"
    >
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <g key={i}>
          {showLabels && (
            <text x={p.x} y={p.y - 8} textAnchor="middle" fontSize={10} fill={labelFill} fontWeight={500}>
              {p.v}
            </text>
          )}
          <circle cx={p.x} cy={p.y} r={2.8} fill={nodeFill} stroke={stroke} strokeWidth={1.4} />
        </g>
      ))}
    </svg>
  );
}
