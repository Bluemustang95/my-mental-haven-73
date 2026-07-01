import { createClient } from "npm:@supabase/supabase-js@2";
import { sendFcm } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Resolve current local time for an arbitrary IANA timezone using Intl.
function nowInTz(tz: string): { hhmm: string; date: string } {
  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: tz,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(now).map((p) => [p.type, p.value]));
  const hh = parts.hour === "24" ? "00" : parts.hour;
  return { hhmm: `${hh}:${parts.minute}`, date: `${parts.year}-${parts.month}-${parts.day}` };
}

function isQuiet(hhmm: string, start: string, end: string): boolean {
  // quiet window may wrap past midnight
  const t = hhmm;
  if (start <= end) return t >= start && t <= end;
  return t >= start || t <= end;
}

async function dispatchOne(
  admin: ReturnType<typeof createClient>,
  userId: string,
  kind: string,
  title: string,
  body: string,
  url: string,
  today: string,
) {
  const { data: tokens } = await admin.from("device_tokens").select("token").eq("user_id", userId);
  if (!tokens?.length) return 0;

  // Dedupe: skip if already sent today for this kind
  const { count } = await admin
    .from("notification_log")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("kind", kind)
    .gte("sent_at", `${today}T00:00:00`);
  if ((count ?? 0) > 0) return 0;

  let ok = 0;
  const stale: string[] = [];
  for (const t of tokens) {
    const r = await sendFcm({ token: t.token, title, body, data: { kind, url } });
    if (r.ok) ok++;
    else if (r.status === 404 || r.status === 400) stale.push(t.token);
  }
  if (stale.length) await admin.from("device_tokens").delete().in("token", stale);
  await admin.from("notification_log").insert({
    user_id: userId,
    kind,
    title,
    body,
    data: { url },
    status: ok > 0 ? "sent" : "failed",
  });
  return ok;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Load all users with push enabled
    const { data: prefs } = await admin
      .from("notification_preferences")
      .select("user_id, push_enabled, checkin_enabled, checkin_time, medication_enabled, habits_enabled, quiet_hours_start, quiet_hours_end, timezone");

    let sent = 0;
    for (const p of prefs ?? []) {
      if (p.push_enabled === false) continue;
      const tz = (p as any).timezone || "America/Argentina/Buenos_Aires";
      const { hhmm, date } = nowInTz(tz);
      const quietStart = (p.quiet_hours_start ?? "22:30").slice(0, 5);
      const quietEnd = (p.quiet_hours_end ?? "07:30").slice(0, 5);
      const inQuiet = isQuiet(hhmm, quietStart, quietEnd);

      // 1) Daily check-in
      const checkinTime = (p.checkin_time ?? "09:00").slice(0, 5);
      if (p.checkin_enabled !== false && hhmm === checkinTime && !inQuiet) {
        const { count } = await admin
          .from("daily_checkins")
          .select("id", { count: "exact", head: true })
          .eq("user_id", p.user_id)
          .eq("checkin_date", date);
        if (!count) {
          sent += await dispatchOne(
            admin, p.user_id, "checkin",
            "Tu check-in de hoy ☀️",
            "Tomate 1 minuto para registrar cómo estás.",
            "/dashboard", date,
          );
        }
      }

      // 2) Habits at scheduled time
      if (p.habits_enabled !== false && !inQuiet) {
        const { data: habitsDue } = await admin
          .from("habits")
          .select("id, name, reminder_time")
          .eq("user_id", p.user_id)
          .eq("reminder_time", `${hhmm}:00`);
        for (const h of habitsDue ?? []) {
          const { count } = await admin
            .from("habit_completions")
            .select("id", { count: "exact", head: true })
            .eq("habit_id", h.id)
            .eq("completed_date", date);
          if (!count) {
            sent += await dispatchOne(
              admin, p.user_id, `habit:${h.id}`,
              "Es hora de tu hábito 🌱",
              h.name || "Recordá tu hábito de hoy.",
              "/habitos", date,
            );
          }
        }
      }

      // 3) Medication at scheduled time (supports schedule[] or reminder_time)
      if (p.medication_enabled !== false && !inQuiet) {
        const { data: meds } = await admin
          .from("medications")
          .select("id, name, schedule, reminder_time")
          .eq("user_id", p.user_id);
        for (const m of meds ?? []) {
          const scheduleArr: string[] = Array.isArray(m.schedule)
            ? (m.schedule as any[]).map(String)
            : Array.isArray((m.schedule as any)?.times)
              ? ((m.schedule as any).times as any[]).map(String)
              : [];
          const times = scheduleArr.length
            ? scheduleArr
            : (m as any).reminder_time
              ? [String((m as any).reminder_time)]
              : [];
          if (!times.map((t) => t.slice(0, 5)).includes(hhmm)) continue;
          sent += await dispatchOne(
            admin, p.user_id, `med:${m.id}:${hhmm}`,
            "Recordatorio de medicación 💊",
            m.name || "Es hora de tu medicación.",
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
