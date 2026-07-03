import { Check } from "lucide-react";

export function ChecklistBlock({
  items,
  value,
  onChange,
}: {
  items: string[];
  value: boolean[];
  onChange: (v: boolean[]) => void;
}) {
  const v = value ?? items.map(() => false);
  return (
    <div className="rounded-2xl border border-[#101927]/10 bg-white/70 p-4 space-y-2 backdrop-blur">
      {items.map((it, idx) => {
        const checked = !!v[idx];
        return (
          <button
            key={idx}
            type="button"
            onClick={() => {
              const next = [...v];
              next[idx] = !checked;
              onChange(next);
            }}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition ${
              checked
                ? "border-[#7cc2c8]/50 bg-[#7cc2c8]/15 text-[#101927]"
                : "border-[#101927]/10 bg-white text-[#101927]/80"
            }`}
          >
            <span
              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                checked ? "border-[#7cc2c8] bg-[#7cc2c8] text-[#0f172a]" : "border-[#101927]/30"
              }`}
            >
              {checked && <Check size={12} strokeWidth={3} />}
            </span>
            <span className={checked ? "line-through opacity-70" : ""}>{it}</span>
          </button>
        );
      })}
    </div>
  );
}
