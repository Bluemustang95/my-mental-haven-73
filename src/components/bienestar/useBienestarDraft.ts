import { useCallback, useEffect, useState } from "react";

const KEY = "bienestar-draft-v1";
const FAVS_KEY = "bienestar-favs-v1";

export type BlockLog = {
  enjoyment: number; // 0-5
  attention: number; // 0-5
  letgo: number;    // 0-5
  notes: string;
};

export type ScheduledBlock = {
  activityId: number;
  activityName: string;
  log?: BlockLog;
};

export type Agenda = Record<string, Record<string, ScheduledBlock | undefined>>;
// agenda[day][hour] = ScheduledBlock

export type CustomActivity = { id: number; name: string; category: string };

export type BienestarDraft = {
  step: 1 | 2 | 3 | 4 | 5; // 5 = finish
  introSeen: boolean;
  selectedValues: number[]; // value item ids
  goals: [string, string, string];
  todayGoal: string;
  selectedActivities: number[];
  customActivities: CustomActivity[];
  agenda: Agenda;
  updatedAt: number;
  done: boolean;
};

export const emptyDraft = (): BienestarDraft => ({
  step: 1,
  introSeen: false,
  selectedValues: [],
  goals: ["", "", ""],
  todayGoal: "",
  selectedActivities: [],
  customActivities: [],
  agenda: {},
  updatedAt: 0,
  done: false,
});

export function readDraft(): BienestarDraft | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const p = JSON.parse(raw);
    return { ...emptyDraft(), ...p };
  } catch {
    return null;
  }
}

export function draftHasProgress(d: BienestarDraft | null): boolean {
  if (!d) return false;
  return (
    d.selectedValues.length > 0 ||
    !!d.todayGoal ||
    d.selectedActivities.length > 0 ||
    Object.keys(d.agenda).length > 0
  );
}

export function clearDraft() {
  localStorage.removeItem(KEY);
}

export function useBienestarDraft() {
  const [draft, setDraft] = useState<BienestarDraft>(() => readDraft() ?? emptyDraft());

  useEffect(() => {
    const toSave = { ...draft, updatedAt: Date.now() };
    try {
      localStorage.setItem(KEY, JSON.stringify(toSave));
    } catch {}
  }, [draft]);

  const update = useCallback(
    (patch: Partial<BienestarDraft> | ((d: BienestarDraft) => Partial<BienestarDraft>)) => {
      setDraft((d) => ({ ...d, ...(typeof patch === "function" ? patch(d) : patch) }));
    },
    []
  );

  const reset = useCallback(() => {
    clearDraft();
    setDraft(emptyDraft());
  }, []);

  return { draft, update, reset };
}

// ---------- Favoritos ----------
export function readFavs(): number[] {
  try {
    const raw = localStorage.getItem(FAVS_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "number") : [];
  } catch {
    return [];
  }
}

export function toggleFav(id: number) {
  const current = readFavs();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  try {
    localStorage.setItem(FAVS_KEY, JSON.stringify(next));
  } catch {}
  return next;
}

// ---------- Helpers Inicio / FAB ----------
const DAY_KEYS = ["lun", "mar", "mié", "jue", "vie", "sáb", "dom"];

export function todayKey() {
  // Monday=0
  const idx = (new Date().getDay() + 6) % 7;
  return DAY_KEYS[idx];
}

export type TodayStatus = {
  total: number;
  done: number;
  pending: number;
  nextLabel: string | null;
};

export function todayStatus(d: BienestarDraft | null): TodayStatus {
  if (!d) return { total: 0, done: 0, pending: 0, nextLabel: null };
  const day = todayKey();
  const blocks = d.agenda[day] ?? {};
  let total = 0;
  let done = 0;
  let nextLabel: string | null = null;
  const now = new Date();
  const hh = now.getHours();
  const sorted = Object.entries(blocks).sort(([a], [b]) => a.localeCompare(b));
  for (const [hour, blk] of sorted) {
    if (!blk) continue;
    total++;
    if (blk.log) done++;
    else {
      const h = parseInt(hour.split(":")[0], 10);
      if (h >= hh && nextLabel === null) nextLabel = `Próximo: ${hour} · ${blk.activityName}`;
    }
  }
  return { total, done, pending: total - done, nextLabel };
}
