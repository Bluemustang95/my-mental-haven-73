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
    <div className="rounded-2xl border border-[#101927]/10 bg-white/70 p-4 backdrop-blur">
      <p className="mb-3 text-sm font-medium text-[#101927]">{label}</p>
      <input
        type="range"
        min={0}
        max={100}
        value={value ?? 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#7cc2c8]"
      />
      <div className="mt-1 flex justify-between text-[10px] uppercase tracking-wider text-[#101927]/60">
        <span>{minLabel} · 0</span>
        <span className="font-display text-base font-bold text-[#0f766e]">{value ?? 0}</span>
        <span>100 · {maxLabel}</span>
      </div>
    </div>
  );
}
