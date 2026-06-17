import { useCallback, useEffect, useReducer, useRef } from "react";
import type { DbtEmotion } from "@/lib/dbt/data";

export type Stage =
  | "wizard8" | "decision9" | "problem12" | "opposite10" | "done";

export interface FlowState {
  stage: Stage;
  step: number;
  selectedEmotion: DbtEmotion | null;
  emotionNuance: string | null;
  eventDescription: string;
  interpretations: string;
  threat: string;
  catastropheCoping: string;
  fitsFacts: boolean | null;
  isEffective: boolean | null;
  problem: {
    goal: string;
    brainstorm: string;
    chosenSolution: string;
    prosCons: string;
    outcome: "success" | "failed" | null;
  };
  opposite: {
    impulses: string;
    bodyPlan: string;
  };
  startedAt: number;
  updatedAt: number;
}

const INITIAL: FlowState = {
  stage: "wizard8",
  step: 1,
  selectedEmotion: null,
  emotionNuance: null,
  eventDescription: "",
  interpretations: "",
  threat: "",
  catastropheCoping: "",
  fitsFacts: null,
  isEffective: null,
  problem: { goal: "", brainstorm: "", chosenSolution: "", prosCons: "", outcome: null },
  opposite: { impulses: "", bodyPlan: "" },
  startedAt: 0,
  updatedAt: 0,
};

type Action =
  | { type: "PATCH"; patch: Partial<FlowState> }
  | { type: "PATCH_PROBLEM"; patch: Partial<FlowState["problem"]> }
  | { type: "PATCH_OPPOSITE"; patch: Partial<FlowState["opposite"]> }
  | { type: "GOTO"; stage: Stage; step?: number }
  | { type: "NEXT" }
  | { type: "PREV" }
  | { type: "RESET" }
  | { type: "HYDRATE"; state: FlowState };

function reducer(state: FlowState, action: Action): FlowState {
  const now = Date.now();
  const stamped = (s: FlowState): FlowState => ({
    ...s,
    startedAt: s.startedAt || now,
    updatedAt: now,
  });
  switch (action.type) {
    case "PATCH": return stamped({ ...state, ...action.patch });
    case "PATCH_PROBLEM": return stamped({ ...state, problem: { ...state.problem, ...action.patch } });
    case "PATCH_OPPOSITE": return stamped({ ...state, opposite: { ...state.opposite, ...action.patch } });
    case "GOTO": return stamped({ ...state, stage: action.stage, step: action.step ?? 1 });
    case "NEXT": return stamped({ ...state, step: state.step + 1 });
    case "PREV": return stamped({ ...state, step: Math.max(1, state.step - 1) });
    case "RESET": return INITIAL;
    case "HYDRATE": return action.state;
    default: return state;
  }
}

const STORAGE_KEY = "dbt-change-response-draft";

/** Returns true if the persisted draft has meaningful progress worth resuming. */
export function draftHasProgress(s: FlowState | null | undefined): boolean {
  if (!s) return false;
  if (s.stage !== "wizard8" || s.step > 1) return true;
  return Boolean(
    s.selectedEmotion ||
    s.eventDescription.trim() ||
    s.interpretations.trim() ||
    s.threat.trim() ||
    s.catastropheCoping.trim()
  );
}

export function readDraft(): FlowState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as FlowState;
    return parsed && parsed.stage ? parsed : null;
  } catch { return null; }
}

export function useChangeResponseFlow() {
  const [state, dispatch] = useReducer(reducer, INITIAL);
  const hydrated = useRef(false);

  // Hydrate
  useEffect(() => {
    const parsed = readDraft();
    if (parsed) dispatch({ type: "HYDRATE", state: parsed });
    hydrated.current = true;
  }, []);

  // Persist (skip until hydration to avoid clobbering stored draft on mount)
  useEffect(() => {
    if (!hydrated.current) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { state, dispatch, clearDraft };
}
