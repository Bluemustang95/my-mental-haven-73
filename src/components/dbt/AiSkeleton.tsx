export function AiSkeleton() {
  return (
    <div className="flex flex-col gap-3 py-4">
      <div className="flex items-center gap-2 text-xs font-display text-[#101927]/60">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-[#facb60]/30">
          <span className="h-1.5 w-1.5 animate-ping rounded-full bg-[#facb60]" />
        </span>
        Pensando con IA clínica…
      </div>
      <div className="space-y-2.5">
        {[88, 96, 72, 90, 60].map((w, i) => (
          <div
            key={i}
            className="h-3 overflow-hidden rounded-full bg-[#7cc2c8]/15"
            style={{ width: `${w}%` }}
          >
            <div
              className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#7cc2c8]/55 to-transparent"
              style={{
                animation: `dbt-shimmer 1.4s ${i * 0.15}s infinite linear`,
              }}
            />
          </div>
        ))}
      </div>
      <style>{`
        @keyframes dbt-shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
