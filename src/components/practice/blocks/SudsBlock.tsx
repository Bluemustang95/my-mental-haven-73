export function SudsBlock({
  label,
  minLabel = "Nada",
  maxLabel = "Máximo",
  value,
  onChange,
}: {
  label: string;
  minLabel?: string;
  maxLabel?: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <p className="mb-3 text-sm font-medium text-white">{label}</p>
      <input
        type="range"
        min={0}
        max={100}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-emerald-500"
      />
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-white/50">
        <span>{minLabel} · 0</span>
        <span className="font-display text-base font-bold text-emerald-300">{value ?? 0}</span>
        <span>100 · {maxLabel}</span>
      </div>
    </div>
  );
}
