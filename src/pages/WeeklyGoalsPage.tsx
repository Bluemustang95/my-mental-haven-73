import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";

export default function WeeklyGoalsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-resource-values-bg px-5 pt-14 pb-4 text-resource-values-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-values-accent/15 bg-card/75 text-resource-values-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Mis objetivos</h1>
          <p className="font-sans text-xs leading-5 text-resource-values-accent/65">Cuidá lo importante esta semana</p>
        </div>
        <button
          onClick={() => navigate("/diario/objetivos/historial")}
          className="flex items-center gap-1.5 rounded-full border border-resource-values-accent/15 bg-card/75 px-3 py-1.5 font-display text-[11px] font-semibold text-resource-values-accent shadow-sm transition-all active:scale-95"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <WeeklyGoalsWidget title="Metas de esta semana" />
    </div>
  );
}
