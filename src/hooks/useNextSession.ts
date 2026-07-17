import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export interface NextSessionInfo {
  nextSessionAt: Date | null;
  weeklyRecurring: boolean;
  loading: boolean;
}

/**
 * Reads next_session_at from patient_app_profiles.
 * Also triggers `roll_next_session_forward` RPC to auto-advance stale sessions.
 */
export function useNextSession(): NextSessionInfo {
  const { user } = useAuth();
  const [nextSessionAt, setNextSessionAt] = useState<Date | null>(null);
  const [weeklyRecurring, setWeeklyRecurring] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLoading(false); return; }
      try { await supabase.rpc("roll_next_session_forward" as any); } catch { /* noop */ }
      const { data } = await supabase
        .from("patient_app_profiles")
        .select("next_session_at, session_weekly_recurring")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      setNextSessionAt(data?.next_session_at ? new Date(data.next_session_at) : null);
      setWeeklyRecurring(!!data?.session_weekly_recurring);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  return { nextSessionAt, weeklyRecurring, loading };
}

export interface SendWindow {
  /** true if now is within [next - 24h, next]. */
  inWindow: boolean;
  /** true if there is a session scheduled. */
  hasSession: boolean;
  nextSessionAt: Date | null;
  loading: boolean;
}

export function useSendSummaryWindow(): SendWindow {
  const { nextSessionAt, loading } = useNextSession();
  const now = Date.now();
  const nextTs = nextSessionAt?.getTime() ?? 0;
  const inWindow = !!nextSessionAt && now >= nextTs - 24 * 3600 * 1000 && now <= nextTs;
  return { inWindow, hasSession: !!nextSessionAt, nextSessionAt, loading };
}
