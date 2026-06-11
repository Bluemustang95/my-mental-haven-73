import { format, addDays } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";

export interface CalendarActivity {
  type: "journal" | "thought" | "test" | "exercise" | "dream" | "goal" | "reading";
  label: string;
  detail: string;
  time: string;
}

const TEST_LABELS: Record<string, string> = {
  bdi: "Test BDI-II (depresión)",
  "bdi-ii": "Test BDI-II (depresión)",
  bai: "Test BAI (ansiedad)",
  pswq: "Test PSWQ (preocupación)",
  bigfive: "Test de personalidad Big Five",
  "big-five": "Test de personalidad Big Five",
  bfi: "Test de personalidad Big Five",
};

export async function fetchCalendarActivities(userId: string, day: Date): Promise<CalendarActivity[]> {
  const ds = localDateStr(day);
  const dayStart = `${ds}T03:00:00Z`;
  const nextDayStr = localDateStr(addDays(day, 1));
  const dayEnd = `${nextDayStr}T03:00:00Z`;
  const activities: CalendarActivity[] = [];

  const [journals, thoughts, tests, exercises, dreams, achievements, checkins, completedGoals, bodyMap] = await Promise.all([
    supabase.from("journal_entries").select("id, created_at, content").eq("user_id", userId).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
    supabase.from("thought_records").select("id, created_at, situation").eq("user_id", userId).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
    supabase.from("test_results").select("id, created_at, test_type, score, severity").eq("user_id", userId).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
    supabase.from("exercise_sessions").select("id, created_at, exercise_type, exercise_name, duration_seconds").eq("user_id", userId).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
    supabase.from("dream_log").select("id, created_at, description").eq("user_id", userId).eq("dream_date", ds).order("created_at"),
    supabase.from("micro_achievements").select("id, created_at, achievement_text").eq("user_id", userId).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
    supabase.from("daily_checkins").select("id, created_at, mood_score, note").eq("user_id", userId).eq("checkin_date", ds),
    supabase.from("weekly_goals").select("id, created_at, goal_text").eq("user_id", userId).eq("completed", true).gte("created_at", dayStart).lt("created_at", dayEnd),
    supabase.from("body_map_entries").select("id, created_at, body_part, note").eq("user_id", userId).gte("created_at", dayStart).lt("created_at", dayEnd).order("created_at"),
  ]);

  journals.data?.forEach((j: any) => activities.push({ type: "journal", label: "Entrada de diario", detail: j.content?.slice(0, 100) || "", time: format(new Date(j.created_at), "HH:mm") }));
  thoughts.data?.forEach((t: any) => activities.push({ type: "thought", label: "Registro de pensamiento", detail: t.situation?.slice(0, 100) || "", time: format(new Date(t.created_at), "HH:mm") }));
  tests.data?.forEach((t: any) => activities.push({ type: "test", label: `Test ${t.test_type}`, detail: `Puntaje: ${t.score}${t.severity ? ` · ${t.severity}` : ""}`, time: format(new Date(t.created_at), "HH:mm") }));
  exercises.data?.forEach((e: any) => activities.push({ type: "exercise", label: e.exercise_name || e.exercise_type, detail: e.duration_seconds ? `${Math.round(e.duration_seconds / 60)} min` : "Completado", time: format(new Date(e.created_at), "HH:mm") }));
  dreams.data?.forEach((d: any) => activities.push({ type: "dream", label: "Registro de sueño", detail: d.description?.slice(0, 100) || "", time: format(new Date(d.created_at), "HH:mm") }));
  achievements.data?.forEach((a: any) => activities.push({ type: "goal", label: "Logro registrado", detail: a.achievement_text?.slice(0, 100) || "", time: format(new Date(a.created_at), "HH:mm") }));
  checkins.data?.forEach((c: any) => activities.push({ type: "exercise", label: "Check-in emocional", detail: `Estado ${c.mood_score}/5${c.note ? ` · ${c.note.slice(0, 80)}` : ""}`, time: format(new Date(c.created_at), "HH:mm") }));
  completedGoals.data?.forEach((g: any) => activities.push({ type: "goal", label: "Objetivo cumplido", detail: g.goal_text?.slice(0, 100) || "", time: format(new Date(g.created_at), "HH:mm") }));

  const bodyPartLabels: Record<string, string> = {
    head: "Cabeza", neck: "Cuello", chest: "Pecho", stomach: "Estómago",
    left_shoulder: "Hombro izq.", right_shoulder: "Hombro der.", left_arm: "Brazo izq.", right_arm: "Brazo der.", pelvis: "Pelvis",
    left_leg: "Pierna izq.", right_leg: "Pierna der.", left_foot: "Pie izq.", right_foot: "Pie der.",
  };
  const bodyBatches: Record<string, { parts: string[]; note: string | null; time: string }> = {};
  bodyMap.data?.forEach((b: any) => {
    const key = b.created_at?.slice(0, 16) || "unknown";
    if (!bodyBatches[key]) bodyBatches[key] = { parts: [], note: b.note, time: format(new Date(b.created_at), "HH:mm") };
    bodyBatches[key].parts.push(bodyPartLabels[b.body_part] || b.body_part);
  });
  Object.values(bodyBatches).forEach((batch) => {
    activities.push({ type: "exercise", label: "Check-in somático", detail: `Tensión en ${batch.parts.join(", ")}${batch.note ? ` · ${batch.note.slice(0, 80)}` : ""}`, time: batch.time });
  });

  return activities.sort((a, b) => a.time.localeCompare(b.time));
}
