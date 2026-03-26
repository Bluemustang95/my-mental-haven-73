import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Clock, Notebook, Heartbeat } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { localWeekStart, localDateStr } from "@/lib/utils";

function getWeekStart(): string {
  return localWeekStart();
}

export function SessionPrep() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [show, setShow] = useState(false);
  const [moodAvg, setMoodAvg] = useState<number | null>(null);
  const [noteCount, setNoteCount] = useState(0);
  const [nextSession, setNextSession] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const weekStart = getWeekStart();
    const now = new Date();

    (async () => {
      // Check next session note (future dates)
      const { data: sessions } = await supabase
        .from("session_notes")
        .select("session_date")
        .eq("user_id", user.id)
        .gte("session_date", now.toISOString().split("T")[0])
        .order("session_date")
        .limit(1);

      if (sessions && sessions.length > 0) {
        const sessionDate = new Date(sessions[0].session_date + "T00:00:00");
        const diffMs = sessionDate.getTime() - now.getTime();
        const diffMin = diffMs / 60000;

        // Show if session is within 15 min to 24 hours
        if (diffMin > -30 && diffMin <= 1440) {
          setNextSession(sessions[0].session_date);
          setShow(true);
        }
      }

      // Fetch weekly data
      const [checkinsRes, notesRes] = await Promise.all([
        supabase.from("daily_checkins").select("mood_score").eq("user_id", user.id).gte("checkin_date", weekStart),
        supabase.from("therapy_prep_notes").select("id").eq("user_id", user.id).gte("created_at", new Date(weekStart).toISOString()).eq("resolved", false),
      ]);

      const scores = (checkinsRes.data ?? []).map((c) => c.mood_score ?? 3);
      if (scores.length) setMoodAvg(Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10);
      setNoteCount(notesRes.data?.length ?? 0);
    })();
  }, [user]);

  if (!show) return null;

  const moodLabel = moodAvg !== null
    ? moodAvg >= 4 ? "Bien" : moodAvg >= 3 ? "Neutro" : "Bajo"
    : "Sin datos";

  return (
    <motion.section
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6 rounded-2xl border border-accent/30 bg-accent/5 p-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <Clock size={18} weight="duotone" className="text-accent" />
        <h2 className="font-display text-sm font-semibold">Modo Espera de Sesión</h2>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Tu sesión está cerca. Repasá lo registrado esta semana.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <div className="rounded-xl bg-card border border-border p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Heartbeat size={14} className="text-accent" />
            <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Ánimo</span>
          </div>
          <p className="font-display text-sm font-medium">{moodLabel} {moodAvg !== null && `(${moodAvg}/5)`}</p>
        </div>
        <button
          onClick={() => navigate("/diario/terapia")}
          className="rounded-xl bg-card border border-border p-3 text-left active:bg-muted"
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Notebook size={14} className="text-accent" />
            <span className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">Notas</span>
          </div>
          <p className="font-display text-sm font-medium">{noteCount} pendiente{noteCount !== 1 ? "s" : ""}</p>
        </button>
      </div>
    </motion.section>
  );
}
