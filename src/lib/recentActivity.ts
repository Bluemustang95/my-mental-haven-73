import { supabase } from "@/integrations/supabase/client";

export type ActivityKind =
  | "thought" | "dbt" | "mindfulness" | "checkin" | "journal"
  | "sleep" | "medication" | "test" | "dream";

export interface RecentActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  subtitle?: string;
  at: string; // ISO
}

const TITLE: Record<ActivityKind, string> = {
  thought: "Pensamiento trabajado",
  dbt: "Regulación emocional (DBT)",
  mindfulness: "Práctica de mindfulness",
  checkin: "Check-in emocional",
  journal: "Entrada de diario",
  sleep: "Registro de sueño",
  medication: "Toma de medicación",
  test: "Test psicométrico",
  dream: "Registro de sueños",
};

/**
 * Pulls last N sessions across all clinical modules for a user.
 * Used by MiProceso (feed) and PatientDetail (admin view).
 */
export async function fetchRecentActivity(userId: string, limit = 20): Promise<RecentActivity[]> {
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const [tr, dbt, ex, ci, jn, sl, ml, ts] = await Promise.all([
    supabase.from("thought_records").select("id, created_at, situation, emotion").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
    supabase.from("dbt_emotion_sessions").select("id, created_at, emotion, path").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
    supabase.from("exercise_sessions").select("id, created_at, exercise_type, exercise_name, duration_seconds").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
    supabase.from("daily_checkins").select("id, created_at, mood_score, mode").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
    supabase.from("journal_entries").select("id, created_at, content").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
    supabase.from("sleep_log").select("id, created_at, quality, score").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
    supabase.from("medication_logs").select("id, taken_at, taken").eq("user_id", userId).gte("taken_at", since).order("taken_at", { ascending: false }).limit(limit),
    supabase.from("test_results").select("id, created_at, test_type, severity").eq("user_id", userId).gte("created_at", since).order("created_at", { ascending: false }).limit(limit),
  ]);

  const out: RecentActivity[] = [];
  (tr.data ?? []).forEach((r: any) => out.push({ id: `t-${r.id}`, kind: "thought", title: TITLE.thought, subtitle: r.situation?.slice(0, 60) || r.emotion, at: r.created_at }));
  (dbt.data ?? []).forEach((r: any) => out.push({ id: `d-${r.id}`, kind: "dbt", title: TITLE.dbt, subtitle: r.emotion ? `Emoción: ${r.emotion}` : r.path, at: r.created_at }));
  (ex.data ?? []).forEach((r: any) => {
    const isMind = (r.exercise_type ?? "").toLowerCase().includes("mind") || (r.exercise_type ?? "").toLowerCase().includes("breath");
    const kind: ActivityKind = isMind ? "mindfulness" : "mindfulness";
    const min = r.duration_seconds ? `${Math.round(r.duration_seconds / 60)} min` : "Completado";
    out.push({ id: `e-${r.id}`, kind, title: r.exercise_name || TITLE.mindfulness, subtitle: min, at: r.created_at });
  });
  (ci.data ?? []).forEach((r: any) => out.push({ id: `c-${r.id}`, kind: "checkin", title: r.mode === "night" ? "Check-in nocturno" : "Check-in matutino", subtitle: r.mood_score ? `Ánimo ${r.mood_score}/5` : undefined, at: r.created_at }));
  (jn.data ?? []).forEach((r: any) => out.push({ id: `j-${r.id}`, kind: "journal", title: TITLE.journal, subtitle: r.content?.replace(/<[^>]+>/g, "").slice(0, 60), at: r.created_at }));
  (sl.data ?? []).forEach((r: any) => out.push({ id: `s-${r.id}`, kind: "sleep", title: TITLE.sleep, subtitle: r.quality ?? (r.score != null ? `${r.score}/10` : undefined), at: r.created_at }));
  (ml.data ?? []).forEach((r: any) => out.push({ id: `m-${r.id}`, kind: "medication", title: TITLE.medication, subtitle: r.taken ? "Tomada" : "Saltada", at: r.taken_at }));
  (ts.data ?? []).forEach((r: any) => out.push({ id: `q-${r.id}`, kind: "test", title: `${TITLE.test} · ${r.test_type}`, subtitle: r.severity ?? undefined, at: r.created_at }));

  return out.sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, limit);
}
