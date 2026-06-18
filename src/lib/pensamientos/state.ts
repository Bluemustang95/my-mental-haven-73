import { useCallback, useEffect, useState } from "react";
import type { Camino } from "./emotions";

const KEY = "resma:thought-draft:v1";

export type ActionRow = { id: string; what: string; when: string };

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
  // Step 3
  trainerScore: number;
  trainerCompleted: boolean;
  aiAnalysis: string | null;
  // Step 4
  evidenceFor: string[];
  evidenceAgainst: string[];
  distortionKey: string | null;
  distortionLabel: string | null;
  isRealProblem: boolean | null;
  // Step 5
  alternativeThought: string;
  intensityFinal: number;
  brainstorm: string;
  aiSuggestions: string[];
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
  trainerScore: 0,
  trainerCompleted: false,
  aiAnalysis: null,
  evidenceFor: [],
  evidenceAgainst: [],
  distortionKey: null,
  distortionLabel: null,
  isRealProblem: null,
  alternativeThought: "",
  intensityFinal: 50,
  brainstorm: "",
  aiSuggestions: [],
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
