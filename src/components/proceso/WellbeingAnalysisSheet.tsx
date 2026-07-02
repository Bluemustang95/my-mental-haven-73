import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Book, ClipboardList, Moon, Pill, Smile, Target, X } from "lucide-react";
import { Sparkline } from "./Sparkline";
import { PeriodStats } from "./PeriodStats";
import { RecentActivityFeed } from "./RecentActivityFeed";
import type { WellbeingSnapshot } from "@/lib/wellbeingScore";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Props = { open: boolean; onClose: () => void; snapshot?: WellbeingSnapshot | null };

export function WellbeingAnalysisSheet({ open, onClose, snapshot }: Props) {
  const { user } = useAuth();
  const [rangeMode, setRangeMode] = useState<"week" | "month">("week");
  const [mindMinutes, setMindMinutes] = useState<number>(0);
  const [medAdh, setMedAdh] = useState<{ taken: number; total: number } | null>(null);
  const [testHistory, setTestHistory] = useState<{ test_type: string; score: number; severity: string | null; created_at: string }[]>([]);
  const trend = snapshot?.trend?.length ? snapshot.trend : [0,0,0,0,0,0,0];
  const score = snapshot?.score ?? 0;
  const delta = snapshot?.delta ?? 0;
  const prevScore = delta !== 0 && score > 0 ? Math.max(0, Math.round(score / (1 + delta / 100))) : score;
  const message = snapshot?.message ?? "Empezá registrando tu día.";

  const c = snapshot?.components ?? { sleep: null, mood: null, habits: null, tests: null, engagement: null };
  const pill = (v: number | null): "ok" | "warn" | "none" => v === null ? "none" : v >= 65 ? "ok" : "warn";
  const state = (v: number | null, okTxt: string, midTxt: string, noneTxt: string) =>
    v === null ? noneTxt : v >= 65 ? okTxt : midTxt;
  const dotFor = (v: number | null) => v === null ? "#94a3b8" : v >= 65 ? "#7cc2c8" : "#facb60";

  useEffect(() => {
    if (!open || !user) return;
    const days = rangeMode === "week" ? 7 : 30;
    const since = new Date(Date.now() - days * 86400000).toISOString();
    supabase
      .from("exercise_sessions")
      .select("duration_seconds")
      .eq("user_id", user.id)
      .eq("exercise_type", "mindfulness")
      .gte("created_at", since)
      .then(({ data }) => {
        const total = (data ?? []).reduce((s: number, r: any) => s + (r.duration_seconds ?? 0), 0);
        setMindMinutes(Math.round(total / 60));
      });
    supabase
      .from("medication_logs")
      .select("taken")
      .eq("user_id", user.id)
      .gte("created_at", since)
      .then(({ data }) => {
        const rows = (data ?? []) as { taken: boolean | null }[];
        const taken = rows.filter((r) => r.taken === true).length;
        setMedAdh({ taken, total: rows.length });
      });
  }, [open, user, rangeMode]);



  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 z-[90] bg-black/45"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.38, ease: [0.32, 1, 0.28, 1] }}
            className="fixed inset-x-0 bottom-0 z-[91] mx-auto max-h-[92vh] max-w-md overflow-y-auto rounded-t-[28px] bg-white pb-12"
          >
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md pt-3 pb-3">
              <div className="mx-auto h-1 w-9 rounded-full bg-[#e2e8f0]" />
              <div className="mt-3 flex items-center justify-between px-5">
                <h3 className="font-serif text-[18px] font-medium text-[#0f172a]">Tu semana en resumen</h3>
                <button
                  onClick={onClose}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"
                  aria-label="Cerrar"
                >
                  <X size={16} />
                </button>
              </div>
            </div>

            <div className="space-y-6 px-5 pt-4">
              {/* Range toggle */}
              <div className="flex justify-center">
                <div className="flex rounded-full bg-[#f1f5f9] p-0.5">
                  {(["week", "month"] as const).map((r) => (
                    <button
                      key={r}
                      onClick={() => setRangeMode(r)}
                      className={`rounded-full px-4 py-1.5 text-[11px] font-semibold transition ${
                        rangeMode === r ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                      }`}
                    >
                      {r === "week" ? "Semanal" : "Mensual"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Section A - Status banner */}
              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#101927]">
                    <Smile size={22} className="text-[#7cc2c8]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-medium text-[#0f172a]">{rangeMode === "week" ? "Tu semana" : "Tu mes"}</p>
                    <p className="mt-1 text-[13px] leading-snug text-[#64748b]">{message}</p>
                  </div>
                </div>
              </div>

              {/* Section B - Big sparkline */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Cómo estuvo tu {rangeMode === "week" ? "semana" : "mes"}
                </p>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <Sparkline values={trend} width={320} height={90} showLabels />
                  <div className="mt-2 flex justify-between text-[11px] text-[#94a3b8]">
                    {DAYS.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section B2 - Activity + mindfulness */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Actividad de {rangeMode === "week" ? "los últimos 7 días" : "los últimos 30 días"}
                </p>
                <div className="mb-2 rounded-2xl bg-[#f8fafc] p-4 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#7cc2c8]/20 text-[#3d8a90]">
                    <Moon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[#0f172a]">Minutos de práctica</p>
                    <p className="text-[11px] text-[#64748b]">Mindfulness y respiración</p>
                  </div>
                  <p className="font-display text-[22px] font-bold text-[#0f172a] tabular-nums">{mindMinutes}<span className="ml-1 text-[11px] font-medium text-[#64748b]">min</span></p>
                </div>
                {medAdh && medAdh.total > 0 && (
                  <div className="mb-2 rounded-2xl bg-[#f8fafc] p-4 flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#facb60]/25 text-[#b45309]">
                      <Pill size={20} />
                    </div>
                    <div className="flex-1">
                      <p className="text-[13px] font-medium text-[#0f172a]">Adherencia a medicación</p>
                      <p className="text-[11px] text-[#64748b]">{medAdh.taken} de {medAdh.total} tomas</p>
                    </div>
                    <p className="font-display text-[22px] font-bold text-[#0f172a] tabular-nums">
                      {Math.round((medAdh.taken / Math.max(1, medAdh.total)) * 100)}<span className="ml-0.5 text-[11px] font-medium text-[#64748b]">%</span>
                    </p>
                  </div>
                )}
                <PeriodStats range={rangeMode === "week" ? "week" : "month"} hideToggle />
                <div className="mt-2">
                  <RecentActivityFeed limit={6} />
                </div>
              </div>



              {/* Section C - 2x2 pillars */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Qué influyó esta semana
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Pillar icon={<Moon size={20} />} area="Sueño"
                    state={state(c.sleep, "Descansaste bien", "Podés mejorar", "Sin datos aún")}
                    sub={c.sleep === null ? "Registrá tu sueño" : `${Math.round(c.sleep)}/100`} dot={dotFor(c.sleep)} />
                  <Pillar icon={<Target size={20} />} area="Estado de ánimo"
                    state={state(c.mood, "Estable", "Con altibajos", "Sin registros")}
                    sub={c.mood === null ? "Hacé tu check-in" : `${Math.round(c.mood)}/100`} dot={dotFor(c.mood)} />
                  <Pillar icon={<ClipboardList size={20} />} area="Evaluación clínica"
                    state={state(c.tests, "Al día", "Pendiente de actualizar", "Sin tests recientes")}
                    sub={c.tests === null ? "Hacé un test" : `${Math.round(c.tests)}/100`} dot={dotFor(c.tests)} />
                  <Pillar icon={<Book size={20} />} area="Recursos y hábitos"
                    state={state(c.habits ?? c.engagement, "Activo", "Baja actividad", "Sin explorar")}
                    sub={(c.habits ?? c.engagement) === null ? "Explorá recursos" : `${Math.round((c.habits ?? c.engagement)!)}/100`}
                    dot={dotFor(c.habits ?? c.engagement)} />
                </div>
              </div>

              {/* Section D - Comparison */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Esta semana vs la anterior
                </p>
                <div className="flex gap-2">
                  <CompareCard label="Semana pasada" value={String(prevScore)} color="#64748b" />
                  <CompareCard label="Esta semana" value={String(score)} color="#0f172a" />
                  <CompareCard label="Diferencia" value={`${delta > 0 ? "+" : ""}${delta}%`} color={delta < 0 ? "#e24b4a" : "#16a34a"} diffStyle />
                </div>
                <p className="mt-2 text-[12px] leading-snug text-[#64748b]">
                  Las variaciones son parte del proceso. Tu cuerpo y mente se ajustan constantemente.
                </p>
              </div>

              {/* Section E - Origin */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  De dónde viene tu número
                </p>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <OriginRow label="Sueño y descanso" pct={Math.round(c.sleep ?? 0)} color={dotFor(c.sleep)} status={c.sleep === null ? "Sin datos" : c.sleep >= 65 ? "Bien" : "Podés mejorar"} />
                  <OriginRow label="Ánimo y check-ins" pct={Math.round(c.mood ?? 0)} color={dotFor(c.mood)} status={c.mood === null ? "Sin datos" : c.mood >= 65 ? "Estable" : "Con altibajos"} divider />
                  <OriginRow label="Evaluación emocional" pct={Math.round(c.tests ?? 0)} color={dotFor(c.tests)} status={c.tests === null ? "Sin tests" : c.tests >= 65 ? "Al día" : "Necesita update"} divider />
                  <OriginRow label="Hábitos y engagement" pct={Math.round((c.habits ?? c.engagement) ?? 0)} color={dotFor(c.habits ?? c.engagement)} status={(c.habits ?? c.engagement) === null ? "Sin datos" : "Activo"} divider />
                </div>
                <p className="mt-2 text-[12px] leading-snug text-[#64748b]">
                  Cuando alguna área no tiene datos, el sistema usa las que sí tenés, para no penalizarte.
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function Pillar({ icon, area, state, sub, dot }: { icon: React.ReactNode; area: string; state: string; sub: string; dot: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] p-3.5">
      <div className="text-[#94a3b8]">{icon}</div>
      <p className="mt-2 text-[12px] text-[#94a3b8]">{area}</p>
      <div className="mt-0.5 flex items-start gap-1.5">
        <span className="mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: dot }} />
        <p className="text-[14px] font-medium leading-tight text-[#0f172a]">{state}</p>
      </div>
      <p className="mt-1 text-[11px] text-[#94a3b8]">{sub}</p>
    </div>
  );
}

function CompareCard({ label, value, color, diffStyle }: { label: string; value: string; color: string; diffStyle?: boolean }) {
  return (
    <div
      className="flex-1 rounded-2xl p-3 text-center"
      style={{
        background: diffStyle ? "rgba(239,68,68,0.06)" : "#f8fafc",
        border: diffStyle ? "1px solid rgba(239,68,68,0.15)" : "1px solid transparent",
      }}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#94a3b8]">{label}</p>
      <p className="mt-1.5 text-[22px] font-bold leading-none" style={{ color }}>{value}</p>
    </div>
  );
}

function OriginRow({ label, pct, color, status, divider }: { label: string; pct: number; color: string; status: string; divider?: boolean }) {
  return (
    <div className={`flex items-center gap-3 py-2.5 ${divider ? "border-t border-[#e2e8f0]/70" : ""}`}>
      <p className="w-[110px] text-[12px] text-[#0f172a]">{label}</p>
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e2e8f0]/60">
        <div className="h-full rounded-full transition-all" style={{ width: `${Math.max(2, pct)}%`, background: color }} />
      </div>
      <p className="w-[90px] text-right text-[11px] text-[#64748b]">{status}</p>
    </div>
  );
}
