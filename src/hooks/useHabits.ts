import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export const VALUE_OPTIONS = [
  { key: "salud", label: "Salud / Autocuidado", emoji: "🧘" },
  { key: "crecimiento", label: "Crecimiento", emoji: "🌱" },
  { key: "relaciones", label: "Relaciones", emoji: "🤝" },
  { key: "ocio", label: "Ocio", emoji: "🎨" },
  { key: "espiritualidad", label: "Espiritualidad", emoji: "✨" },
] as const;

export const COLOR_OPTIONS = [
  { color: "#7cc2c8", textColor: "#3d8a90" },
  { color: "#facb60", textColor: "#92561a" },
  { color: "#f47b6f", textColor: "#a8392f" },
  { color: "#b794f4", textColor: "#6b46c1" },
  { color: "#7c83f4", textColor: "#3b41a8" },
];

export const ICON_OPTIONS = ["📖", "☀️", "✍️", "🧘", "💧", "🏃", "🍎", "🛌", "📵", "💊"];

export type Habit = {
  id: string;
  name: string;
  icon: string;
  value_key: string;
  color: string;
  text_color: string;
  best_streak: number;
  created_at: string;
};

export type Completion = {
  id: string;
  habit_id: string;
  completed_date: string; // YYYY-MM-DD
  created_at: string;
};

function localDateStr(d = new Date()): string {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: h }, { data: c }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).is("archived_at", null).order("created_at"),
      supabase.from("habit_completions").select("*").eq("user_id", user.id),
    ]);
    setHabits((h ?? []) as Habit[]);
    setCompletions((c ?? []) as Completion[]);
    setLoading(false);
  }, [user]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const toggle = useCallback(async (habitId: string, dateStr: string) => {
    if (!user) return;
    const existing = completions.find(c => c.habit_id === habitId && c.completed_date === dateStr);
    if (existing) {
      setCompletions(prev => prev.filter(c => c.id !== existing.id));
      await supabase.from("habit_completions").delete().eq("id", existing.id);
    } else {
      const optimistic: Completion = {
        id: `tmp-${Date.now()}`,
        habit_id: habitId,
        completed_date: dateStr,
        created_at: new Date().toISOString(),
      };
      setCompletions(prev => [...prev, optimistic]);
      const { data } = await supabase
        .from("habit_completions")
        .insert({ user_id: user.id, habit_id: habitId, completed_date: dateStr })
        .select()
        .single();
      if (data) {
        setCompletions(prev => prev.map(c => c.id === optimistic.id ? (data as Completion) : c));
      }
    }
  }, [user, completions]);

  const create = useCallback(async (input: { name: string; icon: string; value_key: string; color: string; text_color: string }) => {
    if (!user) return;
    const { data } = await supabase
      .from("habits")
      .insert({ ...input, user_id: user.id })
      .select()
      .single();
    if (data) setHabits(prev => [...prev, data as Habit]);
  }, [user]);

  const archive = useCallback(async (habitId: string) => {
    if (!user) return;
    await supabase.from("habits").update({ archived_at: new Date().toISOString() }).eq("id", habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
  }, [user]);

  return { habits, completions, loading, toggle, create, archive, refetch: fetchAll, todayStr: localDateStr() };
}

// streak helpers
export function computeStreak(completions: Completion[], habitId: string): number {
  const dates = new Set(completions.filter(c => c.habit_id === habitId).map(c => c.completed_date));
  let streak = 0;
  const d = new Date();
  while (true) {
    const s = localDateStr(d);
    if (dates.has(s)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      // allow today not marked yet
      if (streak === 0 && s === localDateStr()) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      break;
    }
  }
  return streak;
}

export function computeBestStreak(completions: Completion[], habitId: string): number {
  const dates = [...new Set(completions.filter(c => c.habit_id === habitId).map(c => c.completed_date))].sort();
  let best = 0, cur = 0;
  let prev: Date | null = null;
  for (const d of dates) {
    const cd = new Date(d + "T00:00:00");
    if (prev && (cd.getTime() - prev.getTime()) === 86400000) cur++;
    else cur = 1;
    best = Math.max(best, cur);
    prev = cd;
  }
  return best;
}

export { localDateStr };
