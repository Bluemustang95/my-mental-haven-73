/**
 * Skeleton placeholder para el Dashboard mientras se cargan los check-ins del día.
 * Mantiene la misma silueta visual (header + strip semanal + 2 bloques del camino)
 * para evitar layout shift al hidratar.
 */
export function HomeSkeleton() {
  return (
    <div className="relative mx-auto max-w-md animate-pulse px-5 pt-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="h-2.5 w-24 rounded-full bg-resma-navy/10" />
          <div className="mt-2 h-6 w-40 rounded-full bg-resma-navy/10" />
        </div>
        <div className="h-10 w-10 rounded-full bg-resma-navy/10" />
      </div>
      {/* Week strip */}
      <div className="mt-4 flex items-center gap-2">
        <div className="flex flex-1 gap-1.5">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-[60px] flex-1 rounded-[22px] bg-resma-navy/10" />
          ))}
        </div>
        <div className="h-[60px] w-12 rounded-[22px] bg-resma-navy/10" />
      </div>
      {/* Path bullets */}
      <div className="mt-8 space-y-4">
        <div className="h-24 rounded-[22px] bg-resma-navy/10" />
        <div className="h-24 rounded-[22px] bg-resma-navy/10" />
        <div className="h-24 rounded-[22px] bg-resma-navy/10" />
      </div>
    </div>
  );
}
