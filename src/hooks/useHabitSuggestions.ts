import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type HabitSuggestion = {
  id: string;
  category_key: string;
  title: string;
  description: string | null;
  icon: string;
  icon_type: string;
  color: string;
  sort_order: number;
  active: boolean;
};

export function useHabitSuggestions(opts: { includeInactive?: boolean } = {}) {
  const [suggestions, setSuggestions] = useState<HabitSuggestion[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from("habit_suggestions" as never)
      .select("*")
      .order("category_key", { ascending: true })
      .order("sort_order", { ascending: true });
    if (!opts.includeInactive) q = q.eq("active", true);
    const { data } = await q;
    setSuggestions(((data as unknown) as HabitSuggestion[]) ?? []);
    setLoading(false);
  }, [opts.includeInactive]);

  useEffect(() => { refresh(); }, [refresh]);

  return { suggestions, loading, refresh };
}
