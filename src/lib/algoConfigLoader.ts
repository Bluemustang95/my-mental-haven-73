// Runtime loader for the onboarding algo config stored in DB.
// Falls back to in-code defaults from onboardingAlgorithm.ts if empty.
import { supabase } from "@/integrations/supabase/client";

let _cache: { weights: Record<string, any>; category_content: Record<string, any> } | null = null;

export async function loadAlgoConfig(force = false) {
  if (_cache && !force) return _cache;
  const { data } = await supabase
    .from("algo_onboarding_config")
    .select("weights, category_content")
    .eq("id", 1)
    .maybeSingle();
  _cache = {
    weights: (data?.weights as any) ?? {},
    category_content: (data?.category_content as any) ?? {},
  };
  return _cache;
}

export function clearAlgoConfigCache() {
  _cache = null;
}
