// ============================================================================
// Normalización de sub-ítems a escala 0-100 — funciones puras y testeables.
// ============================================================================
import type { RawCheckin, RawDream, RawHygieneAudit, RawSleepLog, Severity } from "./types";
import { MODULATOR_FULL_DAYS, MODULATOR_STALE_DAYS } from "./types";

export const POSITIVE_EMOTIONS = new Set(["Calma", "Alegría", "Energía", "Motivado", "Cariño"]);
export const NEGATIVE_EMOTIONS = new Set(["Ansiedad", "Tristeza", "Enojo", "Agotamiento", "Confuso"]);

/** S2 · Sensación al despertar. */
export const DAWN_MAP: Record<string, number> = {
  "Pésimo": 10,
  "Mal": 30,
  "Normal": 60,
  "Muy bien": 80,
  "Excelente": 100,
};

export function mapDawn(value: string | null | undefined): number | null {
  if (!value) return null;
  return DAWN_MAP[value] ?? null;
}

/** Convierte un puntaje 1-5 a escala 0-100. */
export function scale5to100(v: number | null | undefined): number | null {
  if (typeof v !== "number" || v <= 0) return null;
  return Math.round(Math.max(0, Math.min(5, v)) * 20);
}

export function avg(values: number[]): number | null {
  if (!values.length) return null;
  return Math.round(values.reduce((a, b) => a + b, 0) / values.length);
}

export function clamp100(v: number): number {
  return Math.max(0, Math.min(100, Math.round(v)));
}

// ── A1 · Ánimo consolidado por día ──────────────────────────────────────────
export type DailyMood = { date: string; score: number | null; delta: number | null };

/**
 * Consolida TODOS los check-ins de un mismo día en un único valor para evitar
 * doble conteo: promedio de los registros disponibles (mañana y/o noche) ×20.
 * El delta intradía sólo existe si hay ambos registros.
 */
