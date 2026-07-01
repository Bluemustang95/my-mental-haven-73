import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Legacy exports kept for backwards-compat (not used in new UI)
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
  { color: "#7c83f4", textColor: "#3b41a8" },
  { color: "#5bcf9e", textColor: "#1f7c52" },
  { color: "#94a3b8", textColor: "#475569" },
];
export const ICON_OPTIONS = ["📖", "☀️", "✍️", "🧘", "💧", "🏃", "🍎", "🛌", "📵", "💊"];

export type Habit = {
  id: string;
  name: string;
  description?: string | null;
  icon: string;
  icon_type?: string;
  value_key: string;
  category_key: string;
  color: string;
  text_color: string;
  frequency: string;
  frequency_count: number;
  time_slot: string;
  cadence: string;
  reminders_enabled: boolean;
  best_streak: number;
  stack_after_habit_id?: string | null;
  created_at: string;
};

export type Completion = {
  id: string;
  habit_id: string;
  completed_date: string;
  created_at: string;
};

export type HabitCategory = { id: string; key: string; label: string };

function localDateStr(d = new Date()): string {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

export type HabitInput = {
  name: string;
  description?: string;
  icon: string;
  icon_type?: "emoji" | "line";
  color: string;
  text_color: string;
  category_key: string;
  frequency?: string;
  frequency_count?: number;
  time_slot?: string;
  cadence?: string;
  reminders_enabled?: boolean;
  stack_after_habit_id?: string | null;
};

export function useHabits() {
  const { user } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [completions, setCompletions] = useState<Completion[]>([]);
  const [categories, setCategories] = useState<HabitCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    // Limit completions to the last 180 days for performance.
    const since = new Date(Date.now() - 180 * 86400000);
    const sinceStr = localDateStr(since);
    const [{ data: h }, { data: c }, { data: cats }] = await Promise.all([
      supabase.from("habits").select("*").eq("user_id", user.id).is("archived_at", null).order("created_at"),
      supabase.from("habit_completions").select("*").eq("user_id", user.id).gte("completed_date", sinceStr),
      supabase.from("habit_categories").select("*").eq("user_id", user.id),
    ]);
    setHabits((h ?? []) as unknown as Habit[]);
    setCompletions((c ?? []) as Completion[]);
    setCategories((cats ?? []) as HabitCategory[]);
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
      if (data) setCompletions(prev => prev.map(c => c.id === optimistic.id ? (data as Completion) : c));
    }
  }, [user, completions]);

  const create = useCallback(async (input: HabitInput) => {
    if (!user) return;
    const { data } = await supabase.from("habits").insert({
      user_id: user.id,
      name: input.name,
      description: input.description ?? null,
      icon: input.icon,
      icon_type: input.icon_type ?? "emoji",
      color: input.color,
      text_color: input.text_color,
      value_key: input.category_key,
      category_key: input.category_key,
      frequency: input.frequency ?? "daily",
      frequency_count: input.frequency_count ?? 1,
      time_slot: input.time_slot ?? "all",
      cadence: input.cadence ?? "every_day",
      reminders_enabled: input.reminders_enabled ?? false,
      stack_after_habit_id: input.stack_after_habit_id ?? null,
    }).select().single();
    if (data) setHabits(prev => [...prev, data as unknown as Habit]);
  }, [user]);

  const update = useCallback(async (id: string, patch: Partial<HabitInput>) => {
    if (!user) return;
    const { data } = await supabase.from("habits").update(patch).eq("id", id).select().single();
    if (data) setHabits(prev => prev.map(h => h.id === id ? (data as unknown as Habit) : h));
  }, [user]);

  const remove = useCallback(async (habitId: string) => {
    if (!user) return;
    await supabase.from("habits").delete().eq("id", habitId);
    setHabits(prev => prev.filter(h => h.id !== habitId));
    setCompletions(prev => prev.filter(c => c.habit_id !== habitId));
  }, [user]);

  const addCategory = useCallback(async (label: string) => {
    if (!user) return;
    const key = label.toLowerCase().replace(/[^a-z0-9]+/g, "_").slice(0, 32);
    const { data } = await supabase
      .from("habit_categories")
      .insert({ user_id: user.id, key, label })
      .select()
      .single();
    if (data) setCategories(prev => [...prev, data as HabitCategory]);
    return key;
  }, [user]);

  return {
    habits, completions, categories, loading,
    toggle, create, update, remove, addCategory,
    refetch: fetchAll, todayStr: localDateStr(),
  };
}


export function computeStreak(completions: Completion[], habitId: string): number {
  // Racha con "perdón": 1 día perdido cada 7 no rompe la racha (James Clear).
  const dates = new Set(completions.filter(c => c.habit_id === habitId).map(c => c.completed_date));
  if (dates.size === 0) return 0;
  let streak = 0;
  let forgivenessLeft = 1;
  let daysWindow = 0;
  const d = new Date();
  const today = localDateStr();
  for (let i = 0; i < 365; i++) {
    const s = localDateStr(d);
    // reset forgiveness cada 7 días de ventana
    if (daysWindow > 0 && daysWindow % 7 === 0) forgivenessLeft = 1;
    if (dates.has(s)) {
      streak++;
      daysWindow++;
      d.setDate(d.getDate() - 1);
    } else {
      // Hoy sin marcar → gracia inicial
      if (streak === 0 && s === today) {
        d.setDate(d.getDate() - 1);
        continue;
      }
      // Usar perdón semanal
      if (forgivenessLeft > 0 && streak > 0) {
        forgivenessLeft--;
        daysWindow++;
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
