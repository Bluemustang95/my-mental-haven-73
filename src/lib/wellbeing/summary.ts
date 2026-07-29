// Resumen textual del Índice de Bienestar v3 para consumidores no visuales
// (Resmita y el motor de notificaciones).
import type { WellbeingSnapshotV3, AnyPillarKey } from "./types";
import type { CorrelationReport } from "./correlations";

const PILLAR_ES: Record<AnyPillarKey, string> = {
  mood: "ánimo",
  sleep: "sueño",
  balance: "balance emocional",
  resources: "uso de recursos",
  treatment: "tratamiento",
};

export function pillarLabel(key: AnyPillarKey | null): string | null {
  return key ? PILLAR_ES[key] : null;
}

/** Texto corto (1-2 líneas) con el estado del índice, apto para el prompt de Resmita. */
export function buildWellbeingSummary(
  snapshot: WellbeingSnapshotV3 | null,
  report?: CorrelationReport | null,
): string | null {
  if (!snapshot) return null;
  if (!snapshot.hasEnoughData) {
    return `índice de bienestar aún sin datos suficientes (${snapshot.daysWithCheckin}/${snapshot.minDays} días con check-in)`;
  }
  const parts: string[] = [];
  if (snapshot.wellbeingScore !== null) parts.push(`bienestar ${Math.round(snapshot.wellbeingScore)}/100`);
  if (snapshot.careScore !== null) parts.push(`cuidado ${Math.round(snapshot.careScore)}/100`);
  if (snapshot.delta) parts.push(`variación de ánimo ${snapshot.delta > 0 ? "+" : ""}${snapshot.delta}% vs. semana previa`);
  const weakest = pillarLabel(snapshot.weakestPillar);
  if (weakest) parts.push(`pilar más flojo: ${weakest}`);
  if (snapshot.modulator.penalty > 0 && snapshot.modulator.testType) {
    parts.push(`modulador clínico activo por ${snapshot.modulator.testType} (${snapshot.modulator.severity})`);
  }
  const top = report?.insights?.[0];
  if (top) parts.push(`asociación observada: ${top.text ?? ""}`.trim());
  return parts.length ? parts.join(" · ") : null;
}
