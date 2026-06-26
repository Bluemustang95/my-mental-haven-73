export function RadialWeekProgress({ value, max = 7, label = "días registrados" }: { value: number; max?: number; label?: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = Math.min(1, value / max);
  return (
    <div className="relative mx-auto flex h-40 w-40 items-center justify-center">
      <svg viewBox="0 0 140 140" className="absolute inset-0 -rotate-90">
        <circle cx="70" cy="70" r={r} stroke="rgba(16,25,39,0.08)" strokeWidth="10" fill="none" />
        <circle
          cx="70"
          cy="70"
          r={r}
          stroke="#7cc2c8"
          strokeWidth="10"
          fill="none"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          style={{ transition: "stroke-dashoffset 600ms cubic-bezier(.34,1.56,.64,1)" }}
        />
      </svg>
      <div className="flex flex-col items-center">
        <p className="font-serifElegant text-3xl font-bold text-resma-navy">{value}<span className="text-base text-muted-foreground"> / {max}</span></p>
        <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/80">{label}</p>
      </div>
    </div>
  );
}
