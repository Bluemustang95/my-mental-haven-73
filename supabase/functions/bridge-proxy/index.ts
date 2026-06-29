import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

type Action = "status" | "intake" | "confirm-contact";
const VALID: Action[] = ["status", "intake", "confirm-contact"];

const BRIDGE_BASE_URL = Deno.env.get("BRIDGE_BASE_URL") ?? "";
const APP_BRIDGE_KEY = Deno.env.get("APP_BRIDGE_KEY") ?? "";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "unauthorized" }, 401);
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) return json({ error: "unauthorized" }, 401);

    if (!BRIDGE_BASE_URL || !APP_BRIDGE_KEY) {
      return json({ error: "bridge_not_configured" }, 500);
    }

    const body = await req.json().catch(() => ({}));
    const action = body?.action as Action;
    const payload = body?.payload ?? {};
    if (!VALID.includes(action)) return json({ error: "invalid_action" }, 400);

    const url = `${BRIDGE_BASE_URL.replace(/\/$/, "")}/functions/v1/app-bridge-${action}`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-App-Bridge-Key": APP_BRIDGE_KEY,
      },
      body: JSON.stringify(payload),
    });

    const text = await upstream.text();
    let data: unknown;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }

    return new Response(JSON.stringify(data), {
      status: upstream.status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("bridge-proxy error", e);
    return json({ error: "proxy_failure", detail: String(e) }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
