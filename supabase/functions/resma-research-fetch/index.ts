// Edge function: resma-research-fetch
// Uses Firecrawl (connector) to search recent psychology/mental-health articles
// and stores them in psychology_news. Only callable by authenticated admins.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const FIRECRAWL_API_KEY = Deno.env.get("FIRECRAWL_API_KEY") ?? "";
const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY") ?? "";

function firecrawlIsGateway() {
  // Gateway keys start with "lovc_"; direct Firecrawl keys start with "fc-".
  return FIRECRAWL_API_KEY.startsWith("lovc_");
}

async function firecrawlSearch(query: string, limit: number, lang: string, country: string) {
  const body = {
    query,
    limit,
    lang,
    country,
    tbs: "qdr:m", // last month
    scrapeOptions: { formats: ["summary"] as const },
  };
  if (firecrawlIsGateway()) {
    const url = "https://connector-gateway.lovable.dev/firecrawl/v2/search";
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": FIRECRAWL_API_KEY,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Firecrawl gateway ${r.status}: ${await r.text()}`);
    return r.json();
  } else {
    const url = "https://api.firecrawl.dev/v2/search";
    const r = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${FIRECRAWL_API_KEY}`,
      },
      body: JSON.stringify(body),
    });
    if (!r.ok) throw new Error(`Firecrawl direct ${r.status}: ${await r.text()}`);
    return r.json();
  }
}

async function hashUrl(u: string) {
  const data = new TextEncoder().encode(u);
  const digest = await crypto.subtle.digest("SHA-1", data);
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    // Auth: require an admin caller.
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const userClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: `Bearer ${jwt}` } },
    });
    const { data: userData } = await userClient.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { data: roleRow } = await admin.from("user_roles").select("role").eq("user_id", uid).eq("role", "admin").maybeSingle();
    if (!roleRow) return new Response(JSON.stringify({ error: "forbidden" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });

    if (!FIRECRAWL_API_KEY) {
      return new Response(JSON.stringify({ error: "FIRECRAWL_API_KEY missing — conectá Firecrawl en Conectores" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: cfg } = await admin.from("research_feed_config").select("*").eq("id", 1).maybeSingle();
    if (!cfg) throw new Error("research_feed_config not initialized");
    if (!cfg.enabled) {
      return new Response(JSON.stringify({ error: "feed disabled" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const perQuery = Math.max(1, Math.ceil(cfg.max_per_run / Math.max(1, cfg.queries.length)));
    let inserted = 0, skipped = 0;
    const errors: string[] = [];

    for (const q of cfg.queries as string[]) {
      try {
        const res = await firecrawlSearch(q, perQuery, cfg.language, cfg.country);
        const items: Array<{ url?: string; title?: string; description?: string; summary?: string; markdown?: string }>
          = (res?.data ?? res?.web ?? []) as never;

        for (const it of items) {
          const url = it.url;
          if (!url || !it.title) { skipped++; continue; }
          const hash = await hashUrl(url);
          const summary = it.summary ?? it.description ?? null;
          const host = (() => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return null; } })();

          const { error } = await admin.from("psychology_news").insert({
            title: it.title.slice(0, 300),
            summary: summary ? String(summary).slice(0, 1200) : null,
            url,
            source: host,
            tags: [q.split(" ")[0].toLowerCase()],
            active: cfg.auto_publish === true,
            featured: false,
            auto_generated: true,
            source_url_hash: hash,
            published_at: new Date().toISOString(),
          });
          if (error) {
            if (String(error.message).includes("duplicate")) skipped++;
            else errors.push(error.message);
          } else {
            inserted++;
          }
        }
      } catch (e) {
        errors.push(e instanceof Error ? e.message : String(e));
      }
    }

    const summary = { inserted, skipped, errors: errors.slice(0, 5) };
    await admin.from("research_feed_config").update({
      last_run_at: new Date().toISOString(),
      last_run_summary: summary,
    }).eq("id", 1);

    return new Response(JSON.stringify(summary), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("resma-research-fetch error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
