import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ClipboardList, X } from "lucide-react";
import type { WellbeingSnapshot } from "@/lib/wellbeingScore";
import { WellbeingChart } from "./WellbeingChart";
import { bandFor } from "./WellbeingCardV2";
import { ActivityBreakdown } from "./ActivityBreakdown";
import { CorrelationCards } from "./CorrelationCards";
import { WellbeingHelpPopover } from "./WellbeingHelpPopover";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import type { Range } from "@/lib/activityAggregator";

type Props = { open: boolean; onClose: () => void; snapshot?: WellbeingSnapshot | null };

const COMPONENTS = [
  { key: "mood" as const, label: "Ánimo", weight: 35, color: "#7cc2c8" },
  { key: "sleep" as const, label: "Sueño", weight: 25, color: "#9b72cf" },
  { key: "balance" as const, label: "Balance emocional", weight: 25, color: "#facb60" },
  { key: "dawn" as const, label: "Despertar", weight: 15, color: "#c98a5e" },
];

const SELF_CARE = [
  { key: "habits" as const, label: "Hábitos" },
  { key: "medication" as const, label: "Medicación" },
  { key: "engagement" as const, label: "Uso de recursos" },
  { key: "tests" as const, label: "Evaluaciones" },
];

export function WellbeingAnalysisSheet({ open, onClose, snapshot }: Props) {
  const { user } = useAuth();
  const [mode, setMode] = useState<"week" | "month">("week");
  const [range, setRange] = useState<Range | null>(null);
  const [testHistory, setTestHistory] = useState<{ test_type: string; score: number; severity: string | null; created_at: string }[]>([]);

  const score = snapshot?.score ?? 0;
  const delta = snapshot?.delta ?? 0;
  const band = bandFor(score);

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
                  <p className="font-display text-[10.5px] uppercase tracking-widest text-[#94a3b8]">Índice actual</p>
                  <div className="flex items-baseline gap-1.5">
                    <span className="font-display text-[44px] font-bold leading-none text-[#0f172a]">{score}</span>
                    <span className="text-[11px] text-[#94a3b8]">de 100</span>
                  </div>
                  <span
                    className="mt-1.5 inline-block rounded-full px-2 py-0.5 font-display text-[10.5px] font-semibold"
                    style={{ background: `${band.color}26`, color: band.color }}
                  >
                    {band.label}
                  </span>
                </div>
                {delta !== 0 && (
                  <span
                    className="rounded-full px-3 py-1 font-display text-[11px] font-semibold"
                    style={{
                      background: delta < 0 ? "rgba(239,68,68,0.12)" : "rgba(34,197,94,0.12)",
                      color: delta < 0 ? "#dc2626" : "#16a34a",
                    }}
                  >
                    {delta > 0 ? "+" : ""}{delta}% vs semana previa
                  </span>
                )}
              </div>

              {snapshot?.message && (
                <p className="-mt-2 font-display text-[12.5px] leading-relaxed text-[#64748b]">
                  {snapshot.message}
                </p>
              )}

              {/* Cómo se compone tu índice */}
              <div>
                <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Cómo se compone tu índice
                </p>
                <div className="space-y-2.5 rounded-2xl bg-[#f8fafc] p-4">
                  {COMPONENTS.map((c) => {
                    const value = snapshot?.components?.[c.key] ?? null;
                    const applied = snapshot?.appliedWeights?.[c.key] ?? 0;
                    const renormalized = value !== null && applied !== c.weight;
                    return (
                      <div key={c.key}>
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="font-display text-[12.5px] font-medium text-[#0f172a]">
                            {c.label}{" "}
                            <span className="text-[10.5px] font-normal text-[#94a3b8]">
                              {value === null
                                ? "· sin datos"
                                : renormalized
                                  ? `· ${c.weight}% → ${applied}%`
                                  : `· ${c.weight}%`}
                            </span>
                          </p>
                          <p className="font-display text-[12.5px] font-semibold tabular-nums text-[#0f172a]">
                            {value === null ? "—" : value}
                          </p>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-[#e2e8f0]">
                          <div
                            className="h-full rounded-full transition-[width] duration-700"
                            style={{ width: `${value ?? 0}%`, background: c.color }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="pt-1 text-[10.5px] leading-relaxed text-[#94a3b8]">
                    Ventana de los últimos 7 días · mínimo {snapshot?.minDays ?? 3} días con registro.
                    Si falta un componente, su peso se reparte entre los demás. Fuente: tus check-ins de
                    Sintonía y Balance nocturno.
                  </p>
                </div>
              </div>

              {/* Autocuidado — no afecta el índice */}
              <div>
                <p className="mb-2 font-display text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Autocuidado · no afecta tu índice
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {SELF_CARE.map((c) => {
                    const value = snapshot?.selfCare?.[c.key] ?? null;
                    return (
                      <div key={c.key} className="rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-3">
                        <p className="font-display text-[11px] text-[#64748b]">{c.label}</p>
                        <p className="mt-0.5 font-display text-[18px] font-bold tabular-nums text-[#0f172a]">
                          {value === null ? "—" : value}
                          {value !== null && <span className="text-[11px] font-normal text-[#94a3b8]"> /100</span>}
                        </p>
                      </div>
                    );
                  })}
                </div>
                <p className="mt-2 text-[10.5px] leading-relaxed text-[#94a3b8]">
                  Estos indicadores muestran cuánto te estás cuidando, pero se mantienen fuera del cálculo
                  para que usar la app no infle tu bienestar.
                </p>
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
