export type HabitView = "grid" | "last5" | "cards";

const OPTIONS: { key: HabitView; label: string }[] = [
  { key: "grid", label: "Grid" },
  { key: "last5", label: "Últimos 5 días" },
  { key: "cards", label: "Cards" },
];

export function ViewSegmentedControl({
  value, onChange,
}: { value: HabitView; onChange: (v: HabitView) => void }) {
  return (
    <div className="grid grid-cols-3 rounded-full bg-white/70 p-1.5 shadow-[0_4px_14px_-6px_rgba(16,25,39,0.08)] backdrop-blur-[18px]">
      {OPTIONS.map(o => (
        <button
          key={o.key}
          onClick={() => onChange(o.key)}
          className={`rounded-full py-2 text-[12.5px] font-bold transition ${
            value === o.key
              ? "bg-[#101927] text-white shadow-[0_6px_16px_-6px_rgba(16,25,39,0.35)]"
              : "text-[#101927]/55"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
