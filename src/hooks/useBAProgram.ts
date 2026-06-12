import { useEffect, useRef, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { BAProgram } from "@/lib/baTypes";

export function useBAProgram() {
  const { user } = useAuth();
  const [program, setProgram] = useState<BAProgram | null>(null);
  const [loading, setLoading] = useState(true);
  const saveTimer = useRef<number | null>(null);

  const fetchProgram = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("ba_programs" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();
    setProgram((data as any) ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchProgram();
  }, [fetchProgram]);

  const create = useCallback(async (): Promise<BAProgram | null> => {
    if (!user) return null;
    const { data } = await supabase
      .from("ba_programs" as any)
      .insert({ user_id: user.id, state: "day1", current_day: 1, day_one_step: 0 })
      .select()
      .maybeSingle();
    const p = (data as any) ?? null;
    if (p) setProgram(p);
    return p;
  }, [user]);

  const update = useCallback(
    (patch: Partial<BAProgram>) => {
      if (!program) return;
      const next = { ...program, ...patch };
      setProgram(next);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      saveTimer.current = window.setTimeout(async () => {
        await supabase.from("ba_programs" as any).update(patch).eq("id", program.id);
      }, 600);
    },
    [program]
  );

  const flush = useCallback(
    async (patch: Partial<BAProgram>) => {
      if (!program) return;
      const next = { ...program, ...patch };
      setProgram(next);
      if (saveTimer.current) window.clearTimeout(saveTimer.current);
      await supabase.from("ba_programs" as any).update(patch).eq("id", program.id);
    },
    [program]
  );

  return { program, loading, create, update, flush, refetch: fetchProgram };
}
