import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, X } from "lucide-react";
import type { WellbeingSnapshot } from "@/lib/wellbeingScore";
import { WellbeingChart } from "./WellbeingChart";
import { ActivityBreakdown } from "./ActivityBreakdown";
import { CorrelationCards } from "./CorrelationCards";
import { WellbeingHelpPopover } from "./WellbeingHelpPopover";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Range } from "@/lib/activityAggregator";

type Props = { open: boolean; onClose: () => void; snapshot?: WellbeingSnapshot | null };

export function WellbeingAnalysisSheet({ open, onClose, snapshot }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"week" | "month">("week");
  const [range, setRange] = useState<Range | null>(null);
  const [testHistory, setTestHistory] = useState<{ test_type: string; score: number; severity: string | null; created_at: string }[]>([]);

  const score = snapshot?.score ?? 0;
  const delta = snapshot?.delta ?? 0;

  useEffect(() => {
    if (!open || !user || !range) return;
    supabase
      .from("test_results")
      .select("test_type, score, severity, created_at")
      .eq("user_id", user.id)
      .gte("created_at", range.from.toISOString())
      .lte("created_at", range.to.toISOString())
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data }) => setTestHistory((data as any) ?? []));
  }, [open, user, range]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/45"
          />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ duration: 0.38, ease: [0.32, 1, 0.28, 1] }}
            className="fixed inset-x-0 bottom-0 z-[91] mx-auto max-h-[92vh] max-w-md overflow-y-auto rounded-t-[28px] bg-white pb-12"
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md pt-3 pb-3">
              <div className="mx-auto h-1 w-9 rounded-full bg-[#e2e8f0]" />
              <div className="mt-3 flex items-center justify-between px-5">
                <div className="flex items-center gap-2">
                  <h3 className="font-serif text-[18px] font-medium text-[#0f172a]">Tu evolución</h3>
                  <WellbeingHelpPopover />
                </div>
                <button onClick={onClose} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]" aria-label="Cerrar">
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-6 px-5 pt-2">
              {/* Header con score + delta */}
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-[10.5px] uppercase tracking-widest text-[#94a3b8]">Índice actual</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-serif text-[44px] font-bold leading-none text-[#0f172a]">{score}</span>
                    <span className="text-[11px] text-[#94a3b8]">de 100</span>
                  </div>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11px] font-semibold"
                  style={{
                    background: delta < 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                    color: delta < 0 ? "#dc2626" : "#16a34a",
                  }}
                >
                  {delta > 0 ? "+" : ""}{delta}% vs semana previa
                </span>
              </div>

              {/* Gráfico + rango */}
              <WellbeingChart mode={mode} onModeChange={setMode} onRangeChange={setRange} />

              {/* Actividad del período */}
              <ActivityBreakdown range={range} mode={mode} />

              {/* Historial de evaluaciones */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Evaluaciones del período
                </p>
                {testHistory.length === 0 ? (
                  <div className="rounded-2xl bg-[#f8fafc] p-4 text-center text-[12px] text-[#94a3b8]">
                    Sin evaluaciones en este período.
                  </div>
                ) : (
                  <div className="divide-y divide-[#e2e8f0]/70 rounded-2xl bg-[#f8fafc]">
                    {testHistory.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 px-4 py-2.5">
                        <ClipboardList size={16} className="shrink-0 text-[#94a3b8]" />
                        <div className="flex-1 min-w-0">
                          <p className="text-[13px] font-medium text-[#0f172a] truncate">
                            {t.test_type} · <span className="font-bold text-[#3d8a90]">{t.score}</span> pts
                          </p>
                          <p className="text-[11px] text-[#64748b] truncate">
                            {t.severity ?? ""}
                          </p>
                        </div>
                        <p className="text-[11px] text-[#94a3b8] tabular-nums">
                          {new Date(t.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Correlaciones */}
              <CorrelationCards range={range} />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
