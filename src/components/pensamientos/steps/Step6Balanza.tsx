import { useState } from "react";
import { Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };
type Side = "for" | "against";

export default function Step6Balanza({ draft, patch }: Props) {
  const [open, setOpen] = useState<Side | null>(null);
  const [value, setValue] = useState("");

  const total = draft.evidenceFor.length + draft.evidenceAgainst.length;
  const pctFor = total === 0 ? 0 : Math.round((draft.evidenceFor.length / total) * 100);
  const pctAgainst = total === 0 ? 0 : 100 - pctFor;

  const add = (side: Side) => {
    const v = value.trim();
    if (!v) return;
    if (side === "for") {
      patch({
        evidenceFor: [...draft.evidenceFor, v],
        evidenceSources: { ...draft.evidenceSources, for: [...draft.evidenceSources.for, "user"] },
      });
    } else {
      patch({
        evidenceAgainst: [...draft.evidenceAgainst, v],
        evidenceSources: { ...draft.evidenceSources, against: [...draft.evidenceSources.against, "user"] },
      });
    }
    setValue("");
    setOpen(null);
  };

  const remove = (side: Side, i: number) => {
    if (side === "for") {
      patch({
        evidenceFor: draft.evidenceFor.filter((_, idx) => idx !== i),
        evidenceSources: { ...draft.evidenceSources, for: draft.evidenceSources.for.filter((_, idx) => idx !== i) },
      });
    } else {
      patch({
        evidenceAgainst: draft.evidenceAgainst.filter((_, idx) => idx !== i),
        evidenceSources: { ...draft.evidenceSources, against: draft.evidenceSources.against.filter((_, idx) => idx !== i) },
      });
    }
  };

  const Panel = ({ side, title, count, pct, color }: { side: Side; title: string; count: number; pct: number; color: string }) => {
    const items = side === "for" ? draft.evidenceFor : draft.evidenceAgainst;
    return (
      <div className="rounded-3xl border border-white/60 bg-white/85 p-4 shadow-glass backdrop-blur-xl">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-display text-[13.5px] font-bold text-[#101927]">{title}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest" style={{ color }}>
              {count} ítem{count !== 1 ? "s" : ""} · {pct}%
            </p>
          </div>
          <button
            onClick={() => setOpen(open === side ? null : side)}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm active:scale-95"
            style={{ color }}
            aria-label="Agregar"
          >
            <Plus size={16} />
          </button>
        </div>

        <AnimatePresence>
          {open === side && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-2.5 flex gap-1.5"
            >
              <input
                autoFocus
                value={value}
                onChange={(e) => setValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && add(side)}
                placeholder={side === "for" ? "Hecho que lo sostiene…" : "Hecho que lo refuta…"}
                className="flex-1 rounded-xl border border-white/80 bg-white px-3 py-2 text-[12.5px] text-[#101927] placeholder:text-[#101927]/40 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />
              <button
                onClick={() => add(side)}
                className="rounded-xl px-3 font-display text-[12px] font-semibold text-white"
                style={{ background: color }}
              >
                Agregar
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {items.length === 0 ? (
          <p className="mt-2.5 text-[11.5px] italic text-[#101927]/45">
            {side === "for" ? "Sin evidencias a favor cargadas todavía." : "Sin evidencias en contra todavía."}
          </p>
        ) : (
          <ul className="mt-2.5 space-y-1.5">
            {items.map((it, i) => (
              <li
                key={i}
                className="flex items-start justify-between gap-2 rounded-xl border border-white/80 bg-white/90 px-2.5 py-1.5"
              >
                <span className="text-[12px] leading-snug text-[#101927]">{it}</span>
                <button onClick={() => remove(side, i)} className="shrink-0 opacity-50 hover:opacity-90">
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Balanza de Evidencias
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          Sumá argumentos fácticos a favor o en contra de tu pensamiento.
        </p>
      </div>

      {/* Contadores grandes */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="rounded-2xl bg-white/85 p-3.5 text-center shadow-glass backdrop-blur-xl">
          <p className="font-display text-[22px] font-bold text-[#7cc2c8]">
            {draft.evidenceFor.length} <span className="text-[14px]">({pctFor}%)</span>
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">A favor</p>
        </div>
        <div className="rounded-2xl bg-white/85 p-3.5 text-center shadow-glass backdrop-blur-xl">
          <p className="font-display text-[22px] font-bold text-[#34D399]">
            {draft.evidenceAgainst.length} <span className="text-[14px]">({pctAgainst}%)</span>
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">En contra</p>
        </div>
      </div>

      <Panel side="for" title="Argumento a favor" count={draft.evidenceFor.length} pct={pctFor} color="#7cc2c8" />
      <Panel side="against" title="Argumento en contra" count={draft.evidenceAgainst.length} pct={pctAgainst} color="#34D399" />
    </div>
  );
}
