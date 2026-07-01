import { useRef, useState, ReactNode } from "react";
import { Loader2 } from "lucide-react";

/**
 * Pull-to-refresh mobile gesture: sólo activa cuando la página ya está en el tope
 * y el usuario tira hacia abajo con el dedo. Al soltar, dispara onRefresh.
 */
export function PullToRefresh({ onRefresh, children }: { onRefresh: () => Promise<void> | void; children: ReactNode }) {
  const startY = useRef<number | null>(null);
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const THRESHOLD = 70;

  const handleStart = (e: React.TouchEvent) => {
    if (window.scrollY > 0 || refreshing) return;
    startY.current = e.touches[0].clientY;
  };
  const handleMove = (e: React.TouchEvent) => {
    if (startY.current === null) return;
    const dy = e.touches[0].clientY - startY.current;
    if (dy > 0) setPull(Math.min(dy * 0.5, 100));
  };
  const handleEnd = async () => {
    if (startY.current === null) return;
    startY.current = null;
    if (pull >= THRESHOLD) {
      setRefreshing(true);
      setPull(50);
      try { await onRefresh(); } finally {
        setRefreshing(false);
        setPull(0);
      }
    } else {
      setPull(0);
    }
  };

  return (
    <div onTouchStart={handleStart} onTouchMove={handleMove} onTouchEnd={handleEnd}>
      <div
        className="pointer-events-none absolute left-0 right-0 top-0 z-20 flex items-center justify-center transition-all"
        style={{ height: pull, opacity: pull / THRESHOLD }}
      >
        <Loader2 size={20} className={`text-resma-navy/60 ${refreshing ? "animate-spin" : ""}`} />
      </div>
      <div style={{ transform: `translateY(${pull}px)`, transition: pull === 0 ? "transform 0.25s ease" : "none" }}>
        {children}
      </div>
    </div>
  );
}
