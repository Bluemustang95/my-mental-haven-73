import { useEffect, useSyncExternalStore } from "react";

export type ResmitaStepInfo = {
  stepTitle: string;
  purpose: string;
  welcome?: string;
};

let current: ResmitaStepInfo | null = null;
const listeners = new Set<() => void>();

function emit() { listeners.forEach((l) => l()); }

export function setResmitaStep(info: ResmitaStepInfo | null) {
  current = info;
  emit();
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => { listeners.delete(l); };
}

function getSnapshot(): ResmitaStepInfo | null {
  return current;
}

export function useResmitaStep(): ResmitaStepInfo | null {
  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}

/** Publishes step info while the component is mounted with the given info. */
export function usePublishResmitaStep(info: ResmitaStepInfo | null) {
  useEffect(() => {
    setResmitaStep(info);
    return () => {
      if (current === info) setResmitaStep(null);
    };
  }, [info?.stepTitle, info?.purpose, info?.welcome]);
}
