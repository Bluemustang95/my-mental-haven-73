import { useCallback, useEffect, useState } from "react";
import { Calendar, Repeat } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { NextSessionSheet, type NextSessionData, loadLocalMeta } from "./NextSessionSheet";

export function NextSessionCard() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<NextSessionData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    // Auto-roll past sessions forward on mount (weekly recurring only).
    try { await supabase.rpc("roll_next_session_forward" as any); } catch { /* noop */ }

    const { data: row } = await supabase
      .from("patient_app_profiles")
      .select("next_session_at, session_weekly_recurring, session_time")
      .eq("user_id", user.id)
      .maybeSingle();

    if (row?.next_session_at) {
      const dt = new Date(row.next_session_at);
      const yyyy = dt.getFullYear();
      const mm = String(dt.getMonth() + 1).padStart(2, "0");
      const dd = String(dt.getDate()).padStart(2, "0");
      const hh = String(dt.getHours()).padStart(2, "0");
      const min = String(dt.getMinutes()).padStart(2, "0");
      const meta = loadLocalMeta();
      setData({
        date: `${yyyy}-${mm}-${dd}`,
        time: `${hh}:${min}`,
        modality: meta.modality,
        location: meta.location,
        weeklyRecurring: !!row.session_weekly_recurring,
      });
    } else {
      setData(null);
    }
    setLoading(false);
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const handleSave = (next: NextSessionData) => {
    setData(next);
  };

  const label = data
    ? format(new Date(`${data.date}T${data.time}:00`), "EEE d MMM · HH:mm", { locale: es })
    : "Configurar";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-[120px] w-full flex-col items-center justify-center gap-1 rounded-[22px] p-2.5 text-center transition active:scale-95"
        style={{ background: "#7cc2c8" }}
      >
        <Calendar size={22} strokeWidth={2} className="text-white" />
        <p className="font-display text-[12px] font-bold leading-tight text-white">
          Próxima Sesión
        </p>
        {loading ? (
          <p className="text-[10px] font-medium text-white/80">…</p>
        ) : data ? (
          <>
            <p className="text-[10.5px] font-semibold leading-tight text-white line-clamp-2">
              {label}
            </p>
            {data.weeklyRecurring && (
              <span className="mt-0.5 inline-flex items-center gap-1 rounded-full bg-white/25 px-1.5 py-0.5 text-[8.5px] font-bold text-white">
                <Repeat size={8} /> semanal
              </span>
            )}
          </>
        ) : (
          <p className="text-[10px] font-medium text-white/85">Sin agendar</p>
        )}
      </button>

      <NextSessionSheet
        open={open}
        initial={data}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </>
  );
}
