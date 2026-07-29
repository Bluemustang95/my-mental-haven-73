import { useNavigate } from "react-router-dom";
import { TrendingDown } from "lucide-react";

type Props = {
  score: number;
  delta: number;
  message?: string;
  trend?: number[];
  hasEnoughData?: boolean;
  daysWithCheckin?: number;
  minDays?: number;
  onOpen: () => void;
};

export function bandFor(score: number) {
  if (score >= 70) return { label: "En equilibrio", color: "#4ade80" };
  if (score >= 45) return { label: "Con altibajos", color: "#facb60" };
  return { label: "Semana difícil", color: "#f87171" };
}

/** Anillo de progreso SVG (0-100). */
function ScoreRing({
  score,
  color,
  dashed,
  children,
}: {
  score: number;
  color: string;
  dashed?: boolean;
  children: React.ReactNode;
}) {
  const R = 34;
  const C = 2 * Math.PI * R;
  const pct = Math.max(0, Math.min(100, score));
  return (
    <div className="relative h-[84px] w-[84px] shrink-0">
      <svg viewBox="0 0 84 84" className="h-full w-full -rotate-90">
        <circle
          cx="42"
          cy="42"
          r={R}
          fill="none"
          stroke="rgba(255,255,255,0.14)"
          strokeWidth="5"
          strokeDasharray={dashed ? "3 6" : undefined}
          strokeLinecap="round"
        />
        {!dashed && (
          <circle
            cx="42"
            cy="42"
            r={R}
            fill="none"
            stroke={color}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (pct / 100) * C}
            style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.32,1,0.28,1)" }}
          />
        )}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Sparkline de 7 días; los días sin check-in quedan como hueco, no como cero. */
function Sparkline({ trend, color }: { trend: number[]; color: string }) {
  const W = 78;
  const H = 26;
  const step = trend.length > 1 ? W / (trend.length - 1) : W;
  const pts = trend.map((v, i) => ({
    x: i * step,
    y: H - (Math.max(0, Math.min(100, v)) / 100) * (H - 4) - 2,
    empty: !v,
  }));

  // Segmentos continuos, cortados en los huecos
  const segments: string[] = [];
  let current: string[] = [];
  for (const p of pts) {
    if (p.empty) {
      if (current.length > 1) segments.push(current.join(" "));
      current = [];
    } else {
      current.push(`${current.length ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`);
    }
  }
  if (current.length > 1) segments.push(current.join(" "));

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[26px] w-[78px]" aria-hidden>
      {segments.map((d, i) => (
        <path key={i} d={d} fill="none" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      ))}
      {pts.map((p, i) =>
        p.empty ? (
          <circle key={i} cx={p.x} cy={H - 2} r="1" fill="rgba(255,255,255,0.25)" />
        ) : (
          <circle key={i} cx={p.x} cy={p.y} r="1.5" fill={color} opacity={i === pts.length - 1 ? 1 : 0.5} />
        ),
      )}
    </svg>
  );
}

export function WellbeingCardV2({
  score,
  delta,
  message,
  trend = [],
  hasEnoughData = true,
  daysWithCheckin = 0,
  minDays = 3,
  onOpen,
}: Props) {
  const navigate = useNavigate();
  const band = bandFor(score);
  const negative = delta < 0;

  // ── Estado sin datos suficientes ──
  if (!hasEnoughData) {
    return (
      <div className="relative overflow-hidden rounded-[20px] bg-[#101927] px-5 py-4 shadow-[0_14px_32px_-20px_rgba(16,25,39,0.55)]">
        <div className="flex items-center gap-4">
          <ScoreRing score={0} color="#7cc2c8" dashed>
            <span className="font-display text-[15px] font-semibold text-white/85 tabular-nums">
              {daysWithCheckin}/{minDays}
            </span>
            <span className="mt-0.5 text-[8.5px] uppercase tracking-[0.12em] text-white/35">días</span>
          </ScoreRing>
          <div className="min-w-0 flex-1">
            <p className="font-display text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
              Índice de bienestar
            </p>
            <p className="mt-1 font-display text-[13px] font-medium leading-snug text-white/85">
              Necesitamos {minDays} días de registro para calcularlo.
            </p>
            <button
              onClick={() => navigate("/ritual/sintonia")}
              className="pressable mt-2.5 rounded-full bg-[#7cc2c8] px-3.5 py-1.5 font-display text-[11.5px] font-semibold text-[#0b1220] active:scale-95"
            >
              Registrar mi Sintonía de hoy
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-[20px] bg-[#101927] px-5 py-4 text-left shadow-[0_14px_32px_-20px_rgba(16,25,39,0.55)] transition active:scale-[0.99]"
    >
      <div className="flex items-center gap-4">
        <ScoreRing score={score} color={band.color}>
          <span className="font-display text-[26px] font-bold leading-none text-white tabular-nums">{score}</span>
          <span className="mt-0.5 text-[8.5px] text-white/35">/ 100</span>
        </ScoreRing>

        <div className="min-w-0 flex-1">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
            Índice de bienestar
          </p>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <span
              className="rounded-full px-2 py-0.5 font-display text-[10.5px] font-semibold"
              style={{ background: `${band.color}26`, color: band.color }}
            >
              {band.label}
            </span>
            {delta !== 0 && (
              <span
                className="flex items-center gap-1 rounded-full px-2 py-0.5 font-display text-[10.5px] font-medium"
                style={{
                  background: negative ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
                  color: negative ? "#f87171" : "#4ade80",
                }}
              >
                <TrendingDown size={10} className={negative ? "" : "rotate-180"} />
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </div>
          {message && (
            <p className="mt-1.5 line-clamp-2 font-display text-[11.5px] leading-snug text-white/55">{message}</p>
          )}
        </div>

        {trend.length > 0 && (
          <div className="hidden shrink-0 flex-col items-end gap-1 xs:flex">
            <Sparkline trend={trend} color={band.color} />
            <span className="text-[8.5px] uppercase tracking-[0.12em] text-white/30">7 días</span>
          </div>
        )}
      </div>
    </button>
  );
}
