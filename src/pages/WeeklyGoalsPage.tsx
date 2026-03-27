import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { WeeklyGoalsWidget } from "@/components/WeeklyGoalsWidget";
import HistoryPanel from "@/components/journal/HistoryPanel";

export default function WeeklyGoalsPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">Mis objetivos</h1>
        <HistoryPanel<{ id: string; created_at: string | null; goal_text: string; completed: boolean | null; week_start: string }>
          tableName="weekly_goals"
          renderItem={(item) => (
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${item.completed ? "bg-accent" : "bg-border"}`} />
              <span className="text-xs text-foreground truncate">{item.goal_text}</span>
            </div>
          )}
          renderDetail={(item) => (
            <div className="space-y-3">
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Meta</p>
                <p className="text-sm font-body">{item.goal_text}</p>
              </div>
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Estado</p>
                <span className={`rounded-full border px-2.5 py-0.5 font-display text-[11px] ${item.completed ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground"}`}>
                  {item.completed ? "Completada" : "Pendiente"}
                </span>
              </div>
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Semana</p>
                <p className="text-sm font-body">{item.week_start}</p>
              </div>
            </div>
          )}
        />
      </div>

      <WeeklyGoalsWidget title="Metas de esta semana" />
    </div>
  );
}
