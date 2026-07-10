import { useState, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WidgetGlyph, WIDGET_IDENTITY } from "@/components/home/WidgetVisual";
import type { WidgetId } from "@/components/home/WidgetsBoard";

/**
 * Uniform interactive tile: gradient bg per widget identity, swipeable items,
 * dots indicator, optional header action button. Tap on the tile background
 * (not on the primary action) navigates via onNavigate.
 */
export function InteractiveTile<T>({
  id,
  size = "half",
  items,
  renderItem,
  emptyState,
  onNavigate,
  headerAction,
}: {
  id: WidgetId;
  size?: "full" | "half";
  items: T[];
  renderItem: (item: T, index: number) => ReactNode;
  emptyState?: ReactNode;
  onNavigate?: () => void;
  headerAction?: ReactNode;
}) {
  const ident = WIDGET_IDENTITY[id];
  const isDark = ident.ink === "#ffffff";
  const [idx, setIdx] = useState(0);
  const count = items.length;
  const safe = count > 0 ? Math.min(idx, count - 1) : 0;

  const bg = isDark
    ? `linear-gradient(160deg, ${ident.from} 0%, ${ident.to} 90%)`
    : `linear-gradient(160deg, ${ident.from}f2 0%, ${ident.to}e6 100%)`;

  const height = size === "full" ? "h-[130px]" : "h-[130px]";

  const goNext = () => setIdx((i) => (i + 1) % Math.max(count, 1));
  const goPrev = () => setIdx((i) => (i - 1 + Math.max(count, 1)) % Math.max(count, 1));

  return (
    <div
      className={`relative ${height} w-full overflow-hidden rounded-[22px]`}
      style={{ background: bg, color: ident.ink }}
    >
      {/* Corner glyph */}
      <div
        className="pointer-events-none absolute -right-4 -top-5 opacity-20"
        style={{ color: ident.ink }}
        aria-hidden
      >
        <WidgetGlyph glyph={ident.glyph} color={ident.ink} size={78} />
      </div>

      {/* Header */}
      <div className="relative flex items-center justify-between px-3 pt-2.5">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onNavigate?.(); }}
          className="flex min-w-0 items-center gap-1.5 text-left"
        >
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/25 backdrop-blur-sm"
            style={{ color: ident.ink }}
          >
            <WidgetGlyph glyph={ident.glyph} color={ident.ink} size={12} />
          </div>
          <p
            className="truncate font-display text-[11px] font-bold uppercase tracking-[0.06em]"
            style={{ color: ident.ink, opacity: 0.92 }}
          >
            {ident.label}
          </p>
        </button>
        {headerAction}
      </div>

      {/* Body — swipeable */}
      <div className="relative flex-1 px-3 pb-3 pt-1.5" style={{ height: "calc(100% - 42px)" }}>
        {count === 0 ? (
          <div className="flex h-full items-center justify-center">
            {emptyState ?? (
              <p className="text-[12px] font-semibold" style={{ color: ident.ink, opacity: 0.8 }}>
                Sin novedades
              </p>
            )}
          </div>
        ) : (
          <motion.div
            className="relative h-full w-full touch-pan-y"
            drag={count > 1 ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.35}
            onDragEnd={(_, info) => {
              if (info.offset.x < -40) goNext();
              else if (info.offset.x > 40) goPrev();
            }}
          >
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={safe}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.18 }}
                className="h-full"
              >
                {renderItem(items[safe], safe)}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Dots */}
      {count > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-1.5 flex justify-center gap-1">
          {items.map((_, i) => (
            <span
              key={i}
              className="h-1 rounded-full transition-all"
              style={{
                width: i === safe ? 10 : 4,
                background: ident.ink,
                opacity: i === safe ? 0.85 : 0.35,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
