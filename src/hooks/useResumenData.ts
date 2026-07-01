import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { subDays, startOfDay } from "date-fns";

export interface ResumenData {
  displayName: string;
  checkins: { id: string; date: string; mood: number | null; note: string | null; emotions: string[] | null }[];
  prepNotes: { id: string; note: string; created_at: string }[];
  sessionNotes: { id: string; note: string; session_date: string }[];
  tests: { id: string; type: string; score: number; severity: string | null; created_at: string }[];
  exerciseSessions: number;
  habitCompletions: number;
  dbtSessions: number;
  thoughtRecords: number;
  medicationLogs: { total: number; taken: number };
  goals: { id: string; text: string; completed: boolean }[];
  journal: { id: string; date: string; content: string; prompt: string | null }[];
}

export function useResumenData() {
  const { user } = useAuth();
  const [data, setData] = useState<ResumenData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      setLoading(true);
      const since = startOfDay(subDays(new Date(), 7)).toISOString();

      const [
        profileRes, checkinsRes, prepRes, sessRes, testsRes,
        exRes, habitRes, dbtRes, thoughtRes, medRes, goalsRes, journalRes,
      ] = await Promise.all([
        supabase.from("patient_app_profiles").select("display_name").eq("user_id", user.id).maybeSingle(),
        supabase.from("daily_checkins").select("id, checkin_date, mood_score, note, emotions").eq("user_id", user.id).gte("created_at", since).order("checkin_date", { ascending: true }),
        supabase.from("therapy_prep_notes").select("id, note, created_at").eq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("session_notes").select("id, note, session_date").eq("user_id", user.id).gte("created_at", since).order("session_date", { ascending: false }),
        supabase.from("test_results").select("id, test_type, score, severity, created_at").eq("user_id", user.id).gte("created_at", since).order("created_at", { ascending: false }),
        supabase.from("exercise_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
        supabase.from("habit_completions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
        supabase.from("dbt_emotion_sessions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
        supabase.from("thought_records").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
        supabase.from("medication_logs").select("taken").eq("user_id", user.id).gte("created_at", since),
        supabase.from("weekly_goals").select("id, goal_text, completed").eq("user_id", user.id).gte("created_at", since),
        supabase.from("journal_entries").select("id, entry_date, content, prompt, created_at").eq("user_id", user.id).eq("highlighted", true).gte("created_at", since).order("created_at", { ascending: false }),
      ]);

      const medLogs = medRes.data ?? [];
      setData({
        displayName: profileRes.data?.display_name || "Paciente",
        checkins: (checkinsRes.data ?? []).map(c => ({ id: c.id, date: c.checkin_date, mood: c.mood_score, note: c.note, emotions: c.emotions })),
        prepNotes: prepRes.data ?? [],
        sessionNotes: sessRes.data ?? [],
        tests: (testsRes.data ?? []).map(t => ({ id: t.id, type: t.test_type, score: t.score, severity: t.severity, created_at: t.created_at! })),
        exerciseSessions: exRes.count ?? 0,
        habitCompletions: habitRes.count ?? 0,
        dbtSessions: dbtRes.count ?? 0,
        thoughtRecords: thoughtRes.count ?? 0,
        medicationLogs: { total: medLogs.length, taken: medLogs.filter(m => m.taken).length },
        goals: (goalsRes.data ?? []).map(g => ({ id: g.id, text: g.goal_text, completed: !!g.completed })),
        journal: (journalRes.data ?? []).map(j => ({ id: j.id, date: (j.entry_date || j.created_at!) as string, content: j.content, prompt: j.prompt })),
      });
      setLoading(false);
    })();
  }, [user]);

  return { data, loading };
}
