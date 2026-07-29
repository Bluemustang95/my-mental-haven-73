import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

/** Tablas con columna user_id que se borran junto con la cuenta. */
const USER_TABLES = [
  "algo_user_answers",
  "ambient_audio_overrides",
  "ba_baseline_entries",
  "ba_day_logs",
  "ba_programs",
  "body_map_entries",
  "content_favorites",
  "content_progress",
  "daily_checkins",
  "day_timeline_entries",
  "dbt_emotion_sessions",
  "device_tokens",
  "dream_log",
  "exercise_sessions",
  "habit_completions",
  "habits",
  "home_layouts",
  "internal_dialogues",
  "journal_entries",
  "medication_logs",
  "medications",
  "micro_achievements",
  "mindful_eating_entries",
  "mindfulness_sound_settings",
  "notification_log",
  "notification_preferences",
  "practice_responses",
  "relationship_logs",
  "resmita_context_events",
  "resmita_messages",
  "safety_plans",
  "selfcare_tasks",
  "session_notes",
  "sleep_hygiene_audits",
  "sleep_log",
  "test_results",
  "therapy_prep_notes",
  "therapy_satisfaction_surveys",
  "thought_followup_logs",
  "thought_followups",
  "thought_records",
  "unsent_letters",
  "values_reflections",
  "vlq_responses",
  "voice_library_custom",
  "voice_settings",
  "weekly_goals",
  "weekly_reflections",
  "user_roles",
  "patient_app_profiles",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Validamos el JWT en código: el usuario solo puede borrar su propia cuenta.
    const authed = createClient(url, anon, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await authed.auth.getUser();
    const user = userData?.user;
    if (userErr || !user) {
      return new Response(JSON.stringify({ error: "unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(url, service, { auth: { persistSession: false } });

    for (const table of USER_TABLES) {
      const { error } = await admin.from(table).delete().eq("user_id", user.id);
      if (error) console.error(`delete ${table}:`, error.message);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(user.id);
    if (delErr) {
      return new Response(JSON.stringify({ error: delErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
