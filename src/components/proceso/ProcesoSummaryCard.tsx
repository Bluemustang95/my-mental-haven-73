import { Activity, ChevronRight, ShieldCheck, Smile } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WellbeingSnapshotV3 } from "@/lib/wellbeing/types";

function Ring({
  value,
  color,
  label,
  caption,
  icon,
}: {
  value: number | null;
  color: string;
  label: string;
  caption: string;
  icon: React.ReactNode;
}) {
  const pct = Math.max(0, Math.min(100, value ?? 0));
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="flex flex-1 flex-col items-center gap-2 rounded-[18px] bg-white/[0.04] px-3 py-4">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">
        {icon}
        {label}
      </div>
      <div className="relative h-[86px] w-[86px]">
        <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
          <circle cx="40" cy="40" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="6" />
          <circle
            cx="40"
            cy="40"
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * pct) / 100}
            className="transition-all duration-700"
          />
        </svg>
        <span className="absolute inset-0 flex items-center justify-center font-display text-[24px] font-semibold text-white tabular-nums">
          {value === null ? "—" : Math.round(value)}
        </span>
      </div>
      <p className="text-[10px] text-white/45">{caption}</p>
    </div>
  );
}

/** Tarjeta oscura de resumen del dashboard de Mi Proceso. */
export function ProcesoSummaryCard({
  snapshot,
  onOpenDetail,
}: {
  snapshot: WellbeingSnapshotV3 | null;
  onOpenDetail: () => void;
}) {
  const navigate = useNavigate();

  if (!snapshot) {
    return <div className="h-[220px] animate-pulse rounded-[24px] bg-[#101927]/90" />;
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpenDetail}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onOpenDetail();
      }}
      className="w-full cursor-pointer rounded-[24px] bg-[#101927] px-4 py-4 text-left shadow-[0_18px_40px_-24px_rgba(16,25,39,0.6)] transition active:scale-[0.99]"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-[#7cc2c8]" />
          <p className="font-[Montserrat] text-[10.5px] font-semibold uppercase tracking-[0.16em] text-white/80">
            Resumen general
          </p>
        </div>
        <span className="inline-flex items-center gap-0.5 text-[11.5px] font-semibold text-[#7cc2c8]">
          Ver Desglose <ChevronRight size={14} />
        </span>
      </div>

      <div className="mt-3 h-px bg-white/[0.08]" />

      {snapshot.hasEnoughData ? (
        <div className="mt-3 flex gap-2.5">
          <Ring
            value={snapshot.wellbeingScore}
            color="#7cc2c8"
            label="Bienestar"
            caption="Sentir (Ánimo/Sueño)"
            icon={<Smile size={12} className="text-[#facb60]" />}
          />
          <Ring
            value={snapshot.careScore}
            color="#87d3a4"
            label="Cuidado"
            caption="Hacer (Uso/Tratamiento)"
            icon={<ShieldCheck size={12} className="text-[#87d3a4]" />}
          />
        </div>
      ) : (
        <div className="mt-3 rounded-[18px] border-2 border-dashed border-white/15 px-4 py-5 text-center">
          <p className="font-display text-[12.5px] leading-snug text-white/85">
            Necesitamos {snapshot.minDays} días de registro en la semana para calcular tu índice.
            Llevás {snapshot.daysWithCheckin}.
          </p>
          <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[#7cc2c8] transition-all duration-500"
              style={{
                width: `${Math.min(100, (snapshot.daysWithCheckin / Math.max(1, snapshot.minDays)) * 100)}%`,
              }}
            />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate("/sintonia-manana");
            }}
            className="pressable mt-3 rounded-full bg-[#7cc2c8] px-3.5 py-1.5 font-display text-[11.5px] font-semibold text-[#0b1220] active:scale-95"
          >
            Registrar mi Sintonía de hoy
          </button>
        </div>
      )}
    </div>
  );
}
