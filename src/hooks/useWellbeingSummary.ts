import { useEffect, useState } from "react";
import { loadWellbeingV3 } from "@/lib/wellbeing/fetch";
import { loadWellbeingConfig } from "@/lib/wellbeing/config";
import { buildWellbeingSummary } from "@/lib/wellbeing/summary";
import { buildCorrelationReport } from "@/lib/wellbeing/correlations";
import type { WellbeingSnapshotV3 } from "@/lib/wellbeing/types";

const TTL_MS = 5 * 60 * 1000;
let cache: { ts: number; summary: string | null; snapshot: WellbeingSnapshotV3 } | null = null;
let inflight: Promise<typeof cache> | null = null;

/** Carga (perezosa y cacheada 5 min) el snapshot v3 y su resumen textual. */
export async function getWellbeingSummary(): Promise<{ summary: string | null; snapshot: WellbeingSnapshotV3 } | null> {
  if (cache && Date.now() - cache.ts < TTL_MS) return cache;
  if (!inflight) {
    inflight = (async () => {
      try {
        const cfg = await loadWellbeingConfig();
        const snapshot = await loadWellbeingV3(cfg);
        const report = buildCorrelationReport(snapshot.series);
        cache = { ts: Date.now(), snapshot, summary: buildWellbeingSummary(snapshot, report) };
      } catch {
        cache = null;
      }
      inflight = null;
      return cache;
    })();
  }
  return inflight;
}

export function clearWellbeingSummaryCache() {
  cache = null;
  inflight = null;
}

/**
 * Devuelve el resumen del Índice de Bienestar v3 sólo cuando `enabled`
 * (consentimiento de contexto + compartir snapshot en Resmita).
 */
export function useWellbeingSummary(enabled: boolean): string | null {
  const [summary, setSummary] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      setSummary(null);
      return;
    }
    let alive = true;
    getWellbeingSummary().then((r) => {
      if (alive) setSummary(r?.summary ?? null);
    });
    return () => {
      alive = false;
    };
  }, [enabled]);

  return summary;
}
