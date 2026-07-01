// Runtime anti-fatigue notification engine.
// Reads rules from public.notification_rules (configured by admin) and decides
// what to surface to the user as a soft in-app toast, respecting:
//  - Max 1 notification per session
//  - Max 1 per category per day
//  - Skip if user already completed the related action today
//  - Quiet hours (22:30 - 07:30 local) for non-circadian categories

import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";

export type EvaluatedNotif = {
  id: string;             // `${category}.${trigger_key}`
  category: string;
  title: string;
  body: string;
};

type Rule = {
  category: string;
  trigger_key: string;
  enabled: boolean;
  copy_text: string;
};

const SHOWN_KEY = "resma_notif_shown_v1"; // { "cat.key": "YYYY-MM-DD" }
const SESSION_KEY = "resma_notif_session_v1";

function getShownMap(): Record<string, string> {
  try { return JSON.parse(localStorage.getItem(SHOWN_KEY) || "{}"); } catch { return {}; }
}
function markShown(id: string) {
  const m = getShownMap();
  m[id] = localDateStr(new Date());
  localStorage.setItem(SHOWN_KEY, JSON.stringify(m));
  sessionStorage.setItem(SESSION_KEY, "1");
}
function alreadyShownToday(id: string): boolean {
  return getShownMap()[id] === localDateStr(new Date());
}
function shownThisSession(): boolean {
  return sessionStorage.getItem(SESSION_KEY) === "1";
}

function inQuietHours(): boolean {
  const h = new Date().getHours();
  const m = new Date().getMinutes();
  const t = h * 60 + m;
  return t >= 22 * 60 + 30 || t <= 7 * 60 + 30;
}

/**
 * Evaluate which notification (if any) to surface for the current user.
 * Returns null when there's nothing to show.
 */
export async function evaluateNextNotification(): Promise<EvaluatedNotif | null> {
  if (shownThisSession()) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: rulesData } = await supabase
    .from("notification_rules")
    .select("category, trigger_key, enabled, copy_text")
    .eq("enabled", true);

  const rules = (rulesData ?? []) as Rule[];
  if (!rules.length) return null;

  const today = localDateStr(new Date());
  const ago = (d: number) => new Date(Date.now() - d * 86400000).toISOString();

  // Single batched fetch of behavior signals we need.
  const [checkins, habitsLast, lastTest, lastJournal] = await Promise.all([
    supabase.from("daily_checkins")
      .select("checkin_date, mode")
      .eq("user_id", user.id)
      .gte("checkin_date", localDateStr(new Date(Date.now() - 7 * 86400000))),
    supabase.from("habit_completions")
      .select("completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", localDateStr(new Date(Date.now() - 6 * 86400000)))
      .order("completed_date", { ascending: false })
      .limit(1),
    supabase.from("test_results")
      .select("created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase.from("journal_entries")
      .select("created_at")
      .eq("user_id", user.id)
      .gte("created_at", ago(7))
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const ci = checkins.data ?? [];
  const morningToday = ci.some((c: any) => c.checkin_date === today && (c.mode === "morning" || !c.mode));
  const nightToday = ci.some((c: any) => c.checkin_date === today && c.mode === "night");
  const anyActivityToday = morningToday || nightToday || (lastJournal.data?.[0]?.created_at?.startsWith(today) ?? false);

  const lastCheckin = ci[0]?.checkin_date ?? null;
  const daysSinceCheckin = lastCheckin
    ? Math.floor((Date.now() - new Date(lastCheckin).getTime()) / 86400000)
    : 99;

  const lastHabit = habitsLast.data?.[0]?.completed_date ?? null;
  const daysSinceHabit = lastHabit
    ? Math.floor((Date.now() - new Date(lastHabit).getTime()) / 86400000)
    : 99;

  const lastTestAt = lastTest.data?.[0]?.created_at ?? null;
  const daysSinceTest = lastTestAt
    ? Math.floor((Date.now() - new Date(lastTestAt).getTime()) / 86400000)
    : 99;

  const hour = new Date().getHours();

  // Priority order: circadiana > vinculo > recaida > test_vencido > re_engagement.
  const find = (cat: string, key: string) => rules.find((r) => r.category === cat && r.trigger_key === key);

  const candidates: { rule?: Rule; ok: boolean; title: string }[] = [
    // Morning check-in (circadiana.amanecer): 7-11 AM and not done.
    {
      rule: find("circadiana", "amanecer"),
      ok: hour >= 7 && hour < 12 && !morningToday,
      title: "Buen día ☀️",
    },
    // Night close (circadiana.anochecer): 20-23h and not done.
    {
      rule: find("circadiana", "anochecer"),
      ok: hour >= 20 && hour < 24 && !nightToday,
      title: "Hora de cerrar el día 🌙",
    },
    // Habit relapse prevention: 3+ days without habits.
    {
      rule: find("habitos", "recaida"),
      ok: daysSinceHabit >= 3 && !inQuietHours(),
      title: "Volvamos al hábito 🌱",
    },
    // Test due: 14+ days since last test.
    {
      rule: find("psicometria", "test_vencido"),
      ok: daysSinceTest >= 14 && !inQuietHours(),
      title: "Actualicemos tus síntomas 📊",
    },
    // Re-engagement: 5+ days without any check-in.
    {
      rule: find("hibernacion", "re_engagement"),
      ok: daysSinceCheckin >= 5 && !anyActivityToday && !inQuietHours(),
      title: "Te extrañamos 💙",
    },
  ];

  for (const c of candidates) {
    if (!c.rule || !c.ok) continue;
    const id = `${c.rule.category}.${c.rule.trigger_key}`;
    if (alreadyShownToday(id)) continue;
    // Interpolate variables like {{dias}} in copy_text.
    const body = (c.rule.copy_text ?? "").replace(/\{\{\s*dias\s*\}\}/gi, () => {
      if (c.rule!.category === "psicometria") return String(daysSinceTest);
      if (c.rule!.category === "hibernacion") return String(daysSinceCheckin);
      if (c.rule!.category === "habitos") return String(daysSinceHabit);
      return "algunos";
    });
    return { id, category: c.rule.category, title: c.title, body };
  }

  return null;
}

export function acknowledgeNotification(id: string) {
  markShown(id);
}
