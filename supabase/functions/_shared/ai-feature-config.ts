// Loads AI feature config from ai_feature_configs table with fallback.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

export type AiFeatureCfg = {
  model: string;
  temperature: number;
  max_tokens: number | null;
  system_prompt: string | null;
  active: boolean;
};

export async function loadFeatureConfig(
  featureKey: string,
  fallback: Partial<AiFeatureCfg> = {},
): Promise<AiFeatureCfg> {
  const fb: AiFeatureCfg = {
    model: fallback.model ?? "google/gemini-3-flash-preview",
    temperature: fallback.temperature ?? 0.7,
    max_tokens: fallback.max_tokens ?? null,
    system_prompt: fallback.system_prompt ?? null,
    active: true,
  };
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !key) return fb;
    const sb = createClient(url, key);
    const { data } = await sb
      .from("ai_feature_configs")
      .select("model, temperature, max_tokens, system_prompt, active")
      .eq("feature_key", featureKey)
      .maybeSingle();
    if (!data || (data as any).active === false) return fb;
    return {
      model: (data as any).model || fb.model,
      temperature: (data as any).temperature ?? fb.temperature,
      max_tokens: (data as any).max_tokens ?? fb.max_tokens,
      system_prompt: (data as any).system_prompt || fb.system_prompt,
      active: true,
    };
  } catch (e) {
    console.error("[ai-feature-config] load failed for", featureKey, e);
    return fb;
  }
}
