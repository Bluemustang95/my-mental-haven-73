import { createClient } from "npm:@supabase/supabase-js@2";
import { sendFcm } from "../_shared/fcm.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type Body = {
  user_ids?: string[];
  segment?: { country?: string; plan?: "free" | "premium"; all?: boolean };
  title: string;
  body: string;
  url?: string;
  kind?: string;
  // optional internal call from cron-push-dispatcher
  internal_secret?: string;
};

async function isAdmin(supa: ReturnType<typeof createClient>, userId: string): Promise<boolean> {
  const { data } = await supa.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  return !!data;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  try {
    const payload = (await req.json()) as Body;
    if (!payload?.title || !payload?.body) {
      return new Response(JSON.stringify({ error: "title and body required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const admin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Allow either: admin user (auth header) OR internal secret from cron dispatcher.
    const internalOk =
      !!payload.internal_secret &&
      payload.internal_secret === Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!internalOk) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
      const supa = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
        global: { headers: { Authorization: authHeader } },
      });
      const { data: claims } = await supa.auth.getClaims(authHeader.replace("Bearer ", ""));
      const userId = claims?.claims?.sub as string | undefined;
      if (!userId || !(await isAdmin(admin, userId))) {
        return new Response(JSON.stringify({ error: "Forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }
    }

    // Resolve target user ids
    let targetUserIds: string[] = [];
    if (payload.user_ids?.length) {
      targetUserIds = payload.user_ids;
    } else if (payload.segment) {
      let q = admin.from("patient_app_profiles").select("user_id");
      if (payload.segment.country) q = q.eq("country", payload.segment.country);
      if (payload.segment.plan) q = q.eq("plan", payload.segment.plan);
      const { data, error } = await q;
      if (error) throw error;
      targetUserIds = (data ?? []).map((r: any) => r.user_id);
    }
    if (!targetUserIds.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0, note: "no targets" }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Filter by admin_enabled preference when kind === 'admin'.
    const kind = payload.kind || "admin";
    if (kind === "admin") {
      const { data: prefs } = await admin
        .from("notification_preferences")
        .select("user_id, admin_enabled, push_enabled")
        .in("user_id", targetUserIds);
      const allowed = new Set(
        (prefs ?? [])
          .filter((p: any) => p.push_enabled !== false && p.admin_enabled !== false)
          .map((p: any) => p.user_id)
      );
      // Users without a prefs row still receive (defaults are true).
      const knownUsers = new Set((prefs ?? []).map((p: any) => p.user_id));
      targetUserIds = targetUserIds.filter((u) => allowed.has(u) || !knownUsers.has(u));
    }

    // Fetch tokens
    const { data: tokens, error: tokensErr } = await admin
      .from("device_tokens")
      .select("token, user_id")
      .in("user_id", targetUserIds);
    if (tokensErr) throw tokensErr;

    let sentOk = 0;
    let failed = 0;
    const staleTokens: string[] = [];

    for (const t of tokens ?? []) {
      const r = await sendFcm({
        token: t.token,
        title: payload.title,
        body: payload.body,
        data: { url: payload.url || "/", kind },
      });
      if (r.ok) sentOk++;
      else {
        failed++;
        if (r.status === 404 || r.status === 400) staleTokens.push(t.token);
      }
    }

    if (staleTokens.length) {
      await admin.from("device_tokens").delete().in("token", staleTokens);
    }

    // Log per user
    const logRows = targetUserIds.map((uid) => ({
      user_id: uid,
      kind,
      title: payload.title,
      body: payload.body,
      data: { url: payload.url || null },
      status: "sent",
    }));
    if (logRows.length) await admin.from("notification_log").insert(logRows);

    return new Response(JSON.stringify({ ok: true, targets: targetUserIds.length, tokens: tokens?.length ?? 0, sent: sentOk, failed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
