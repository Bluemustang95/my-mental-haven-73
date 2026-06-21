import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { type Habit, type Completion, VALUE_OPTIONS, computeBestStreak } from "@/hooks/useHabits";

interface Props {
  open: boolean;
  onClose: () => void;
  habits: Habit[];
  completions: Completion[];
}

export function WrappedDialog({ open, onClose, habits, completions }: Props) {
  const year = new Date().getFullYear();
  const stats = useMemo(() => {
    const yearCompletions = completions.filter(c => new Date(c.completed_date).getFullYear() === year);
    const total = yearCompletions.length;

    // best streak overall
    const best = Math.max(0, ...habits.map(h => computeBestStreak(completions, h.id)));

    // value distribution
    const byValue: Record<string, number> = {};
    yearCompletions.forEach(c => {
      const h = habits.find(x => x.id === c.habit_id);
      if (!h) return;
      byValue[h.value_key] = (byValue[h.value_key] ?? 0) + 1;
    });
    const valueEntries = Object.entries(byValue).sort((a, b) => b[1] - a[1]);
    const topValueKey = valueEntries[0]?.[0];
    const topValue = VALUE_OPTIONS.find(v => v.key === topValueKey);

    // monthly
    const monthly = Array.from({ length: 12 }, () => 0);
    yearCompletions.forEach(c => {
      monthly[new Date(c.completed_date + "T00:00:00").getMonth()]++;
    });

    return { total, best, valueEntries, topValue, monthly };
  }, [habits, completions, year]);

  const share = async () => {
    const txt = `RESMA Wrapped ${year}\n• ${stats.total} completados\n• Mejor racha: ${stats.best} días\n• Valor prioritario: ${stats.topValue?.label ?? "—"}`;
    try {
      if (navigator.share) await navigator.share({ text: txt, title: "RESMA Wrapped" });
      else { await navigator.clipboard.writeText(txt); toast.success("Copiado al portapapeles ✓"); }
    } catch {/* canceled */}
  };

  const months = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
  const maxMonth = Math.max(1, ...stats.monthly);
  const totalForPct = stats.valueEntries.reduce((a, [, v]) => a + v, 0) || 1;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-[110] bg-[#101927]/45 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-[120] flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }}
          >
            <div className="w-full max-w-[420px] max-h-[88vh] overflow-y-auto rounded-[28px] border border-white/60 bg-white p-6 shadow-[0_20px_60px_-15px_rgba(16,25,39,0.25)]">
              <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#facb60]">RESMA Wrapped</p>
              <h2 className="mt-2 text-center font-serif text-[26px] font-bold text-[#101927]">Tu {year} en Revisión</h2>
              <p className="mx-auto mt-1 max-w-[300px] text-center text-sm text-[#101927]/60">
                Felicitaciones por haber cuidado activamente de tu mente este año.
              </p>

              {/* Navy summary */}
              <div className="mt-5 rounded-2xl bg-[#101927] p-5 ring-1 ring-[#facb60]/40">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#7cc2c8]">Ficha anual consolidada</span>
                  <span className="text-xs font-bold text-[#facb60]">Wrapped 📊</span>
                </div>
                <div className="my-3 h-px bg-white/12" />
                <Row label="Total completados:" value={`${stats.total} veces`} color="#fff" />
                <Row label="Racha más larga:" value={`${stats.best} días 🔥`} color="#facb60" />
                <Row label="Valor prioritario:" value={stats.topValue ? `${stats.topValue.label} ${stats.topValue.emoji}` : "—"} color="#7cc2c8" />
                <div className="my-3 h-px bg-white/12" />
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
                  <span>RESMA App</span><span>{year} In Review</span>
                </div>
              </div>

              {/* Value distribution */}
              <div className="mt-5 rounded-2xl border border-[#101927]/8 bg-[#fafbfc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/55">Distribución por valores</p>
                <div className="mt-3 space-y-2">
                  {stats.valueEntries.length === 0 && <p className="text-xs text-[#101927]/50">Aún no hay datos.</p>}
                  {stats.valueEntries.map(([key, count]) => {
                    const v = VALUE_OPTIONS.find(o => o.key === key);
                    const pct = Math.round((count / totalForPct) * 100);
                    return (
                      <div key={key}>
                        <div className="flex justify-between text-[11px] font-semibold text-[#101927]/70">
                          <span>{v?.emoji} {v?.label ?? key}</span><span>{pct}%</span>
                        </div>
                        <div className="mt-1 h-2 rounded-full bg-[#eef1f5]">
                          <div className="h-full rounded-full bg-[#7cc2c8]" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Monthly */}
              <div className="mt-4 rounded-2xl border border-[#101927]/8 bg-[#fafbfc] p-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/55">Curva mensual</p>
                <div className="mt-3 flex items-end gap-1">
                  {stats.monthly.map((v, i) => (
                    <div key={i} className="flex flex-1 flex-col items-center gap-1">
                      <div className="flex h-20 w-full items-end">
                        <div className="w-full rounded-t bg-[#facb60]" style={{ height: `${(v / maxMonth) * 100}%`, minHeight: v > 0 ? 3 : 0 }} />
                      </div>
                      <span className="text-[8px] font-semibold text-[#101927]/45">{months[i]}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button onClick={share} className="mt-5 w-full rounded-full bg-[#7cc2c8] py-3.5 text-sm font-bold tracking-wider text-[#101927]">
                COMPARTIR FICHA WRAPPED
              </button>
              <button onClick={onClose} className="mt-2 w-full rounded-full bg-[#101927]/6 py-3.5 text-sm font-bold text-[#101927]">
                Cerrar Resumen
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-white/75">{label}</span>
      <span className="font-bold" style={{ color }}>{value}</span>
    </div>
  );
}
