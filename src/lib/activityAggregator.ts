import { supabase } from "@/integrations/supabase/client";
import { getHiddenToolSlugs } from "./hiddenTools";

export type ActivityBreakdown = {
  checkins: number;
  thoughts: number;
  dbt: number;
  journal: number;
  mindfulnessMin: number;
  habitCompletions: number;
  packDays: number;
  medsTaken: number;
  medsTotal: number;
  reflections: number;
  total: number;
};

function isoDate(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

/** Rango [from, to] con fechas ISO */
export type Range = { from: Date; to: Date };

export function weekRange(offsetWeeks = 0): Range {
  const now = new Date();
  const to = new Date(now.getTime() - offsetWeeks * 7 * 86400000);
  to.setHours(23, 59, 59, 999);
  const from = new Date(to.getTime() - 6 * 86400000);
  from.setHours(0, 0, 0, 0);
  return { from, to };
}

export function monthRange(offsetMonths = 0): Range {
  const now = new Date();
  const to = new Date(now.getFullYear(), now.getMonth() - offsetMonths + 1, 0, 23, 59, 59, 999);
  const from = new Date(to.getFullYear(), to.getMonth(), 1, 0, 0, 0, 0);
  return { from, to };
}

export function rangeLabel(r: Range, mode: "week" | "month"): string {
  const opts: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" };
  if (mode === "week") {
    return `${r.from.toLocaleDateString("es-AR", opts)} – ${r.to.toLocaleDateString("es-AR", opts)}`;
  }
  return r.from.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
}

export async function loadActivity(userId: string, r: Range): Promise<ActivityBreakdown> {
  const fromIso = r.from.toISOString();
  const toIso = r.to.toISOString();
  const fromDate = isoDate(r.from);
  const toDate = isoDate(r.to);

  const [ci, th, dbt, jr, ex, hc, bad, ml, wr] = await Promise.all([
    supabase.from("daily_checkins").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("checkin_date", fromDate).lte("checkin_date", toDate),
    supabase.from("thought_records").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("dbt_emotion_sessions").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("exercise_sessions").select("duration_seconds, exercise_type").eq("user_id", userId).eq("exercise_type", "mindfulness").gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("habit_completions").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("completed_date", fromDate).lte("completed_date", toDate),
    supabase.from("ba_day_logs").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("medication_logs").select("taken").eq("user_id", userId).gte("log_date", fromDate).lte("log_date", toDate),
    supabase.from("weekly_reflections").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
  ]);

  const hidden = await getHiddenToolSlugs();
  const exRows = ((ex.data ?? []) as any[]).filter((r) => {
    const t = String(r.exercise_type ?? "").toLowerCase();
    return !t || !hidden.has(t);
  });
  const mindMin = Math.round(exRows.reduce((s, r: any) => s + (r.duration_seconds ?? 0), 0) / 60);
  const medRows = (ml.data ?? []) as { taken: boolean | null }[];
  const medsTaken = medRows.filter((r) => r.taken === true).length;

  const b: ActivityBreakdown = {
    checkins: ci.count ?? 0,
    thoughts: th.count ?? 0,
    dbt: dbt.count ?? 0,
    journal: jr.count ?? 0,
    mindfulnessMin: mindMin,
    habitCompletions: hc.count ?? 0,
    packDays: bad.count ?? 0,
    medsTaken,
    medsTotal: medRows.length,
    reflections: wr.count ?? 0,
    total: 0,
  };
  b.total = b.checkins + b.thoughts + b.dbt + b.journal + b.habitCompletions + b.packDays + b.reflections + Math.round(b.mindfulnessMin / 5);
  return b;
}

/** Serie diaria: [{date, mood 0-100, activityCount}] para el rango dado */
export async function loadDailySeries(userId: string, r: Range) {
  const fromDate = isoDate(r.from);
  const toDate = isoDate(r.to);
  const fromIso = r.from.toISOString();
  const toIso = r.to.toISOString();

  const [{ data: ci }, { data: th }, { data: dbt }, { data: jr }, { data: ex }, { data: hc }, { data: bad }] = await Promise.all([
    supabase.from("daily_checkins").select("checkin_date, mood_score").eq("user_id", userId).gte("checkin_date", fromDate).lte("checkin_date", toDate),
    supabase.from("thought_records").select("created_at").eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("dbt_emotion_sessions").select("created_at").eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("journal_entries").select("created_at").eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("exercise_sessions").select("created_at").eq("user_id", userId).eq("exercise_type", "mindfulness").gte("created_at", fromIso).lte("created_at", toIso),
    supabase.from("habit_completions").select("completed_date").eq("user_id", userId).gte("completed_date", fromDate).lte("completed_date", toDate),
    supabase.from("ba_day_logs").select("created_at").eq("user_id", userId).gte("created_at", fromIso).lte("created_at", toIso),
  ]);

  const dayCount = Math.round((r.to.getTime() - r.from.getTime()) / 86400000) + 1;
  const series: { date: string; mood: number | null; activity: number }[] = [];
  for (let i = 0; i < dayCount; i++) {
    const d = new Date(r.from.getTime() + i * 86400000);
    const ds = isoDate(d);
    const moodRow = (ci ?? []).find((c: any) => c.checkin_date === ds && (c.mood_score ?? 0) > 0);
    const mood = moodRow?.mood_score ? Math.round((moodRow.mood_score / 5) * 100) : null;
    const day = (arr: any[] | null | undefined, field: string) =>
      (arr ?? []).filter((r: any) => String(r[field]).slice(0, 10) === ds).length;
    const activity = day(th, "created_at") + day(dbt, "created_at") + day(jr, "created_at") + day(ex, "created_at") + day(hc, "completed_date") + day(bad, "created_at");
    series.push({ date: ds, mood, activity });
  }
  return series;
}
