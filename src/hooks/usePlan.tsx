import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type Plan = "free" | "premium";

export function usePlan() {
  const { user } = useAuth();
  const [plan, setPlan] = useState<Plan>("free");
  const [planStartedAt, setPlanStartedAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    const { data } = await supabase
      .from("patient_app_profiles")
      .select("plan, plan_started_at")
      .eq("user_id", user.id)
      .maybeSingle();
    setPlan(((data?.plan as Plan) ?? "free") as Plan);
    setPlanStartedAt(data?.plan_started_at ?? null);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setUserPlan = useCallback(
    async (next: Plan) => {
      if (!user) return;
      setPlan(next);
      const startedAt = next === "premium" ? new Date().toISOString() : null;
      setPlanStartedAt(startedAt);
      await supabase
        .from("patient_app_profiles")
        .upsert(
          { user_id: user.id, plan: next, plan_started_at: startedAt },
          { onConflict: "user_id" }
        );
    },
    [user]
  );

  return { plan, planStartedAt, loading, setPlan: setUserPlan, refresh };
}
