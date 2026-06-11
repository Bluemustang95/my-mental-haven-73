interface Point { pre: number | null; post: number | null }

export function SessionSparkline({ data, current }: { data: Point[]; current?: Point }) {
  const all = [...data, ...(current ? [current] : [])].filter((p) => p.pre != null && p.post != null) as { pre: number; post: number }[];
  if (all.length === 0) return null;

  const w = 240;
  const h = 60;
  const step = all.length > 1 ? w / (all.length - 1) : 0;
  const y = (v: number) => h - (v / 10) * h;

  const prePath = all.map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${y(p.pre)}`).join(" ");
  const postPath = all.map((p, i) => `${i === 0 ? "M" : "L"}${i * step},${y(p.post)}`).join(" ");

  return (
    <div className="rounded-2xl bg-white/5 p-4">
      <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-white/50">
        <span>Últimas sesiones</span>
        <span className="flex gap-3">
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-[#FB923C]" /> Pre</span>
          <span className="flex items-center gap-1"><span className="h-1.5 w-3 rounded bg-[#60A5FA]" /> Post</span>
        </span>
      </div>
      <svg viewBox={`0 0 ${w} ${h}`} className="h-14 w-full overflow-visible">
        <path d={prePath} stroke="#FB923C" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        <path d={postPath} stroke="#60A5FA" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
        {all.map((p, i) => (
          <g key={i}>
            <circle cx={i * step} cy={y(p.pre)} r="2.5" fill="#FB923C" />
            <circle cx={i * step} cy={y(p.post)} r="2.5" fill="#60A5FA" />
          </g>
        ))}
      </svg>
    </div>
  );
}
