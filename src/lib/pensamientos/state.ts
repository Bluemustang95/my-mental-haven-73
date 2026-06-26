import { useCallback, useEffect, useState } from "react";

const KEY = "resma:thought-draft:v5";

export type DistortionSel = { key: string; label: string };

export type ThoughtDraft = {
  step: number;
  // Step 1
  triggerEvent: string;
  // Step 2
  automaticThought: string;
  // Step 3
  emotion: string;
  emotionOther: string;
  subEmotions: string[];
  intensityInitial: number;
  // Step 4
  behavior: string;
  // Step 5
  bodySensations: string[];
  // Step 6
  evidenceFor: string[];
  evidenceAgainst: string[];
  evidenceSources: { for: ("user" | "ai")[]; against: ("user" | "ai")[] };
  // Step 7
  distortions: DistortionSel[];
  // Step 8
  alternativeThought: string;
  resolutionPlan: string;
  intensityFinal: number;
};

export const EMPTY_DRAFT: ThoughtDraft = {
  step: 1,
  triggerEvent: "",
  automaticThought: "",
  emotion: "",
  emotionOther: "",
  subEmotions: [],
  intensityInitial: 50,
  behavior: "",
  bodySensations: [],
  evidenceFor: [],
  evidenceAgainst: [],
  evidenceSources: { for: [], against: [] },
  distortions: [],
  alternativeThought: "",
  resolutionPlan: "",
  intensityFinal: 50,
};

export function getResolutionMode(d: ThoughtDraft): "reestructuracion" | "abordaje" {
  // Más evidencias en contra → reestructuración (pensamiento no sostenido)
  // Más a favor → abordaje (hay problema real)
  return d.evidenceAgainst.length >= d.evidenceFor.length ? "reestructuracion" : "abordaje";
}

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
