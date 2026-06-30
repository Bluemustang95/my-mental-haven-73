import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Identify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes.user) {
      return new Response(JSON.stringify({ error: "unauthenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { code } = await req.json().catch(() => ({ code: "" }));
    const trimmed = String(code || "").trim().toUpperCase();
    const ADMIN = (Deno.env.get("ADMIN_ACCESS_CODE") || "").toUpperCase();
    const TESTER = (Deno.env.get("TESTER_ACCESS_CODE") || "").toUpperCase();

    const admin = createClient(supabaseUrl, serviceKey);
    const userId = userRes.user.id;

    if (trimmed && trimmed === ADMIN) {
      // Grant admin role + permanent premium (no expiry)
      await admin.from("user_roles").upsert(
        { user_id: userId, role: "admin" },
        { onConflict: "user_id,role" }
      );
      await admin
        .from("patient_app_profiles")
        .upsert(
          {
            user_id: userId,
            plan: "premium",
            plan_started_at: new Date().toISOString(),
            plan_expires_at: null,
          },
          { onConflict: "user_id" }
        );
      return new Response(JSON.stringify({ ok: true, kind: "admin" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (trimmed && trimmed === TESTER) {
      const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      await admin
        .from("patient_app_profiles")
        .upsert(
          {
            user_id: userId,
            plan: "premium",
            plan_started_at: new Date().toISOString(),
            plan_expires_at: expires,
          },
          { onConflict: "user_id" }
        );
      return new Response(JSON.stringify({ ok: true, kind: "tester", expires_at: expires }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: false, error: "invalid_code" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
