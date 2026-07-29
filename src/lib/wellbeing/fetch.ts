// ============================================================================
// Carga de datos crudos (30 días) para el Índice de Bienestar v3.
// Una sola pasada; reutilizable por el usuario logueado y por el preview admin.
// ============================================================================
import { supabase } from "@/integrations/supabase/client";
import { getHiddenToolSlugs, filterOutHidden } from "@/lib/hiddenTools";
import { EMPTY_RAW, SERIES_DAYS, type WellbeingRaw, type RawActivity } from "./types";
import { computeWellbeingV3, isoDate, startOfDay } from "./compute";
import { DEFAULT_CONFIG, type WellbeingConfig, type WellbeingSnapshotV3 } from "./types";

function windowStart(today: Date, days = SERIES_DAYS) {
  return new Date(startOfDay(today).getTime() - (days - 1) * 86400000);
}

export async function loadWellbeingRaw(userId?: string): Promise<WellbeingRaw> {
  const today = startOfDay(new Date());
  let uid = userId;
  if (!uid) {
    const { data } = await supabase.auth.getUser();
    uid = data.user?.id;
  }
  if (!uid) return { today, ...EMPTY_RAW };

  const fromDate = isoDate(windowStart(today));
  const fromTs = windowStart(today).toISOString();
  const from45 = new Date(startOfDay(today).getTime() - 60 * 86400000).toISOString();

  const [
    checkins, sleepLogs, hygiene, dreams, medLogs, meds,
    sessionNotes, prepNotes, tests, profile,
    exercises, thoughts, dbt, journal, habits,
  ] = await Promise.all([
    supabase.from("daily_checkins").select("checkin_date, mode, mood_score, sleep_score, dawn_score, emotions").eq("user_id", uid).gte("checkin_date", fromDate),
    supabase.from("sleep_log").select("log_date, score, quality").eq("user_id", uid).gte("log_date", fromDate),
    supabase.from("sleep_hygiene_audits").select("audit_date, score").eq("user_id", uid).gte("audit_date", fromDate),
    supabase.from("dream_log").select("dream_date, themes, emotions, sleep_quality").eq("user_id", uid).gte("dream_date", fromDate),
    supabase.from("medication_logs").select("log_date, taken").eq("user_id", uid).gte("log_date", fromDate),
    supabase.from("medications").select("id, active").eq("user_id", uid),
    supabase.from("session_notes").select("session_date").eq("user_id", uid).gte("session_date", fromDate),
    supabase.from("therapy_prep_notes").select("created_at, shared_at").eq("user_id", uid).gte("created_at", fromTs),
    supabase.from("test_results").select("test_type, severity, created_at").eq("user_id", uid).gte("created_at", from45),
    supabase.from("patient_app_profiles").select("in_therapy").eq("user_id", uid).maybeSingle(),
    supabase.from("exercise_sessions").select("created_at, exercise_type").eq("user_id", uid).gte("created_at", fromTs),
    supabase.from("thought_records").select("created_at").eq("user_id", uid).gte("created_at", fromTs),
    supabase.from("dbt_emotion_sessions").select("created_at").eq("user_id", uid).gte("created_at", fromTs),
    supabase.from("journal_entries").select("created_at").eq("user_id", uid).gte("created_at", fromTs),
    supabase.from("habit_completions").select("completed_date").eq("user_id", uid).gte("completed_date", fromDate),
  ]);

  const hidden = await getHiddenToolSlugs();
  const exFiltered = filterOutHidden((exercises.data ?? []) as any[], hidden, "exercise_type");

  const activities: RawActivity[] = [
    ...exFiltered.map((e: any) => ({ date: e.created_at, kind: "exercise" })),
    ...(thoughts.data ?? []).map((t: any) => ({ date: t.created_at, kind: "thought" })),
    ...(dbt.data ?? []).map((d: any) => ({ date: d.created_at, kind: "dbt" })),
    ...(journal.data ?? []).map((j: any) => ({ date: j.created_at, kind: "journal" })),
    ...(habits.data ?? []).map((h: any) => ({ date: h.completed_date, kind: "habit" })),
  ];

  return {
    today,
    checkins: (checkins.data ?? []) as any[],
    sleepLogs: (sleepLogs.data ?? []) as any[],
    hygieneAudits: (hygiene.data ?? []) as any[],
    dreams: (dreams.data ?? []) as any[],
    activities,
    medLogs: (medLogs.data ?? []) as any[],
    sessionNotes: (sessionNotes.data ?? []) as any[],
    prepNotes: (prepNotes.data ?? []) as any[],
    tests: (tests.data ?? []) as any[],
    inTherapy: !!profile.data?.in_therapy,
    hasMedications: (meds.data ?? []).some((m: any) => m.active !== false),
  };
}

export async function loadWellbeingV3(
  config: WellbeingConfig = DEFAULT_CONFIG,
  userId?: string,
): Promise<WellbeingSnapshotV3> {
  const raw = await loadWellbeingRaw(userId);
  return computeWellbeingV3(raw, config);
}
