// Persistencia local de loops clínicos por recurso.
// Cada recurso guarda: timestamp, pre/post scores, y meta libre.

export type ResourceKey =
  | "mindfulness"
  | "grounding"
  | "safety"
  | "sleep"
  | "rumination"
  | "recovery"
  | "regulation";

export type ResourceLog = {
  ts: number;
  pre?: number;
  post?: number;
  meta?: Record<string, unknown>;
};

const key = (resource: ResourceKey) => `resma:${resource}:logs`;

export function saveLog(resource: ResourceKey, log: Omit<ResourceLog, "ts"> & { ts?: number }) {
  try {
    const list = getLogs(resource);
    const entry: ResourceLog = { ts: Date.now(), ...log };
    list.unshift(entry);
    window.localStorage.setItem(key(resource), JSON.stringify(list.slice(0, 60)));
    return entry;
  } catch {
    return null;
  }
}

export function getLogs(resource: ResourceKey): ResourceLog[] {
  try {
    const raw = window.localStorage.getItem(key(resource));
    if (!raw) return [];
    return JSON.parse(raw) as ResourceLog[];
  } catch {
    return [];
  }
}

export function getLastLog(resource: ResourceKey): ResourceLog | null {
  return getLogs(resource)[0] ?? null;
}

export function getDelta(resource: ResourceKey): number | null {
  const last = getLastLog(resource);
  if (!last || last.pre == null || last.post == null) return null;
  return last.pre - last.post;
}
