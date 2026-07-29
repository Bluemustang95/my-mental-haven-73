import { CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import type { WellbeingSnapshotV3 } from "@/lib/wellbeing/types";

const DAY_LETTERS = ["D", "L", "M", "M", "J", "V", "S"];

export function bandForV3(score: number) {
  if (score >= 70) return { label: "En equilibrio", color: "#4ade80" };
  if (score >= 45) return { label: "Con altibajos", color: "#facb60" };
  return { label: "Semana difícil", color: "#f87171" };
}

function DayBars({ trend, tone = "dark" }: { trend: number[]; tone?: "dark" | "light" }) {
  const today = new Date().getDay();
  const emptyBg = tone === "dark" ? "rgba(255,255,255,0.10)" : "rgba(15,23,42,0.06)";
  const labelCls = tone === "dark" ? "text-white/35" : "text-[#94a3b8]";
  return (
    <div className="flex items-end justify-between gap-1.5">
      {trend.map((v, i) => {
        const dayIdx = (today - (trend.length - 1 - i) + 7) % 7;
        const h = Math.max(6, Math.round((v / 100) * 40));
        const empty = v <= 0;
        return (
          <div key={i} className="flex flex-1 flex-col items-center gap-1">
            <div className="flex h-[40px] w-full items-end justify-center">
              <div
                className="w-full rounded-full transition-all duration-500"
                style={{
                  height: `${h}px`,
                  background: empty ? emptyBg : bandForV3(v).color,
                  opacity: empty ? 1 : 0.9,
                }}
              />
            </div>
            <span className={`text-[8.5px] font-medium ${labelCls}`}>{DAY_LETTERS[dayIdx]}</span>
          </div>
        );
      })}
    </div>
  );
}

type Props = {
  snapshot: WellbeingSnapshotV3 | null;
  onOpen: () => void;
  /** "hero" = tarjeta oscura compacta · "detail" = tarjeta clara del desglose. */
  variant?: "hero" | "detail";
  onOpenCalendar?: () => void;
};

/** Hero v3: Bienestar (SENTIR) grande + Cuidado (HACER) secundario + barras de 7 días. */
export function WellbeingHeroV3({ snapshot, onOpen, variant = "hero", onOpenCalendar }: Props) {
  const navigate = useNavigate();

  if (!snapshot) {
    return <div className="h-[176px] animate-pulse rounded-[22px] bg-[#101927]/90" />;
  }

  const { wellbeingScore, careScore, delta, trend, hasEnoughData, daysWithCheckin, minDays, message, modulator } = snapshot;

  if (variant === "detail") {
    return (
      <div className="rounded-[22px] border border-black/[0.06] bg-white p-4 shadow-[0_10px_30px_-24px_rgba(16,25,39,0.4)]">
        {hasEnoughData ? (
          <>
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-end gap-1.5">
                  <span className="font-display text-[42px] font-bold leading-none text-[#0f172a] tabular-nums">
                    {Math.round(wellbeingScore ?? 0)}
                  </span>
                  <span className="mb-1 text-[13px] font-medium text-[#94a3b8]">/ 100 Bienestar</span>
                </div>
                <p className="mt-1.5 font-display text-[13px] font-semibold text-[#16a34a]">
                  Cuidado y Adherencia: {careScore === null ? "—" : Math.round(careScore)} pts
                </p>
                {delta !== 0 && (
                  <div className="mt-1 flex items-center gap-1 text-[10.5px] font-medium text-[#94a3b8]">
                    {delta < 0 ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
                    {Math.abs(delta)}% vs. semana previa
                  </div>
                )}
              </div>
              <div className="w-[46%] shrink-0">
                <DayBars trend={trend} tone="light" />
              </div>
            </div>
            <p className="mt-3 text-[11.5px] leading-relaxed text-[#64748b]">{message}</p>
            {modulator.penalty > 0 && (
              <p className="mt-2 inline-flex rounded-full bg-amber-400/20 px-2.5 py-1 text-[9.5px] font-semibold text-amber-700">
                Ajuste clínico aplicado −{modulator.penalty} pts
              </p>
            )}
          </>
        ) : (
          <>
            <p className="font-display text-[13px] leading-snug text-[#0f172a]">
              Necesitamos {minDays} días de registro en la semana para calcularlo. Llevás {daysWithCheckin}.
            </p>
            <div className="mt-3">
              <DayBars trend={trend} tone="light" />
            </div>
          </>
        )}

        {onOpenCalendar && (
          <button
            onClick={onOpenCalendar}
            className="mt-3.5 flex w-full items-center justify-center gap-2 rounded-[14px] bg-[#eff6ff] py-3 font-display text-[12.5px] font-semibold text-[#2563eb] transition active:scale-[0.99]"
          >
            <CalendarDays size={15} />
            Ver calendario mensual completo
          </button>
        )}
      </div>
    );
  }

  if (!hasEnoughData) {
    return (
      <div className="relative overflow-hidden rounded-[22px] bg-[#101927] px-5 py-5 shadow-[0_14px_32px_-20px_rgba(16,25,39,0.55)]">
        <p className="font-display text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
          Índice de bienestar
        </p>
        <p className="mt-2 font-display text-[13px] leading-snug text-white/85">
          Necesitamos {minDays} días de registro en la semana para calcularlo. Llevás {daysWithCheckin}.
        </p>
        <button
          onClick={() => navigate("/sintonia-manana")}
          className="pressable mt-3 rounded-full bg-[#7cc2c8] px-3.5 py-1.5 font-display text-[11.5px] font-semibold text-[#0b1220] active:scale-95"
        >
          Registrar mi Sintonía de hoy
        </button>
        <div className="mt-4">
          <DayBars trend={trend} />
        </div>
      </div>
    );
  }

  const score = wellbeingScore ?? 0;
  const band = bandForV3(score);
  const negative = delta < 0;

  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-[22px] bg-[#101927] px-5 py-5 text-left shadow-[0_14px_32px_-20px_rgba(16,25,39,0.55)] transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="font-display text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
            Bienestar · cómo te sentís
          </p>
          <div className="mt-1 flex items-end gap-2">
            <span className="font-display text-[44px] font-semibold leading-none text-white tabular-nums">
              {Math.round(score)}
            </span>
            <span
              className="mb-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold"
              style={{ background: `${band.color}22`, color: band.color }}
            >
              {band.label}
            </span>
          </div>
          {delta !== 0 && (
            <div className="mt-1.5 flex items-center gap-1 text-[10.5px] font-medium text-white/50">
              {negative ? <TrendingDown size={12} /> : <TrendingUp size={12} />}
              {Math.abs(delta)}% vs. semana previa
            </div>
          )}
        </div>

        <div className="shrink-0 rounded-[14px] bg-white/[0.06] px-3 py-2 text-right">
          <p className="text-[8.5px] font-medium uppercase tracking-[0.14em] text-white/40">Cuidado</p>
          <p className="font-display text-[20px] font-semibold leading-tight text-white/90 tabular-nums">
            {careScore === null ? "—" : Math.round(careScore)}
          </p>
          <p className="text-[8.5px] text-white/35">qué hacés</p>
        </div>
      </div>

      <div className="mt-4">
        <DayBars trend={trend} />
      </div>

      <p className="mt-3.5 text-[11.5px] leading-relaxed text-white/60">{message}</p>

      {modulator.penalty > 0 && (
        <p className="mt-2 inline-flex rounded-full bg-amber-400/15 px-2.5 py-1 text-[9.5px] font-semibold text-amber-300">
          Ajuste clínico aplicado −{modulator.penalty} pts
        </p>
      )}
    </button>
  );
}
