import { Fragment, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Sparkles, ArrowRight, Check } from "lucide-react";
import { readDraft, draftHasProgress, todayStatus, todayKey, type BienestarDraft } from "./useBienestarDraft";
import { VALUE_CATEGORIES } from "./data";

const DAYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];
const HOURS = ["08:00", "10:00", "12:00", "14:00", "16:00", "18:00", "20:00", "22:00"];

function valueLabels(d: BienestarDraft): string[] {
  const out: string[] = [];
  for (const cat of VALUE_CATEGORIES) {
    if (cat.items.some((it) => d.selectedValues.includes(it.id))) {
      out.push(`${cat.emoji} ${cat.title.split(" ").slice(0, 3).join(" ")}`);
    }
  }
  return out.slice(0, 4);
}

export function BienestarProcessCard() {
  const navigate = useNavigate();
  const [draft, setDraft] = useState<BienestarDraft | null>(null);
  const [open, setOpen] = useState(true);

  useEffect(() => {
    const d = readDraft();
    if (d && draftHasProgress(d)) setDraft(d);
    else setDraft(null);
  }, []);

  const status = useMemo(() => todayStatus(draft), [draft]);
  const today = todayKey();

  if (!draft) return null;

  const values = valueLabels(draft);
  const stepLabel =
    draft.done ? "Proceso activo" :
    draft.step <= 3 ? `Paso ${draft.step} de 4 · planificación` :
    "Semana en curso";

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[#34D399]" />
          <span className="font-display text-sm font-semibold text-[#101927]">
            Construir Bienestar
          </span>
          <span className="text-[11px] text-[#101927]/55">· {stepLabel}</span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={18} className="text-[#101927]/60" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#101927]/5">
              {values.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {values.map((v) => (
                    <span
                      key={v}
                      className="rounded-full bg-[#7cc2c8]/15 px-2.5 py-1 text-[11px] font-medium text-[#0c5b62]"
                    >
                      {v}
                    </span>
                  ))}
                </div>
              )}

              {draft.todayGoal && (
                <p className="text-[12px] text-[#101927]/75 leading-snug">
                  <span className="font-semibold text-[#101927]">Meta de hoy:</span>{" "}
                  {draft.todayGoal}
                </p>
              )}

              {/* Mini heatmap 7×8 */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#101927]/55">
                    Semana
                  </span>
                  <span className="text-[10px] text-[#101927]/55">
                    Hoy: {status.done}/{status.total || 0}
                  </span>
                </div>
                <div className="grid grid-cols-[auto_repeat(7,1fr)] gap-0.5">
                  <div />
                  {DAYS.map((d) => (
                    <div
                      key={d}
                      className={`text-center text-[9px] ${d === today ? "font-bold text-[#101927]" : "text-[#101927]/45"}`}
                    >
                      {d.slice(0, 1).toUpperCase()}
                    </div>
                  ))}
                  {HOURS.map((h) => (
                    <Fragment key={h}>
                      <div className="text-[9px] text-[#101927]/40 pr-1 text-right">
                        {h.slice(0, 2)}
                      </div>
                      {DAYS.map((d) => {
                        const blk = draft.agenda[d]?.[h];
                        const isToday = d === today;
                        let bg = "bg-[#101927]/5";
                        if (blk?.log) bg = "bg-[#34D399]";
                        else if (blk) bg = "bg-[#facb60]";
                        return (
                          <div
                            key={`${d}-${h}`}
                            className={`h-3.5 rounded-sm ${bg} ${isToday ? "ring-1 ring-[#101927]/40" : ""}`}
                          />
                        );
                      })}
                    </Fragment>
                  ))}
                </div>
                <div className="mt-1.5 flex items-center gap-2 text-[9px] text-[#101927]/55">
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#facb60]" /> agendado
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-[#34D399]" /> registrado
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("/herramientas/construir-bienestar?tab=seguimiento&day=hoy")}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#101927] py-2.5 font-display text-[12px] font-semibold text-white active:scale-[0.97]"
                >
                  Ver hoy <ArrowRight size={14} />
                </button>
                <button
                  onClick={() => navigate("/herramientas/construir-bienestar")}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#7cc2c8] py-2.5 font-display text-[12px] font-semibold text-white active:scale-[0.97]"
                >
                  <Check size={14} /> Continuar
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
