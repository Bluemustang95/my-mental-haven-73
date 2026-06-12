export function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <span
          key={i}
          className={`h-1.5 rounded-full transition-all ${
            i === current ? "w-7 bg-[#facb60]" : "w-1.5 bg-[#101927]/15"
          }`}
        />
      ))}
    </div>
  );
}
