import { createClient } from "npm:@supabase/supabase-js@2";
import { sendFcm } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Resolve current local time+weekday for an arbitrary IANA timezone using Intl.
function nowInTz(tz: string): { hhmm: string; date: string; weekday: number } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", weekday: "short", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hh = parts.hour === "24" ? "00" : parts.hour;
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    hhmm: `${hh}:${parts.minute}`,
    date: `${parts.year}-${parts.month}-${parts.day}`,
    weekday: map[parts.weekday as string] ?? new Date().getUTCDay(),
  };
}

function isQuiet(hhmm: string, start: string, end: string): boolean {
  const t = hhmm;
  if (start <= end) return t >= start && t <= end;
  return t >= start || t <= end;
}

async function dispatchOne(
  admin: ReturnType<typeof createClient>,
  userId: string,
  reason: string,
  targetKey: string,
  title: string,
  body: string,
  url: string,
  today: string,
) {
  // Idempotency: skip if already sent today for this (reason, target_key).
  const { count: prevCount } = await admin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("reason", reason)
    .eq("target_key", targetKey)
    .eq("log_date", today);
  if ((prevCount ?? 0) > 0) return 0;

  const { data: tokens } = await admin
    .from("device_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("invalid", false);

  if (!tokens?.length) {
    await admin.from("notification_log").insert({
      user_id: userId, kind: reason, reason, target_key: targetKey, log_date: today,
      title, body, data: { url }, status: "no_token", delivery_status: "no_token",
    });
    return 0;
  }

  let ok = 0;
  for (const t of tokens) {
    const r = await sendFcm({ token: t.token, title, body, data: { kind: reason, url } });
    if (r.ok) { ok++; continue; }
    if (r.status === 404 || r.status === 400) {
      await admin.from("device_tokens").update({
        invalid: true, last_error: `fcm_${r.status}`, last_error_at: new Date().toISOString(),
      }).eq("token", t.token);
    } else {
      await admin.from("device_tokens").update({
        last_error: `fcm_${r.status}`, last_error_at: new Date().toISOString(),
      }).eq("token", t.token);
    }
  }
  const status = ok > 0 ? "sent" : "failed";
  await admin.from("notification_log").insert({
    user_id: userId, kind: reason, reason, target_key: targetKey, log_date: today,
    title, body, data: { url }, status, delivery_status: status,
  });
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Admin-editable copy from notification_rules
    const { data: rules } = await admin
      .from("notification_rules")
      .select("category, trigger_key, enabled, copy_text");
    const ruleMap = new Map<string, { enabled: boolean; body: string }>();
    (rules ?? []).forEach((r: unknown) => {
      const rr = r as { category: string; trigger_key: string; enabled: boolean; copy_text: string };
      ruleMap.set(`${rr.category}.${rr.trigger_key}`, { enabled: rr.enabled !== false, body: rr.copy_text });
    });
    const copyFor = (key: string, fallback: string) => {
      const r = ruleMap.get(key);
      if (r && !r.enabled) return null;
      return r?.body || fallback;
    };

    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("user_id, push_enabled, checkin_enabled, checkin_time, medication_enabled, habits_enabled, quiet_hours_start, quiet_hours_end, timezone, paused_until");

    const nowIso = new Date().toISOString();
    let sent = 0;
    for (const raw of prefs ?? []) {
      const p = raw as Record<string, unknown>;
      if (p.push_enabled === false) continue;
      if (p.paused_until && String(p.paused_until) > nowIso) continue;

      const tz = (p.timezone as string) || "America/Argentina/Buenos_Aires";
      const { hhmm, date, weekday } = nowInTz(tz);
      const quietStart = ((p.quiet_hours_start as string) ?? "22:30").slice(0, 5);
      const quietEnd = ((p.quiet_hours_end as string) ?? "07:30").slice(0, 5);
      const inQuiet = isQuiet(hhmm, quietStart, quietEnd);
      const userId = p.user_id as string;

      // 1) Daily check-in
      const checkinTime = ((p.checkin_time as string) ?? "09:00").slice(0, 5);
      if (p.checkin_enabled !== false && hhmm === checkinTime && !inQuiet) {
        const { count } = await admin
          .from("daily_checkins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", userId)
          .eq("checkin_date", date);
        if (!count) {
          const body = copyFor("checkin.daily", "Tomate 1 minuto para registrar cómo estás.");
          if (body) sent += await dispatchOne(
            admin, userId, "ritual", "checkin",
            "Tu check-in de hoy ☀️", body, "/dashboard", date,
          );
        }
      }

      // 2) Habits at scheduled time + weekday
      if (p.habits_enabled !== false && !inQuiet) {
        const { data: habitsDue } = await admin
          .from("habits")
          .select("id, name, reminder_time, reminder_days, reminders_enabled")
          .eq("user_id", userId)
          .eq("reminders_enabled", true)
          .eq("reminder_time", `${hhmm}:00`);
        for (const h of habitsDue ?? []) {
          const rec = h as { id: string; name: string; reminder_days: number[] | null };
          const days = rec.reminder_days ?? [0, 1, 2, 3, 4, 5, 6];
          if (!days.includes(weekday)) continue;
          const { count } = await admin
            .from("habit_completions")
            .select("id", { count: "exact", head: true })
            .eq("habit_id", rec.id)
            .eq("completed_date", date);
          if (!count) {
            sent += await dispatchOne(
              admin, userId, "habit", `habit:${rec.id}`,
              "Es hora de tu hábito 🌱",
              rec.name || "Recordá tu hábito de hoy.",
              "/habitos", date,
            );
          }
        }
      }

      // 3) Medication at scheduled time
      if (p.medication_enabled !== false && !inQuiet) {
        const { data: meds } = await admin
          .from("medications")
          .select("id, name, schedule, reminder_time")
          .eq("user_id", userId);
        for (const m of meds ?? []) {
          const rec = m as { id: string; name: string; schedule: unknown; reminder_time?: string };
          const scheduleArr: string[] = Array.isArray(rec.schedule)
            ? (rec.schedule as unknown[]).map(String)
            : Array.isArray((rec.schedule as { times?: unknown[] })?.times)
              ? ((rec.schedule as { times: unknown[] }).times).map(String)
              : [];
          const times = scheduleArr.length ? scheduleArr : rec.reminder_time ? [String(rec.reminder_time)] : [];
          if (!times.map((t) => t.slice(0, 5)).includes(hhmm)) continue;
          sent += await dispatchOne(
            admin, userId, "clinical", `med:${rec.id}:${hhmm}`,
            "Recordatorio de medicación 💊",
            rec.name || "Es hora de tu medicación.",
            "/mi-proceso", date,
          );
        }
      }
    }

    return new Response(JSON.stringify({ ok: true, sent }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
