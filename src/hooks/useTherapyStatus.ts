import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type BridgeState =
  | "searching"
  | "assigned"
  | "coordinating"
  | "concretized"
  | "failed";

export interface Professional {
  full_name?: string | null;
  /** legacy alias, still emitted by bridge for compat */
  name?: string | null;
  license?: string | null;
  specialty?: string | null;
  phone?: string | null;
  email?: string | null;
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
  const lastPersistedRef = useRef<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!phone) return;
    setLoading(true);
    try {
      const { data: res, error } = await supabase.functions.invoke("bridge-proxy", {
        body: { action: "status", payload: { phone } },
      });
      if (error) throw error;
      const payload = (res ?? {}) as any;
      const pro: Professional | null = payload.professional ?? null;
      const status: TherapyStatus = {
        found: !!payload.found,
        state: payload.state,
        professional: pro,
        assignedAt: payload.assigned_at ?? null,
        contactDeadline: payload.contact_deadline ?? null,
        raw: payload,
      };
      setData(status);
      setError(null);

      // Persist professional data + state into patient_app_profiles for cold-render.
      // ONLY read from bridge; never mutate RESMA+ from here.
      if (pro && (status.state === "assigned" || status.state === "coordinating" || status.state === "concretized")) {
        const fullName = pro.full_name ?? pro.name ?? null;
        const snapshot = JSON.stringify({
          fullName, phone: pro.phone ?? null, email: pro.email ?? null,
          license: pro.license ?? null, state: status.state,
        });
        if (snapshot !== lastPersistedRef.current) {
          lastPersistedRef.current = snapshot;
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            await supabase
              .from("patient_app_profiles")
              .update({
                bridge_last_state: status.state,
                therapist_name: fullName,
                therapist_phone: pro.phone ?? null,
                therapist_email: pro.email ?? null,
                therapist_license: pro.license ?? null,
              })
              .eq("user_id", user.id);
          }
        }
      }
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
