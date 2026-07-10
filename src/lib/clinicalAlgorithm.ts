// Thin compat shim over the unified onboardingAlgorithm.
// Existing imports keep working; new code should import from `onboardingAlgorithm` directly.

import {
  calculatePlan,
  type AlgoInput as NewAlgoInput,
  type ToolModule,
  type SleepQuality as NewSleepQuality,
  type LearningFormat as NewLearningFormat,
} from "./onboardingAlgorithm";

export type SleepQuality = NewSleepQuality;
export type LearningFormat = NewLearningFormat;

// Kept as a permissive alias so existing string comparisons don't break.
export type Module = string;

export const MODULE_LABEL: Record<string, string> = {
  mindfulness: "Mindfulness",
  pensamientos: "Gestión de Pensamientos",
  psicoeducacion: "Psicoeducación",
  psicohigiene_sueno: "Higiene del Sueño",
  habitos: "Hábitos",
  pack_actividades: "Pack de Activación",
  diario: "Diario",
  // legacy keys retained for any dashboard copy still using them
  "regulacion-emocional": "Regulación Emocional",
  "tolerancia-malestar": "Tolerancia al Malestar",
  "efectividad-personal": "Efectividad Personal",
  "gestion-pensamientos": "Gestión de Pensamientos",
  sueno: "Higiene del Sueño",
  autoestima: "Autoestima",
};

export type AlgoInput = NewAlgoInput;
export type AlgoResult = {
  priority: ToolModule;
  scores: Record<string, number>;
};

export function computePriority(input: AlgoInput): AlgoResult {
  const r = calculatePlan(input);
  return { priority: r.priority_module, scores: r.module_scores as Record<string, number> };
}

export { saveLocalProfile, readLocalProfile } from "./onboardingAlgorithm";
