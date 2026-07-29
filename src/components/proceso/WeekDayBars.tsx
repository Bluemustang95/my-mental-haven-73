/**
 * Barra semanal estilo Samsung Health: una pista vertical por día,
 * con un punto a la altura del valor. Los días sin registro quedan vacíos.
 */
type Props = {
  /** 7 valores 0-100, del más antiguo (izq) al de hoy (der). 0 = sin registro. */
  trend: number[];
  color: string;
};

function colorFor(v: number, fallback: string) {
  if (v >= 70) return "#4ade80";
  if (v >= 45) return "#facb60";
  if (v > 0) return "#f87171";
  return fallback;
}

export function WeekDayBars({ trend, color }: Props) {
  const today = new Date();
  const days = trend.map((v, i) => {
    const d = new Date(today.getTime() - (trend.length - 1 - i) * 86400000);
    return { v, day: d.getDate(), isToday: i === trend.length - 1 };
  });

  return (
    <div className="flex items-end justify-between gap-1.5">
      {days.map((d, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="relative h-[52px] w-[7px] overflow-hidden rounded-full bg-white/10">
            {d.v > 0 && (
              <span
                className="absolute left-1/2 h-[7px] w-[7px] -translate-x-1/2 rounded-full"
                style={{
                  background: colorFor(d.v, color),
                  bottom: `${Math.max(0, Math.min(100, d.v)) * 0.45}px`,
                  transition: "bottom 600ms cubic-bezier(0.32,1,0.28,1)",
                }}
              />
            )}
          </div>
          <span
            className="font-display text-[9.5px] tabular-nums"
            style={{ color: d.isToday ? "#7cc2c8" : "rgba(255,255,255,0.38)" }}
          >
            {d.day}
          </span>
        </div>
      ))}
    </div>
  );
}
