import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";

export default function WeeklyGoalsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">Mis objetivos</h1>
        <button
          onClick={() => navigate("/diario/objetivos/historial")}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-display text-[11px] text-muted-foreground transition-all active:bg-muted"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <WeeklyGoalsWidget title="Metas de esta semana" />
    </div>
  );
}
