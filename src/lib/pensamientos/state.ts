import { useCallback, useEffect, useState } from "react";
import type { Camino } from "./emotions";

const KEY = "resma:thought-draft:v4";

export type ActionRow = { id: string; what: string; when: string; why?: string };

export type AiAnalysisRefine = {
  mode: "refine";
  factual: string;
  questions: string[];
} | null;

export type AiAnalysisIdentify = {
  mode: "identify";
  tips: string[];
  candidates: string[];
} | null;

export type AiAnalysis = AiAnalysisRefine | AiAnalysisIdentify;

export type ThoughtDraft = {
  step: number;
  // Step 1
  caminoElegido: Camino | null;
  emocionDidactica: string | null;
  // Step 2
  emotion: string;
  emotionOther: string;
  intensityInitial: number;
  triggerEvent: string;
  automaticThought: string;
  pendingThoughts: string[];
  aiAnalysis: AiAnalysis;
  // Step 3 (distorsión)
  distortionKey: string | null;
  distortionLabel: string | null;
  // Step 4 (evidencias)
  evidenceFor: string[];
  evidenceAgainst: string[];
  evidenceSources: { for: ("user" | "ai")[]; against: ("user" | "ai")[] };
  isRealProblem: boolean | null;
  // Step 5 (tratamiento)
  alternativeThought: string;
  intensityFinal: number;
  brainstorm: string;
  aiAlternatives: string[];
  aiActionSuggestions: { what: string; when: string; why?: string }[];
  actionPlan: ActionRow[];
};

export const EMPTY_DRAFT: ThoughtDraft = {
  step: 1,
  caminoElegido: null,
  emocionDidactica: null,
  emotion: "",
  emotionOther: "",
  intensityInitial: 50,
  triggerEvent: "",
  automaticThought: "",
  pendingThoughts: [],
  aiAnalysis: null,
  distortionKey: null,
  distortionLabel: null,
  evidenceFor: [],
  evidenceAgainst: [],
  evidenceSources: { for: [], against: [] },
  isRealProblem: null,
  alternativeThought: "",
  intensityFinal: 50,
  brainstorm: "",
  aiAlternatives: [],
  aiActionSuggestions: [],
  actionPlan: [],
};

function readDraft(): ThoughtDraft {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY_DRAFT;
    return { ...EMPTY_DRAFT, ...JSON.parse(raw) };
  } catch {
    return EMPTY_DRAFT;
  }
}

export function useThoughtDraft() {
  const [draft, setDraft] = useState<ThoughtDraft>(EMPTY_DRAFT);

  useEffect(() => {
    setDraft(readDraft());
  }, []);

  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(draft)); } catch {}
  }, [draft]);

  const patch = useCallback(
    (p: Partial<ThoughtDraft>) => setDraft((d) => ({ ...d, ...p })),
    []
  );

  const reset = useCallback(() => {
    try { localStorage.removeItem(KEY); } catch {}
    setDraft(EMPTY_DRAFT);
  }, []);

  return { draft, patch, setDraft, reset };
}
