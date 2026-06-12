import { useNavigate } from "react-router-dom";
import { Zap, ChevronRight } from "lucide-react";

export default function PackOverview() {
  const navigate = useNavigate();

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display text-xl font-bold text-slate-800">Pack de Actividades</h1>
        <p className="text-xs text-slate-500">Programas terapéuticos guiados.</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={() => navigate("/admin/pack/ba")}
          className="flex items-center gap-3 rounded-2xl border border-white/60 bg-white/70 p-4 text-left shadow-sm transition hover:bg-white"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#facb60]/15 text-[#facb60]">
            <Zap size={22} />
          </div>
          <div className="flex-1">
            <p className="font-display text-sm font-bold text-slate-800">Activación Comportamental</p>
            <p className="text-[11px] text-slate-500">7 días · CMS completo</p>
          </div>
          <ChevronRight size={16} className="text-slate-400" />
        </button>
      </div>
    </div>
  );
}
