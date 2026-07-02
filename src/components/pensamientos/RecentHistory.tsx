import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Clock } from "lucide-react";

type Row = {
  id: string;
  situation: string | null;
  emotion: string | null;
  created_at: string;
  followup_status?: string | null;
};

export default function PensamientosRecentHistory() {
  const { user } = useAuth();
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("thought_records")
        .select("id, situation, emotion, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);
      if (!data) return;
      const ids = data.map((r) => r.id);
      const { data: fu } = await supabase
        .from("thought_followups")
        .select("thought_record_id, status")
        .in("thought_record_id", ids);
      const fuMap = new Map<string, string>();
      (fu ?? []).forEach((f: any) => fuMap.set(f.thought_record_id, f.status));
      setRows(
        data.map((r: any) => ({ ...r, followup_status: fuMap.get(r.id) ?? null })),
      );
    })();
  }, [user?.id]);

  if (!user || rows.length === 0) return null;

  return (
    <div className="mt-6 space-y-2">
      <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50 px-1">
        Historial reciente
      </p>
      <div className="rounded-2xl bg-white shadow-sm divide-y divide-slate-100">
        {rows.map((r) => (
          <div key={r.id} className="flex items-start gap-3 px-3.5 py-3">
            <Clock size={14} className="mt-0.5 text-[#7cc2c8]" />
            <div className="min-w-0 flex-1">
              <p className="text-[12.5px] font-semibold text-[#101927] line-clamp-1">
                {r.situation || "Sin descripción"}
              </p>
              <p className="text-[10.5px] text-[#101927]/55">
                {new Date(r.created_at).toLocaleDateString("es-AR", { day: "2-digit", month: "short" })}
                {r.emotion ? ` · ${r.emotion}` : ""}
              </p>
            </div>
            {r.followup_status && (
              <span className={`text-[9.5px] font-bold uppercase tracking-wider rounded-full px-2 py-0.5 ${
                r.followup_status === "completed" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
              }`}>
                {r.followup_status === "completed" ? "Tarea ok" : "Tarea"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
