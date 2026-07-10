import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";

export type PriorityCard = {
  id: string;
  chip: string;               // e.g. "PRIORIDAD MAÑANA"
  chipTone: "gold" | "teal" | "navy";
  title: string;              // serif large
  description?: string;       // one line
  actionLabel: string;        // e.g. "CULTIVAR MI DÍA"
  actionTone: "gold" | "teal" | "navy";
  onAction: () => void;
  done?: boolean;
  doneSummary?: string;
};

const chipTones = {
  gold: "bg-white text-amber-600 border border-amber-100",
  teal: "bg-white text-resma-teal border border-resma-teal/20",
  navy: "bg-white text-resma-navy border border-resma-navy/15",
};
const actionTones = {
  gold: "text-amber-600",
  teal: "text-resma-teal",
  navy: "text-resma-navy",
};

export function PriorityStack({ cards }: { cards: PriorityCard[] }) {
  const [manualIdx, setManualIdx] = useState(0);

  // Auto-order: undone first (in given order), then done at the bottom.
  const ordered = useMemo(() => {
    const undone = cards.filter((c) => !c.done);
    const done = cards.filter((c) => c.done);
    return [...undone, ...done];
  }, [cards]);

  if (ordered.length === 0) return null;

  const rotated = useMemo(() => {
    const arr = [...ordered];
    const idx = manualIdx % arr.length;
    return [...arr.slice(idx), ...arr.slice(0, idx)];
  }, [ordered, manualIdx]);

  const top = rotated[0];
  const peeks = rotated.slice(1, 3); // show up to 2 behind

  return (
    <section className="mt-4">
      <div className="mb-3 flex items-center justify-between px-1">
        <p className="font-sans text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Enfoque prioritario
        </p>
        {rotated.length > 1 && (
          <button
            onClick={() => setManualIdx((i) => i + 1)}
            className="rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-semibold text-resma-navy shadow-[0_2px_10px_-4px_rgba(16,25,39,0.15)] ring-1 ring-black/5 transition active:scale-95"
          >
            Siguiente prioridad →
          </button>
        )}
      </div>

      <div className="relative">
        {/* Peek layers behind */}
        {peeks.map((_, i) => {
          const depth = i + 1; // 1, 2
          return (
            <div
              key={`peek-${depth}`}
              aria-hidden
              className="absolute inset-x-0 rounded-[26px] bg-white shadow-[0_6px_20px_-12px_rgba(16,25,39,0.15)] ring-1 ring-black/5"
              style={{
                top: depth * 10,
                left: depth * 8,
                right: depth * 8,
                height: "100%",
                transform: `scale(${1 - depth * 0.02})`,
                transformOrigin: "top center",
                zIndex: 10 - depth,
                opacity: 1 - depth * 0.15,
              }}
            />
          );
        })}

        <AnimatePresence mode="popLayout" initial={false}>
          <motion.div
            key={top.id}
            layout
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -32, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 260, damping: 26 }}
            className="relative z-20 rounded-[26px] bg-white p-5 shadow-[0_14px_40px_-18px_rgba(16,25,39,0.25)] ring-1 ring-black/5"
            style={{
              paddingBottom: peeks.length > 0 ? 24 : 20,
            }}
          >
            <span
              className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${chipTones[top.chipTone]}`}
            >
              {top.chip}
            </span>

            <h3 className="mt-3 font-serifElegant text-[22px] font-medium leading-tight text-resma-navy">
              {top.title}
            </h3>

            {top.description && !top.done && (
              <p className="mt-1.5 text-[13.5px] leading-snug text-muted-foreground">
                {top.description}
              </p>
            )}

            {top.done && top.doneSummary && (
              <p className="mt-1.5 flex items-center gap-1.5 text-[12.5px] text-resma-teal">
                <Check size={13} strokeWidth={3} /> {top.doneSummary}
              </p>
            )}

            <div className="mt-5 flex items-end justify-between gap-3">
              <span className="text-[11.5px] font-medium text-muted-foreground/80">
                {top.done ? "Completado" : "Paso obligatorio"}
              </span>
              <button
                onClick={top.onAction}
                className={`group inline-flex items-center gap-1.5 text-[12.5px] font-bold uppercase tracking-[0.08em] ${actionTones[top.actionTone]} transition active:scale-95`}
              >
                {top.actionLabel}
                <ArrowRight size={14} className="transition group-hover:translate-x-0.5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
