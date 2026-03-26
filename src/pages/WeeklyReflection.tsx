import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, SpinnerGap, MagicWand } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";
import { localWeekStart } from "@/lib/utils";

function getWeekStart(): string {
  return localWeekStart();
}

export default function WeeklyReflection() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reflection, setReflection] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const weekStart = getWeekStart();

  useEffect(() => {
    if (!user) return;
    supabase
      .from("weekly_reflections")
      .select("reflection_text")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.reflection_text) setReflection(data.reflection_text);
      });
  }, [user, weekStart]);

  const generateReflection = async () => {
    if (!user) return;
    setLoading(true);
    setError("");

    try {
      // Gather this week's data
      const weekEnd = new Date();
      const weekStartDate = new Date(weekStart);

      const [checkinsRes, therapyRes, journalRes] = await Promise.all([
        supabase.from("daily_checkins").select("checkin_date, mood_score, note").eq("user_id", user.id).gte("checkin_date", weekStart).order("checkin_date"),
        supabase.from("therapy_prep_notes").select("note").eq("user_id", user.id).gte("created_at", weekStartDate.toISOString()),
        supabase.from("journal_entries").select("content, emotion_tags").eq("user_id", user.id).gte("entry_date", weekStart).limit(5),
      ]);

      const checkins = checkinsRes.data ?? [];
      const therapyNotes = therapyRes.data ?? [];
      const journal = journalRes.data ?? [];

      const moodAvg = checkins.length ? (checkins.reduce((s, c) => s + (c.mood_score ?? 3), 0) / checkins.length).toFixed(1) : "sin datos";
      const daysMapped = checkins.map((c) => `${c.checkin_date}: ánimo ${c.mood_score}/5${c.note ? ` (${c.note})` : ""}`).join("; ");
      const notesText = therapyNotes.map((n) => n.note).join(". ");
      const emotions = journal.flatMap((j) => j.emotion_tags ?? []).join(", ");

      const prompt = `Sos un asistente empático de salud mental. Generá un párrafo breve (3-4 oraciones) de reflexión semanal para un paciente, usando voseo argentino amable. Basate en estos datos de la semana:

Estado de ánimo promedio: ${moodAvg}/5
Registros diarios: ${daysMapped || "ninguno"}
Notas para terapia: ${notesText || "ninguna"}
Emociones del diario: ${emotions || "no registradas"}

Sé cálido, empático, no diagnóstico. Mencioná patrones observados de forma gentil. Ejemplo: "Esta semana notamos que tu ánimo subió hacia el jueves..."`;

      const { data: aiData, error: aiError } = await supabase.functions.invoke("resmita-chat", {
        body: { messages: [{ role: "user", content: prompt }] },
      });

      if (aiError) throw aiError;

      const text = aiData?.reply || aiData?.content || "No se pudo generar la reflexión.";
      setReflection(text);

      // Cache it
      await supabase.from("weekly_reflections").upsert(
        { user_id: user.id, week_start: weekStart, reflection_text: text },
        { onConflict: "user_id,week_start" }
      );
    } catch (e: any) {
      setError("No se pudo generar la reflexión. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <button onClick={() => navigate("/mi-proceso")} className="mb-4 flex items-center gap-1 text-sm text-muted-foreground">
        <ArrowLeft size={16} /> Mi Proceso
      </button>
      <h1 className="mb-2 font-display text-xl font-semibold flex items-center gap-2">
        <MagicWand size={24} weight="duotone" className="text-accent" /> El Espejo
      </h1>
      <p className="mb-6 text-sm text-muted-foreground">Una reflexión semanal basada en tus registros.</p>

      {reflection ? (
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-2xl border border-border bg-card p-5">
          <p className="text-sm leading-relaxed italic text-foreground">"{reflection}"</p>
          <p className="mt-3 text-[10px] text-muted-foreground">Semana del {weekStart}</p>
        </motion.div>
      ) : null}

      <button
        onClick={generateReflection}
        disabled={loading}
        className="w-full rounded-2xl bg-primary py-3 font-display text-sm font-medium text-primary-foreground active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <SpinnerGap size={18} className="animate-spin" /> Generando...
          </>
        ) : reflection ? (
          "Regenerar reflexión"
        ) : (
          "Generar mi reflexión semanal"
        )}
      </button>

      {error && <p className="mt-3 text-xs text-destructive text-center">{error}</p>}
    </div>
  );
}
