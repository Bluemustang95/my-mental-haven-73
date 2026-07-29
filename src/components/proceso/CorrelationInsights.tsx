import { ArrowRight, Link2 } from "lucide-react";
import { describeStrength, type CorrelationReport } from "@/lib/wellbeing/correlations";

/** Insights bidireccionales (Spearman) sobre los últimos 30 días. */
export function CorrelationInsights({ report }: { report: CorrelationReport | null }) {
  if (!report) return null;

  if (!report.hasEnoughData) {
    return (
      <div className="mt-4 rounded-[18px] border-2 border-dashed border-[#e2e8f0] bg-white/40 p-4 text-center">
        <p className="font-display text-[12px] font-semibold text-[#0f172a]">Conexiones entre tus datos</p>
        <p className="mt-1 text-[11px] leading-relaxed text-[#64748b]">
          Necesitamos al menos {report.minPairs} días con registros comparables. Llevás {report.maxPairs}.
        </p>
      </div>
    );
  }

  const list = report.insights.length ? report.insights : report.results.slice(0, 3);

  return (
    <div className="mt-4">
      <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
        Conexiones entre tus datos
      </p>
      <div className="mt-2 space-y-2">
        {list.slice(0, 4).map((r) => (
          <div
            key={`${r.xKey}-${r.yKey}-${r.lag}`}
            className="rounded-[18px] border border-white/70 bg-white/85 p-3.5 backdrop-blur-xl"
          >
            <div className="flex items-center gap-1.5 text-[10.5px] font-semibold text-[#0f172a]">
              <Link2 size={12} className="text-[#7cc2c8]" />
              <span>{r.xLabel}</span>
              <ArrowRight size={11} className="text-[#94a3b8]" />
              <span>{r.yLabel}</span>
              {r.lag === 1 && (
                <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[8.5px] font-medium text-[#64748b]">
                  día siguiente
                </span>
              )}
            </div>
            <p className="mt-1.5 text-[11.5px] leading-relaxed text-[#475569]">{r.message}</p>
            <p className="mt-1.5 text-[9.5px] text-[#94a3b8] tabular-nums">
              {describeStrength(r)} · ρ {r.rho} · {r.n} días{r.significant ? "" : " · aún poco concluyente"}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-2 text-[9.5px] leading-relaxed text-[#94a3b8]">
        Son asociaciones estadísticas de tus últimos 30 días, no relaciones de causa y efecto.
      </p>
    </div>
  );
}
