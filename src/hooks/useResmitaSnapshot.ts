import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type ResmitaSnapshot = {
  allowed: boolean;
  last_checkin?: { mood: number; sleep: number; date: string } | null;
  mood_trend_7d?: "improving" | "stable" | "declining" | null;
  streak_days?: number;
  active_medications?: number;
  open_thought_record?: boolean;
  last_test?: { type: string; severity: string; date: string } | null;
};

const CACHE = new Map<string, { data: ResmitaSnapshot; ts: number }>();
const TTL_MS = 5 * 60 * 1000;

export function useResmitaSnapshot(enabled: boolean) {
  const { user } = useAuth();
  const [snapshot, setSnapshot] = useState<ResmitaSnapshot | null>(null);

  useEffect(() => {
    if (!enabled || !user) { setSnapshot(null); return; }
    const cached = CACHE.get(user.id);
    if (cached && Date.now() - cached.ts < TTL_MS) {
      setSnapshot(cached.data);
      return;
    }
    (async () => {
      const { data, error } = await supabase.rpc("get_resmita_user_snapshot" as any);
      if (error || !data) { setSnapshot({ allowed: false }); return; }
      const s = data as ResmitaSnapshot;
      CACHE.set(user.id, { data: s, ts: Date.now() });
      setSnapshot(s);
    })();
  }, [enabled, user]);

  return snapshot;
}

export function buildSnapshotSummary(s: ResmitaSnapshot | null): string | null {
  if (!s || !s.allowed) return null;
  const parts: string[] = [];
  if (s.last_checkin) parts.push(`último ánimo ${s.last_checkin.mood}/5 (${s.last_checkin.date})`);
  if (s.mood_trend_7d) parts.push(`tendencia 7d: ${s.mood_trend_7d}`);
  if (s.streak_days) parts.push(`racha ${s.streak_days} días`);
  if (s.active_medications) parts.push(`${s.active_medications} medicación(es) activa(s)`);
  if (s.open_thought_record) parts.push("tiene un pensamiento CBT abierto");
  if (s.last_test) parts.push(`último test ${s.last_test.type}: ${s.last_test.severity}`);
  return parts.length ? parts.join(" · ") : null;
}
