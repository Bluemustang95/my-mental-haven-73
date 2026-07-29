// Bandas de color compartidas para el Índice de Bienestar v3.
// Se usan en el calendario mensual y en cualquier vista que pinte un score 0-100.
import type { DailyPoint } from "./types";

export type FocusKey = "wellbeing" | "mood" | "sleep" | "resources" | "treatment";

export const FOCUS_LABELS: Record<FocusKey, string> = {
  wellbeing: "Índice de Bienestar",
  mood: "Ánimo y balance",
  sleep: "Sueño y descanso",
  resources: "Uso de recursos",
  treatment: "Tratamiento",
};

export type Band = { id: string; label: string; color: string; min: number };

export const BANDS: Band[] = [
  { id: "high", label: "Alto (70-100)", color: "#87d3a4", min: 70 },
  { id: "mid", label: "Medio (45-69)", color: "#facb60", min: 45 },
  { id: "low", label: "Bajo (0-44)", color: "#f0928b", min: 0 },
];

export function bandFor(score: number | null | undefined): Band | null {
  if (score === null || score === undefined || Number.isNaN(score)) return null;
  return BANDS.find((b) => score >= b.min) ?? BANDS[BANDS.length - 1];
}

/** Devuelve el valor del foco elegido para un día de la serie. */
export function focusValue(point: DailyPoint | undefined, focus: FocusKey): number | null {
  if (!point) return null;
  switch (focus) {
    case "wellbeing":
      return point.wellbeing;
    case "mood":
      return point.mood ?? point.balance;
    case "sleep":
      return point.sleep;
    case "resources":
      return point.resources;
    case "treatment":
      return point.treatment;
  }
}

/** Índice rápido fecha → punto de la serie. */
export function indexSeries(series: DailyPoint[] | undefined): Map<string, DailyPoint> {
  const m = new Map<string, DailyPoint>();
  (series ?? []).forEach((p) => m.set(p.date, p));
  return m;
}
