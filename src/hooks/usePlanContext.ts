import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  CATEGORY_CONTENT,
  TOOL_META,
  type PlanCategory,
  type ToolModule,
} from "@/lib/onboardingAlgorithm";

export type PlanContext = {
  loading: boolean;
  category: PlanCategory | null;
  priority: ToolModule | null;
  top3: ToolModule[];
  categoryContent: (typeof CATEGORY_CONTENT)[PlanCategory] | null;
  suggestedTool: { module: ToolModule; label: string; route: string } | null;
};

/** Reads the user's plan context (category + top tools) for contextual UI in rituals. */
export function usePlanContext(): PlanContext {
  const { user } = useAuth();
  const [state, setState] = useState<PlanContext>({
    loading: true,
    category: null,
    priority: null,
    top3: [],
    categoryContent: null,
    suggestedTool: null,
  });

  useEffect(() => {
    if (!user) {
      setState((s) => ({ ...s, loading: false }));
      return;
    }
    (async () => {
      const { data } = await supabase
        .from("patient_app_profiles")
        .select("plan_category, priority_module, top3_tools")
        .eq("user_id", user.id)
        .maybeSingle();

      const category = ((data as any)?.plan_category ?? null) as PlanCategory | null;
      const priority = ((data as any)?.priority_module ?? null) as ToolModule | null;
      const top3 = (((data as any)?.top3_tools as ToolModule[]) ?? []).filter(
        (m) => m && TOOL_META[m],
      );
      const suggestedMod = top3[0] ?? priority ?? null;
      setState({
        loading: false,
        category,
        priority,
        top3,
        categoryContent: category ? CATEGORY_CONTENT[category] : null,
        suggestedTool: suggestedMod
          ? {
              module: suggestedMod,
              label: TOOL_META[suggestedMod].label,
              route: TOOL_META[suggestedMod].route,
            }
          : null,
      });
    })();
  }, [user]);

  return state;
}
