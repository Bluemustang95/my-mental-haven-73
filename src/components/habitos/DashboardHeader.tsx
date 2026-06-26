import { BarChart3, Plus, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Props {
  onOpenStats: () => void;
  onNewHabit: () => void;
}

export function DashboardHeader({ onOpenStats, onNewHabit }: Props) {
  const navigate = useNavigate();
  return (
    <header className="shrink-0 border-b border-white/40 bg-white/45 px-5 pt-5 pb-4 backdrop-blur-[28px]">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-[0_4px_12px_-6px_rgba(16,25,39,0.18)] active:scale-95"
            aria-label="Volver"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.22em] text-[#101927]/45">Workspace</p>
            <h1 className="font-serif text-[18px] font-bold leading-tight text-[#101927]">RESMA</h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStats}
            className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.18)] active:scale-95"
            aria-label="Estadísticas"
          >
            <BarChart3 size={18} className="text-[#101927]" />
          </button>
          <button
            onClick={onNewHabit}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-[#101927] text-white shadow-[0_6px_18px_-8px_rgba(16,25,39,0.35)] active:scale-95"
            aria-label="Nuevo hábito"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>
    </header>
  );
}
