import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BridgeState =
  | "searching"
  | "assigned"
  | "coordinating"
  | "concretized"
  | "failed";

export interface Professional {
  name?: string | null;
  phone?: string | null;
  email?: string | null;
  license?: string | null;
  specialty?: string | null;
}

export interface TherapyStatus {
  found: boolean;
  state?: BridgeState;
  professional?: Professional | null;
  assignedAt?: string | null;
  contactDeadline?: string | null;
  raw?: any;
}

interface Options {
  enabled?: boolean;
  intervalMs?: number;
}

export function useTherapyStatus(
  phone: string | null | undefined,
  { enabled = true, intervalMs = 60_000 }: Options = {},
) {
  const [data, setData] = useState<TherapyStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("bridge-proxy", {
        body: { action: "status", payload: { phone } },
      });
      if (error) throw error;
      const payload = (res ?? {}) as any;
      setData({
        found: !!payload.found,
        state: payload.state,
        professional: payload.professional ?? null,
        assignedAt: payload.assigned_at ?? null,
        contactDeadline: payload.contact_deadline ?? null,
        raw: payload,
      });
      setError(null);
    } catch (e: any) {
      setError(e?.message ?? "bridge_error");
    } finally {
      setLoading(false);
    }
  }, [phone]);

  useEffect(() => {
    if (!enabled || !phone) return;
    fetchStatus();
    timerRef.current = window.setInterval(fetchStatus, intervalMs);
    const onVis = () => { if (document.visibilityState === "visible") fetchStatus(); };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [enabled, phone, intervalMs, fetchStatus]);

  return { data, loading, error, refetch: fetchStatus };
}
