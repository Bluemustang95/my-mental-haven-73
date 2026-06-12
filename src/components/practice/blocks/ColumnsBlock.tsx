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
        <div key={idx} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <p className="mb-2 font-display text-xs font-semibold uppercase tracking-widest text-emerald-300">
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
            className="w-full resize-none rounded-xl border border-white/10 bg-black/30 p-2.5 text-sm text-white placeholder:text-white/40 focus:border-emerald-400/50 focus:outline-none"
          />
        </div>
      ))}
    </div>
  );
}
