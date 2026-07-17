import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";

export type TodayCompletion = {
  sleep_zone: boolean;
  mini_habits: boolean;
  diario_quick: boolean;
  mindfulness_quick: boolean;
  pensamientos_quick: boolean;
  pack_quick: boolean;
  psico_quick: boolean;
  gratitude: boolean;
  contention_notes: boolean;
};

const empty: TodayCompletion = {
  sleep_zone: false,
  mini_habits: false,
  diario_quick: false,
  mindfulness_quick: false,
  pensamientos_quick: false,
  pack_quick: false,
  psico_quick: false,
  gratitude: false,
  contention_notes: false,
};

async function has(promise: Promise<{ data: any[] | null }>): Promise<boolean> {
  const { data } = await promise;
  return (data ?? []).length > 0;
}

/** Consulta batch única de "¿el usuario completó X hoy?" para cada widget. */
export function useTodayCompletion(refreshKey: number = 0) {
  const { user } = useAuth();
  const [state, setState] = useState<TodayCompletion>(empty);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    const today = localDateStr();
    const startISO = new Date(`${today}T00:00:00`).toISOString();

    (async () => {
      const [sleep, habits, journal, mindful, thoughts, pack, psico] = await Promise.all([
        has(
          supabase
            .from("sleep_log")
            .select("id")
            .eq("user_id", user.id)
            .eq("log_date", today)
            .limit(1) as any,
        ),
        has(
          supabase
            .from("habit_completions")
            .select("id")
            .eq("user_id", user.id)
            .eq("completed_date", today)
            .limit(1) as any,
        ),
        has(
          supabase
            .from("journal_entries")
            .select("id")
            .eq("user_id", user.id)
            .eq("entry_date", today)
            .limit(1) as any,
        ),
        has(
          supabase
            .from("exercise_sessions")
            .select("id")
            .eq("user_id", user.id)
            .in("exercise_type", ["mindfulness", "breathing"])
            .gte("created_at", startISO)
            .limit(1) as any,
        ),
        has(
          supabase
            .from("thought_records")
            .select("id")
            .eq("user_id", user.id)
            .gte("created_at", startISO)
            .limit(1) as any,
        ),
        has(
          supabase
            .from("ba_day_logs")
            .select("id")
            .eq("user_id", user.id)
            .gte("created_at", startISO)
            .limit(1) as any,
        ),
        has(
          supabase
            .from("content_progress")
            .select("id")
            .eq("user_id", user.id)
            .gte("last_accessed", startISO)
            .limit(1) as any,
        ),
      ]);

      // Gratitude / contention se guardan como journal_entries con prompt.
      const gratitudePromise = supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .eq("prompt", "Gratitud")
        .limit(1);
      const contentionPromise = supabase
        .from("journal_entries")
        .select("id")
        .eq("user_id", user.id)
        .eq("entry_date", today)
        .eq("prompt", "Contención")
        .limit(1);
      const [gratitude, contention] = await Promise.all([
        has(gratitudePromise as any),
        has(contentionPromise as any),
      ]);

      if (cancelled) return;
      setState({
        sleep_zone: sleep,
        mini_habits: habits,
        diario_quick: journal,
        mindfulness_quick: mindful,
        pensamientos_quick: thoughts,
        pack_quick: pack,
        psico_quick: psico,
        gratitude,
        contention_notes: contention,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, refreshKey]);

  return state;
}
