// Pre-generate ElevenLabs audio for a mindfulness script and cache it in Storage.
// Called by the admin panel. Idempotent: if the audio for (script_id, voice_id)
// already exists, returns the existing signed URL.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "mindfulness-audio";
const SIGNED_URL_TTL = 60 * 60 * 24 * 365; // 1 year

const COUNTRY_ALIASES = new Map<string, string>([
  ["default", "default"],
  ["predeterminado", "default"],
  ["ar", "Argentina"],
  ["arg", "Argentina"],
  ["argentina", "Argentina"],
  ["uy", "Uruguay"],
  ["uruguay", "Uruguay"],
  ["cl", "Chile"],
  ["chile", "Chile"],
  ["mx", "México"],
  ["mexico", "México"],
  ["méxico", "México"],
  ["co", "Colombia"],
  ["colombia", "Colombia"],
  ["pe", "Perú"],
  ["peru", "Perú"],
  ["perú", "Perú"],
  ["es", "España"],
  ["espana", "España"],
  ["españa", "España"],
  ["us", "Estados Unidos"],
  ["usa", "Estados Unidos"],
  ["estados unidos", "Estados Unidos"],
]);

function normalizeCountry(value?: string | null) {
  if (!value?.trim()) return "default";
  const key = value.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ");
  return COUNTRY_ALIASES.get(key) ?? value.trim();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    if (!apiKey) return json({ error: "ELEVENLABS_API_KEY missing" }, 500);

    // Verify caller is admin
    const authHeader = req.headers.get("Authorization") ?? "";
    const supaAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData } = await supaAuth.auth.getUser();
    const user = userData?.user;
    if (!user) return json({ error: "unauthorized" }, 401);
    const { data: isAdmin } = await supaAuth.rpc("has_role", { _user_id: user.id, _role: "admin" });
    if (!isAdmin) return json({ error: "forbidden" }, 403);

    const supa = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const scriptId = String(body?.scriptId ?? "");
    let voiceId = String(body?.voiceId ?? "");
    const countryCode = body?.countryCode ? normalizeCountry(String(body.countryCode)) : null;
    const gender = (body?.gender === "male" ? "male" : "female") as "female" | "male";
    const force = Boolean(body?.force);
    if (!scriptId) return json({ error: "scriptId required" }, 400);

    // Load script
    const { data: script, error: scriptErr } = await supa
      .from("mindfulness_scripts_v2")
      .select("id, exercise_id, minutes, version, country_code, script_text")
      .eq("id", scriptId)
      .maybeSingle();
    if (scriptErr || !script) return json({ error: "script not found" }, 404);
    const text = String(script.script_text || "").trim();
    if (!text) return json({ error: "empty script" }, 400);

    // Resolve voice from country if not provided
    if (!voiceId) {
      const country = normalizeCountry(countryCode ?? script.country_code ?? "default");
      const { data: vs } = await supa
        .from("voice_settings")
        .select("voice_id")
        .eq("country_code", country)
        .eq("gender", gender)
        .maybeSingle();
      voiceId = vs?.voice_id ?? "";
      if (!voiceId) {
        // Fallback to default
        const { data: def } = await supa
          .from("voice_settings")
          .select("voice_id")
          .eq("country_code", "default")
          .eq("gender", gender)
          .maybeSingle();
        voiceId = def?.voice_id ?? "";
      }
      if (!voiceId) return json({ error: `no voice configured for country=${country}, gender=${gender}` }, 400);
    }

    // Idempotency check
    if (!force) {
      const { data: existing } = await supa
        .from("mindfulness_audio_cache")
        .select("storage_path")
        .eq("script_id", scriptId)
        .eq("voice_id", voiceId)
        .maybeSingle();
      if (existing?.storage_path) {
        const { data: signed } = await supa.storage.from(BUCKET).createSignedUrl(existing.storage_path, SIGNED_URL_TTL);
        return json({ ok: true, cached: true, url: signed?.signedUrl ?? null, path: existing.storage_path });
      }
    }

    // Synthesize with ElevenLabs
    const ttsRes = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: { "xi-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: { stability: 0.55, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true, speed: 0.92 },
        }),
      },
    );
    if (!ttsRes.ok) {
      const err = await ttsRes.text();
      return json({ error: `elevenlabs ${ttsRes.status}: ${err}` }, 502);
    }
    const audio = new Uint8Array(await ttsRes.arrayBuffer());

    const storageCountry = normalizeCountry(script.country_code);
    const path = `${script.exercise_id}/${script.minutes}/${storageCountry}/${script.version}/${voiceId}.mp3`;
    const { error: upErr } = await supa.storage.from(BUCKET).upload(path, audio, {
      contentType: "audio/mpeg",
      upsert: true,
    });
    if (upErr) return json({ error: `storage: ${upErr.message}` }, 500);

    // Upsert cache row
    await supa.from("mindfulness_audio_cache").upsert({
      script_id: scriptId,
      voice_id: voiceId,
      storage_path: path,
      chars_used: text.length,
    }, { onConflict: "script_id,voice_id" });

    // Log AI usage (rough cost: $0.30 / 1K chars for ElevenLabs multilingual)
    const cost = (text.length / 1000) * 0.30;
    await supa.from("ai_usage_log").insert({
      provider: "elevenlabs",
      model: "eleven_multilingual_v2",
      feature: "mindfulness_precache",
      user_id: user.id,
      chars: text.length,
      cost_usd: cost,
      meta: { script_id: scriptId, voice_id: voiceId, minutes: script.minutes, exercise_id: script.exercise_id, country_code: storageCountry },
    });

    const { data: signed } = await supa.storage.from(BUCKET).createSignedUrl(path, SIGNED_URL_TTL);
    return json({ ok: true, cached: false, url: signed?.signedUrl ?? null, path, chars: text.length, cost, voice_id: voiceId });
  } catch (e) {
    console.error("[mindfulness-precache]", e);
    return json({ error: String((e as Error)?.message ?? e) }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
