// Runtime loader for the onboarding algo config stored in DB.
// Applies overrides to RUNTIME_WEIGHTS so calculatePlan uses admin values.
import { supabase } from "@/integrations/supabase/client";
import { applyAlgoOverrides } from "@/lib/onboardingAlgorithm";

let _cache: { weights: Record<string, any>; category_content: Record<string, any> } | null = null;
let _inflight: Promise<any> | null = null;

export async function loadAlgoConfig(force = false) {
  if (_cache && !force) return _cache;
  if (_inflight && !force) return _inflight;
  _inflight = (async () => {
    const { data } = await supabase
      .from("algo_onboarding_config")
      .select("weights, category_content")
      .eq("id", 1)
      .maybeSingle();
    _cache = {
      weights: (data?.weights as any) ?? {},
      category_content: (data?.category_content as any) ?? {},
    };
    applyAlgoOverrides(_cache.weights);
    _inflight = null;
    return _cache;
  })();
  return _inflight;
}

export function getCategoryContentOverride(): Record<string, any> {
  return _cache?.category_content ?? {};
}

export function clearAlgoConfigCache() {
  _cache = null;
}

