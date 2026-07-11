// Test an AI prompt with arbitrary model/system/temperature/max_tokens.
// Admin-only. Non-streaming, returns full text + usage.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "No auth" }, 401);

    const supa = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await supa.auth.getUser();
    if (!user) return json({ error: "No user" }, 401);

    const { data: isAdmin } = await supa.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "Forbidden" }, 403);

    const { model, system_prompt, temperature, max_tokens, user_input } = await req.json();
    if (!model || !user_input) return json({ error: "model and user_input required" }, 400);

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) return json({ error: "LOVABLE_API_KEY missing" }, 500);

    const t0 = Date.now();
    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model,
        temperature: typeof temperature === "number" ? temperature : 0.7,
        ...(max_tokens ? { max_tokens } : {}),
        messages: [
          ...(system_prompt ? [{ role: "system", content: system_prompt }] : []),
          { role: "user", content: user_input },
        ],
      }),
    });
    const latency_ms = Date.now() - t0;
    const body = await resp.text();
    if (!resp.ok) return json({ error: "Gateway error", status: resp.status, details: body, latency_ms }, resp.status);
    const parsed = JSON.parse(body);
    const content = parsed.choices?.[0]?.message?.content ?? "";
    return json({ content, usage: parsed.usage ?? null, latency_ms, model });
  } catch (e) {
    return json({ error: e instanceof Error ? e.message : "unknown" }, 500);
  }
});

function json(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
