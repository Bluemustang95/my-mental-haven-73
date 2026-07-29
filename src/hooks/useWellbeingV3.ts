import { useCallback, useEffect, useState } from "react";
import { loadWellbeingV3 } from "@/lib/wellbeing/fetch";
import { DEFAULT_CONFIG, type WellbeingConfig, type WellbeingSnapshotV3 } from "@/lib/wellbeing/types";
import { buildCorrelationReport, type CorrelationReport } from "@/lib/wellbeing/correlations";

export type WellbeingV3State = {
  snapshot: WellbeingSnapshotV3 | null;
  correlations: CorrelationReport | null;
  loading: boolean;
  reload: () => void;
};

/** Carga el Índice de Bienestar v3 + el reporte de correlaciones (Spearman). */
export function useWellbeingV3(
  userId?: string,
  config: WellbeingConfig = DEFAULT_CONFIG,
): WellbeingV3State {
  const [snapshot, setSnapshot] = useState<WellbeingSnapshotV3 | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    loadWellbeingV3(config, userId)
      .then((snap) => {
        if (!alive) return;
        setSnapshot(snap);
        setCorrelations(buildCorrelationReport(snap.series));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, nonce, config]);

  return { snapshot, correlations, loading, reload };
}
