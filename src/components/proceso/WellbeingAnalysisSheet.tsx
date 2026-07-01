import { AnimatePresence, motion } from "framer-motion";
import { Book, ClipboardList, Moon, Smile, Target, X } from "lucide-react";
import { Sparkline } from "./Sparkline";
import type { WellbeingSnapshot } from "@/lib/wellbeingScore";

const DAYS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

type Props = { open: boolean; onClose: () => void; snapshot?: WellbeingSnapshot | null };

export function WellbeingAnalysisSheet({ open, onClose, snapshot }: Props) {
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
              {/* Section A - Status banner */}
              <div className="rounded-2xl bg-[#f8fafc] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#101927]">
                    <Smile size={22} className="text-[#7cc2c8]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[16px] font-medium text-[#0f172a]">Semana con altibajos</p>
                    <p className="mt-1 text-[13px] leading-snug text-[#64748b]">
                      Tu sueño y metas estuvieron bien, pero tuviste días difíciles. Es normal que el proceso no sea lineal.
                    </p>
                  </div>
                </div>
              </div>

              {/* Section B - Big sparkline */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Cómo estuvo tu semana
                </p>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <Sparkline values={TREND} width={320} height={90} showLabels />
                  <div className="mt-2 flex justify-between text-[11px] text-[#94a3b8]">
                    {DAYS.map((d) => (
                      <span key={d}>{d}</span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section C - 2x2 pillars */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Qué influyó esta semana
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <Pillar icon={<Moon size={20} />} area="Sueño" state="Descansaste bien" sub="6 de 7 noches" dot="#7cc2c8" />
                  <Pillar icon={<Target size={20} />} area="Metas del día" state="Todas cumplidas" sub="7 de 7 días" dot="#7cc2c8" />
                  <Pillar
                    icon={<ClipboardList size={20} />}
                    area="Evaluación clínica"
                    state="Pendiente de actualizar"
                    sub="Hace 9 días"
                    dot="#facb60"
                  />
                  <Pillar
                    icon={<Book size={20} />}
                    area="Recursos"
                    state="Sin explorar aún"
                    sub="Disponibles cuando quieras"
                    dot="#94a3b8"
                  />
                </div>
              </div>

              {/* Section D - Comparison */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  Esta semana vs la anterior
                </p>
                <div className="flex gap-2">
                  <CompareCard label="Semana pasada" value="63" color="#64748b" />
                  <CompareCard label="Esta semana" value="47" color="#0f172a" />
                  <CompareCard label="Diferencia" value="-16" color="#e24b4a" diffStyle />
                </div>
                <p className="mt-2 text-[12px] leading-snug text-[#64748b]">
                  Las bajas temporales son parte del proceso. Tu cuerpo y mente se ajustan constantemente.
                </p>
              </div>

              {/* Section E - Origin */}
              <div>
                <p className="mb-2 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.12em] text-[#94a3b8]">
                  De dónde viene tu número
                </p>
                <div className="rounded-2xl bg-[#f8fafc] p-4">
                  <OriginRow label="Sueño y descanso" pct={60} color="#7cc2c8" status="Bien" />
                  <OriginRow label="Tus metas diarias" pct={100} color="#7cc2c8" status="Excelente" divider />
                  <OriginRow label="Evaluación emocional" pct={30} color="#facb60" status="Necesita update" divider />
                  <OriginRow label="Herramientas de apoyo" pct={0} color="#e2e8f0" status="Sin datos aún" divider />
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
