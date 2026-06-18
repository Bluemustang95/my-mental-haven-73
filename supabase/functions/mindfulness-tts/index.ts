const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const DEFAULT_VOICE_ID = "9rvdnhrYoXoUt4igKpBw"; // Argentina (Nadia)

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("ELEVENLABS_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "ELEVENLABS_API_KEY missing" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json().catch(() => ({}));
    const text = String(body?.text ?? "").trim();
    const voiceId = String(body?.voiceId ?? DEFAULT_VOICE_ID);
    const stability = typeof body?.stability === "number" ? body.stability : 0.55;
    const similarity = typeof body?.similarity_boost === "number" ? body.similarity_boost : 0.8;
    const style = typeof body?.style === "number" ? body.style : 0.25;
    const speed = typeof body?.speed === "number" ? body.speed : 0.92;

    if (!text) {
      return new Response(JSON.stringify({ error: "Missing text" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (text.length > 4500) {
      return new Response(JSON.stringify({ error: "Text too long" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const res = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability,
            similarity_boost: similarity,
            style,
            use_speaker_boost: true,
            speed,
          },
        }),
      },
    );

    if (!res.ok) {
      const errText = await res.text();
      console.error("[mindfulness-tts] ElevenLabs error", res.status, errText);
      return new Response(
        JSON.stringify({ error: `ElevenLabs ${res.status}: ${errText}` }),
        { status: res.status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const audio = await res.arrayBuffer();
    return new Response(audio, {
      status: 200,
      headers: {
        ...corsHeaders,
        "Content-Type": "audio/mpeg",
        "Cache-Control": "public, max-age=2592000, immutable",
      },
    });
  } catch (e) {
    console.error("[mindfulness-tts] error", e);
    return new Response(JSON.stringify({ error: String((e as Error)?.message ?? e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