export function consolidateDailyMood(rows: RawCheckin[]): DailyMood[] {
  const byDate = new Map<string, RawCheckin[]>();
  for (const r of rows) {
    if (!byDate.has(r.checkin_date)) byDate.set(r.checkin_date, []);
    byDate.get(r.checkin_date)!.push(r);
  }
  const out: DailyMood[] = [];
  for (const [date, list] of byDate) {
    const moods = list.map((r) => scale5to100(r.mood_score)).filter((v): v is number => v !== null);
    const morning = list.find((r) => r.mode === "morning");
    const night = list.find((r) => r.mode === "night" || r.mode === null);
    const mS = scale5to100(morning?.mood_score);
    const nS = scale5to100(night?.mood_score);
    out.push({
      date,
      score: avg(moods),
      delta: mS !== null && nS !== null ? nS - mS : null,
    });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

// ── B1 · Balance emocional nocturno ─────────────────────────────────────────
export function emotionalBalance(rows: RawCheckin[]): number | null {
  const perNight: number[] = [];
  for (const r of rows) {
    if (!(r.mode === "night" || r.mode === null)) continue;
    if (!Array.isArray(r.emotions) || r.emotions.length === 0) continue;
    let pos = 0;
    let neg = 0;
    for (const e of r.emotions) {
      if (POSITIVE_EMOTIONS.has(e)) pos++;
      else if (NEGATIVE_EMOTIONS.has(e)) neg++;
    }
    if (pos + neg > 0) perNight.push((pos / (pos + neg)) * 100);
  }
  return avg(perNight);
}

// ── S0 · Calidad de sueño auto-reportada ────────────────────────────────────
export function sleepQuality(checkins: RawCheckin[], logs: RawSleepLog[]): number | null {
  const values: number[] = [];
  for (const c of checkins) {
    const v = scale5to100(c.sleep_score);
    if (v !== null) values.push(v);
  }
  for (const l of logs) {
    const v = normalizeAuditScore(l.score);
    if (v !== null) values.push(v);
  }
  return avg(values);
}

/** Acepta puntajes 1-5 o 0-100 y los lleva a 0-100. */
export function normalizeAuditScore(score: number | null | undefined): number | null {
  if (typeof score !== "number" || score < 0) return null;
  if (score === 0) return 0;
  return score <= 5 ? scale5to100(score) : clamp100(score);
}

// ── S1 · Higiene del sueño + pesadillas + registro de sueños ────────────────
const NIGHTMARE_KEYS = ["pesadilla", "nightmare", "terror", "angustia"];

export function nightmareScore(dreams: RawDream[]): number | null {
  if (!dreams.length) return null;
  let bad = 0;
  for (const d of dreams) {
    const tags = [...(d.themes ?? []), ...(d.emotions ?? [])].map((t) => t.toLowerCase());
    if (tags.some((t) => NIGHTMARE_KEYS.some((k) => t.includes(k)))) bad++;
  }
  return clamp100(100 - (bad / dreams.length) * 100);
}

/**
 * S1 = higiene ×0.5 + pesadillas ×0.3 + cobertura de registro de sueños ×0.2
 * Los componentes ausentes se renormalizan entre sí.
 */
export function sleepHygieneComposite(
  audits: RawHygieneAudit[],
  dreams: RawDream[],
  windowDays: number,
): number | null {
  const hygiene = avg(audits.map((a) => normalizeAuditScore(a.score)).filter((v): v is number => v !== null));
  const nightmares = nightmareScore(dreams);
  const dreamDays = new Set(dreams.map((d) => d.dream_date)).size;
  const dreamCoverage = dreams.length ? clamp100((dreamDays / windowDays) * 100) : null;

  const parts: Array<[number | null, number]> = [
    [hygiene, 0.5],
    [nightmares, 0.3],
    [dreamCoverage, 0.2],
  ];
  const present = parts.filter(([v]) => v !== null) as Array<[number, number]>;
  if (!present.length) return null;
  const totalW = present.reduce((s, [, w]) => s + w, 0);
  return clamp100(present.reduce((s, [v, w]) => s + v * w, 0) / totalW);
}

// ── R1 · Uso de recursos (tope 3 acciones/día) ──────────────────────────────
export const RESOURCE_DAILY_CAP = 3;

export function countCappedActions(dates: string[], cap = RESOURCE_DAILY_CAP): number {
  const perDay = new Map<string, number>();
  for (const d of dates) perDay.set(d, (perDay.get(d) ?? 0) + 1);
  let total = 0;
  for (const n of perDay.values()) total += Math.min(n, cap);
  return total;
}

export function resourceTier(actions: number): number | null {
  if (actions <= 0) return null;
  if (actions >= 10) return 100;
  if (actions >= 6) return 80;
  if (actions >= 3) return 60;
  return 35;
}

// ── T1 · Tratamiento ────────────────────────────────────────────────────────
export function therapyAttendance(sessionsIn14d: number, inTherapy: boolean): number | null {
  if (!inTherapy) return null;
  return sessionsIn14d > 0 ? 100 : 35;
}

export function medicationAdherence(logs: { taken: boolean | null }[], hasMedications: boolean): number | null {
  if (!hasMedications || logs.length === 0) return null;
  const taken = logs.filter((l) => l.taken === true).length;
  return clamp100((taken / logs.length) * 100);
}

export function notesCreatedScore(count: number, inTherapy: boolean): number | null {
  if (!inTherapy) return null;
  if (count <= 0) return 0;
  if (count >= 3) return 100;
  if (count === 2) return 75;
  return 50;
}

export function notesSharedScore(sharedCount: number, totalCount: number, inTherapy: boolean): number | null {
  if (!inTherapy || totalCount === 0) return null;
  return clamp100((sharedCount / totalCount) * 100);
}

// ── Modulador clínico ───────────────────────────────────────────────────────
const MODULATOR_TESTS = ["BDI", "BAI", "PHQ", "GAD"];

export function isModulatorTest(testType: string): boolean {
  const t = (testType || "").toUpperCase();
  return MODULATOR_TESTS.some((k) => t.includes(k));
}

export function parseSeverity(sev: string | null | undefined): Severity | null {
  if (!sev) return null;
  const s = sev.toLowerCase();
  if (s.includes("mínim") || s.includes("minim") || s.includes("ausente")) return "minimal";
  if (s.includes("leve")) return "mild";
  if (s.includes("modera")) return "moderate";
  if (s.includes("sever") || s.includes("grave") || s.includes("extrem")) return "severe";
  return null;
}

/**
 * Penalización con decaimiento: peso completo hasta 30 días, decae linealmente
 * hasta 0 a los 45 días. Sólo moderado (−8) y severo (−15) penalizan.
 */
export function modulatorPenalty(severity: Severity | null, ageDays: number): number {
  if (severity !== "moderate" && severity !== "severe") return 0;
  if (ageDays >= MODULATOR_STALE_DAYS) return 0;
  const base = severity === "severe" ? 15 : 8;
  if (ageDays <= MODULATOR_FULL_DAYS) return base;
  const decay = 1 - (ageDays - MODULATOR_FULL_DAYS) / (MODULATOR_STALE_DAYS - MODULATOR_FULL_DAYS);
  return Math.round(base * decay);
}
