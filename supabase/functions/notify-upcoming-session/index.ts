import { createClient } from "npm:@supabase/supabase-js@2";
import { sendFcm } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const TZ = "America/Argentina/Buenos_Aires";

interface Profile {
  user_id: string;
  next_session_at: string;
  therapist_name: string | null;
  last_session_notification_at: string | null;
  session_day_notification_at: string | null;
  session_day_notification_hour: number | null;
}

function localParts(date: Date) {
  // Returns { ymd: "YYYY-MM-DD", hour: number } for the AR timezone.
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TZ,
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    ymd: `${get("year")}-${get("month")}-${get("day")}`,
    hour: parseInt(get("hour"), 10),
  };
}

async function getUserContext(admin: ReturnType<typeof createClient>, userId: string, now: Date) {
  const { data: prefs } = await admin
    .from("notification_preferences")
    .select("push_enabled, therapist_enabled, paused_until")
    .eq("user_id", userId)
    .maybeSingle();
  if (prefs) {
    if (prefs.push_enabled === false) return null;
    if (prefs.therapist_enabled === false) return null;
    if (prefs.paused_until && new Date(prefs.paused_until as string) > now) return null;
  }
  const { data: tokens } = await admin
    .from("device_tokens")
    .select("token")
    .eq("user_id", userId)
    .eq("invalid", false);
  return { tokens: tokens ?? [] };
}

async function dispatchPush(
  admin: ReturnType<typeof createClient>,
  userId: string,
  tokens: { token: string }[],
  title: string,
  body: string,
  data: Record<string, string>,
) {
  let ok = 0;
  for (const t of tokens) {
    const r = await sendFcm({ token: t.token, title, body, data });
    if (r.ok) { ok++; continue; }
    if (r.status === 404 || r.status === 400) {
      await admin.from("device_tokens").update({
        invalid: true, last_error: `fcm_${r.status}`, last_error_at: new Date().toISOString(),
      }).eq("token", t.token);
    }
  }
  return { ok, statusLabel: ok > 0 ? "sent" : (tokens.length ? "failed" : "no_token") };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    const today = now.toISOString().slice(0, 10);
    const local = localParts(now);

    // Fetch candidates: sessions in the next ~25h (covers both 24h-ahead and same-day windows).
    const upperFetch = new Date(now.getTime() + 25 * 3600 * 1000).toISOString();
    const { data: candidates, error } = await admin
      .from("patient_app_profiles")
      .select("user_id, next_session_at, therapist_name, last_session_notification_at, session_day_notification_at, session_day_notification_hour")
      .gte("next_session_at", now.toISOString())
      .lte("next_session_at", upperFetch);

    if (error) throw error;

    let dispatched24 = 0;
    let dispatchedDay = 0;

    for (const row of (candidates ?? []) as Profile[]) {
      const nextAt = new Date(row.next_session_at);
      const nextLocal = localParts(nextAt);
      const msUntil = nextAt.getTime() - now.getTime();

      // --- 24h-before reminder: window 23h45m–24h15m before session. ---
      const in24hWindow = msUntil >= (23 * 3600 + 45 * 60) * 1000
                       && msUntil <= (24 * 3600 + 15 * 60) * 1000;
      // Anti-duplicate: last_session_notification_at must be older than cutoff (nextAt - 24h).
      const cutoff = new Date(nextAt.getTime() - 24 * 3600 * 1000);
      const alreadyNotified24 = row.last_session_notification_at
        && new Date(row.last_session_notification_at) >= cutoff;

      // --- Same-day reminder: session is today (AR) and current local hour ≥ configured hour. ---
      const configuredHour = row.session_day_notification_hour ?? 9;
      const sameDay = nextLocal.ymd === local.ymd
                   && local.hour >= configuredHour
                   && msUntil > 0;
      // Anti-duplicate: only once per session — check we didn't already fire since (nextAt - 24h).
      const alreadyNotifiedDay = row.session_day_notification_at
        && new Date(row.session_day_notification_at) >= cutoff;

      const wants24 = in24hWindow && !alreadyNotified24;
      const wantsDay = sameDay && !alreadyNotifiedDay;

      if (!wants24 && !wantsDay) continue;

      const ctx = await getUserContext(admin, row.user_id, now);
      if (!ctx) continue;

      const proFirst = (row.therapist_name ?? "").trim().split(/\s+/)[0] || "tu profesional";
      const timeLabel = new Intl.DateTimeFormat("es-AR", {
        timeZone: TZ, hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(nextAt);
      const url = "/mi-proceso/resumen";

      if (wants24) {
        const title = `Sesión mañana con ${proFirst}`;
        const body = `A las ${timeLabel}. ¿Preparamos tu resumen para el psico?`;
        const { ok, statusLabel } = await dispatchPush(admin, row.user_id, ctx.tokens, title, body, { kind: "upcoming_session", url });
        await admin.from("notification_log").insert({
          user_id: row.user_id,
          kind: "upcoming_session",
          reason: "upcoming_session",
          target_key: row.next_session_at,
          log_date: today,
          title, body, data: { url },
          status: statusLabel,
          delivery_status: statusLabel,
        });
        await admin
          .from("patient_app_profiles")
          .update({ last_session_notification_at: new Date().toISOString() })
          .eq("user_id", row.user_id);
        dispatched24 += ok;
      }

      if (wantsDay) {
        const title = `Hoy tenés sesión con ${proFirst}`;
        const body = `A las ${timeLabel}. Repasá tu resumen antes de entrar.`;
        const { ok, statusLabel } = await dispatchPush(admin, row.user_id, ctx.tokens, title, body, { kind: "session_day", url });
        await admin.from("notification_log").insert({
          user_id: row.user_id,
          kind: "session_day",
          reason: "session_day",
          target_key: row.next_session_at,
          log_date: today,
          title, body, data: { url },
          status: statusLabel,
          delivery_status: statusLabel,
        });
        await admin
          .from("patient_app_profiles")
          .update({ session_day_notification_at: new Date().toISOString() })
          .eq("user_id", row.user_id);
        dispatchedDay += ok;
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      considered: candidates?.length ?? 0,
      dispatched_24h: dispatched24,
      dispatched_day_of: dispatchedDay,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("notify-upcoming-session error:", e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
