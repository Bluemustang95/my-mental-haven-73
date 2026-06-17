import { useCallback, useEffect, useReducer } from "react";
import type { DbtEmotion } from "@/lib/dbt/data";

export type Stage =
  | "wizard8" | "decision9" | "problem12" | "opposite10" | "done";

export interface FlowState {
  stage: Stage;
  step: number;
  selectedEmotion: DbtEmotion | null;
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
}

const INITIAL: FlowState = {
  stage: "wizard8",
  step: 1,
  selectedEmotion: null,
  eventDescription: "",
  interpretations: "",
  threat: "",
  catastropheCoping: "",
  fitsFacts: null,
  isEffective: null,
  problem: { goal: "", brainstorm: "", chosenSolution: "", prosCons: "", outcome: null },
  opposite: { impulses: "", bodyPlan: "" },
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
  switch (action.type) {
    case "PATCH": return { ...state, ...action.patch };
    case "PATCH_PROBLEM": return { ...state, problem: { ...state.problem, ...action.patch } };
    case "PATCH_OPPOSITE": return { ...state, opposite: { ...state.opposite, ...action.patch } };
    case "GOTO": return { ...state, stage: action.stage, step: action.step ?? 1 };
    case "NEXT": return { ...state, step: state.step + 1 };
    case "PREV": return { ...state, step: Math.max(1, state.step - 1) };
    case "RESET": return INITIAL;
    case "HYDRATE": return action.state;
    default: return state;
  }
}

const STORAGE_KEY = "dbt-change-response-draft";

export function useChangeResponseFlow() {
  const [state, dispatch] = useReducer(reducer, INITIAL);

  // Hydrate
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as FlowState;
        if (parsed && parsed.stage) dispatch({ type: "HYDRATE", state: parsed });
      }
    } catch {}
  }, []);

  // Persist
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch {}
  }, [state]);

  const clearDraft = useCallback(() => {
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return { state, dispatch, clearDraft };
}
