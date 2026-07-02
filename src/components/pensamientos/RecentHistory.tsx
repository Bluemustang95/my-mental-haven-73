import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock, ChevronRight } from "lucide-react";
import ThoughtRecordDetailSheet from "./ThoughtRecordDetailSheet";

type Row = {
  id: string;
  situation: string | null;
  emotion: string | null;
  created_at: string;
  resolution_mode?: string | null;
  followup_status?: string | null;
};

type FilterType = "all" | "reestructuracion" | "abordaje";
type FilterTask = "all" | "with" | "without" | "pending" | "completed";

export default function PensamientosRecentHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [fType, setFType] = useState<FilterType>("all");
  const [fTask, setFTask] = useState<FilterTask>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("thought_records")
        .select("id, situation, emotion, created_at, resolution_mode")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(100);
      if (!data) return;
      const ids = data.map((r) => r.id);
      const { data: fu } = ids.length
        ? await supabase.from("thought_followups").select("thought_record_id, status").in("thought_record_id", ids)
        : { data: [] as any[] };
      const fuMap = new Map<string, string>();
      (fu ?? []).forEach((f: any) => fuMap.set(f.thought_record_id, f.status));
      setRows(data.map((r: any) => ({ ...r, followup_status: fuMap.get(r.id) ?? null })));
    })();
  }, [user?.id]);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (fType !== "all") {
        const isProblem = r.resolution_mode === "problem";
        if (fType === "abordaje" && !isProblem) return false;
        if (fType === "reestructuracion" && isProblem) return false;
      }
      if (fTask === "with" && !r.followup_status) return false;
      if (fTask === "without" && r.followup_status) return false;
      if (fTask === "pending" && r.followup_status !== "pending") return false;
      if (fTask === "completed" && r.followup_status !== "completed") return false;
      return true;
    });
  }, [rows, fType, fTask]);

  const visible = showAll ? filtered : filtered.slice(0, 5);

  if (!user || rows.length === 0) return null;

  return (
    <>
      <div className="mt-6 space-y-2">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">
            Historial reciente
          </p>
          {filtered.length > 5 && (
            <button
              onClick={() => setShowAll((s) => !s)}
              className="text-[10.5px] font-semibold text-[#7cc2c8]"
            >
              {showAll ? "Ver menos" : `Ver todos (${filtered.length})`}
            </button>
          )}
        </div>

        {showAll && (
          <div className="flex flex-wrap gap-1.5 px-1">
            {(["all", "reestructuracion", "abordaje"] as FilterType[]).map((k) => (
              <button
                key={k}
                onClick={() => setFType(k)}
                className={`text-[10.5px] px-2.5 py-1 rounded-full font-semibold ${
                  fType === k ? "bg-[#101927] text-white" : "bg-slate-100 text-[#101927]/60"
                }`}
              >
                {k === "all" ? "Todos" : k === "reestructuracion" ? "Reestructuración" : "Abordaje"}
              </button>
            ))}
            <span className="w-px bg-slate-200 mx-0.5" />
            {(["all", "pending", "completed", "without"] as FilterTask[]).map((k) => (
              <button
                key={k}
                onClick={() => setFTask(k)}
                className={`text-[10.5px] px-2.5 py-1 rounded-full font-semibold ${
                  fTask === k ? "bg-[#7cc2c8] text-white" : "bg-slate-100 text-[#101927]/60"
                }`}
              >
                {k === "all" ? "Cualquier tarea" : k === "pending" ? "Pendientes" : k === "completed" ? "Completadas" : "Sin tarea"}
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl bg-white shadow-sm divide-y divide-slate-100">
          {visible.map((r) => (
            <button
              key={r.id}
              onClick={() => setOpenId(r.id)}
              className="w-full flex items-start gap-3 px-3.5 py-3 text-left hover:bg-slate-50 transition-colors"
            >
              <Clock size={14} className="mt-0.5 text-[#7cc2c8] shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-semibold text-[#101927] line-clamp-1">
                  {r.situation || "Sin descripción"}
                </p>
                <p className="text-[10.5px] text-[#101927]/55">
                  {new Date(r.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                  {r.emotion ? ` · ${r.emotion}` : ""}
                  {r.resolution_mode === "problem" ? " · Abordaje" : " · Reestructuración"}
                </p>
              </div>
              {r.followup_status && (
                <span className={`text-[9.5px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 shrink-0 ${
                  r.followup_status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                }`}>
                  {r.followup_status === "completed" ? "Tarea ok" : "Tarea"}
                </span>
              )}
              <ChevronRight size={14} className="text-slate-300 shrink-0 mt-0.5" />
            </button>
          ))}
        </div>
      </div>

      <ThoughtRecordDetailSheet
        open={!!openId}
        recordId={openId}
        onClose={() => setOpenId(null)}
      />
    </>
  );
}
