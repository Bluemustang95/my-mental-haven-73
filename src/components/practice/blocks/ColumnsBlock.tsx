export function ColumnsBlock({
  columns,
  value,
  onChange,
}: {
  columns: { title: string }[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  const v = value ?? columns.map(() => "");
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {columns.map((c, idx) => (
        <div key={idx} className="rounded-2xl border border-[#101927]/10 bg-white/70 p-4 backdrop-blur">
          <p className="mb-2 font-display text-xs font-semibold uppercase tracking-widest text-[#0f766e]">
            {c.title}
          </p>
          <textarea
            value={v[idx] ?? ""}
            onChange={(e) => {
              const next = [...v];
              next[idx] = e.target.value;
              onChange(next);
            }}
            rows={5}
            className="w-full resize-none rounded-xl border border-[#101927]/10 bg-white p-2.5 text-sm text-[#101927] placeholder:text-[#101927]/40 focus:border-[#7cc2c8] focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}
