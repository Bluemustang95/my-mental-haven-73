import { createClient } from "npm:@supabase/supabase-js@2";
import { sendFcm } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface Profile {
  user_id: string;
  next_session_at: string;
  therapist_name: string | null;
  last_session_notification_at: string | null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const now = new Date();
    // Window: next_session_at is between now+23h45m and now+24h15m.
    const lower = new Date(now.getTime() + 23 * 3600 * 1000 + 45 * 60 * 1000).toISOString();
    const upper = new Date(now.getTime() + 24 * 3600 * 1000 + 15 * 60 * 1000).toISOString();

    const { data: candidates, error } = await admin
      .from("patient_app_profiles")
      .select("user_id, next_session_at, therapist_name, last_session_notification_at")
      .gte("next_session_at", lower)
      .lte("next_session_at", upper);

    if (error) throw error;

    let dispatched = 0;
    const today = now.toISOString().slice(0, 10);

    for (const row of (candidates ?? []) as Profile[]) {
      const nextAt = new Date(row.next_session_at);
      const cutoff = new Date(nextAt.getTime() - 24 * 3600 * 1000);
      // Skip if we already notified for THIS session (last notif >= cutoff).
      if (row.last_session_notification_at && new Date(row.last_session_notification_at) >= cutoff) {
        continue;
      }

      // User preferences (respect push_enabled / therapist_enabled).
      const { data: prefs } = await admin
        .from("notification_preferences")
        .select("push_enabled, therapist_enabled, paused_until")
        .eq("user_id", row.user_id)
        .maybeSingle();
      if (prefs) {
        if (prefs.push_enabled === false) continue;
        if (prefs.therapist_enabled === false) continue;
        if (prefs.paused_until && new Date(prefs.paused_until as string) > now) continue;
      }

      const { data: tokens } = await admin
        .from("device_tokens")
        .select("token")
        .eq("user_id", row.user_id)
        .eq("invalid", false);

      const proFirst = (row.therapist_name ?? "").trim().split(/\s+/)[0] || "tu profesional";
      // Local hour in America/Argentina/Buenos_Aires (default for this app).
      const timeLabel = new Intl.DateTimeFormat("es-AR", {
        timeZone: "America/Argentina/Buenos_Aires",
        hour: "2-digit", minute: "2-digit", hour12: false,
      }).format(nextAt);
      const title = `Sesión mañana con ${proFirst}`;
      const body = `A las ${timeLabel}. ¿Preparamos tu resumen para el psico?`;
      const url = "/mi-proceso/resumen";

      let ok = 0;
      for (const t of tokens ?? []) {
        const r = await sendFcm({ token: t.token, title, body, data: { kind: "upcoming_session", url } });
        if (r.ok) { ok++; continue; }
        if (r.status === 404 || r.status === 400) {
          await admin.from("device_tokens").update({
            invalid: true, last_error: `fcm_${r.status}`, last_error_at: new Date().toISOString(),
          }).eq("token", t.token);
        }
      }

      const statusLabel = ok > 0 ? "sent" : (tokens?.length ? "failed" : "no_token");
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

      dispatched += ok;
    }

    return new Response(JSON.stringify({ ok: true, dispatched, considered: candidates?.length ?? 0 }), {
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
