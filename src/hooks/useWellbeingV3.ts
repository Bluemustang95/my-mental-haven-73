import { useCallback, useEffect, useState } from "react";
import { loadWellbeingV3 } from "@/lib/wellbeing/fetch";
import { type WellbeingConfig, type WellbeingSnapshotV3 } from "@/lib/wellbeing/types";
import { loadWellbeingConfig } from "@/lib/wellbeing/config";
import { buildCorrelationReport, type CorrelationReport } from "@/lib/wellbeing/correlations";

export type WellbeingV3State = {
  snapshot: WellbeingSnapshotV3 | null;
  correlations: CorrelationReport | null;
  config: WellbeingConfig | null;
  loading: boolean;
  reload: () => void;
};

/**
 * Carga el Índice de Bienestar v3 + el reporte de correlaciones (Spearman).
 * Si no se pasa `config`, usa la configuración editable desde el panel admin.
 */
export function useWellbeingV3(
  userId?: string,
  config?: WellbeingConfig,
): WellbeingV3State {
  const [snapshot, setSnapshot] = useState<WellbeingSnapshotV3 | null>(null);
  const [correlations, setCorrelations] = useState<CorrelationReport | null>(null);
  const [activeConfig, setActiveConfig] = useState<WellbeingConfig | null>(config ?? null);
  const [loading, setLoading] = useState(true);
  const [nonce, setNonce] = useState(0);

  const reload = useCallback(() => setNonce((n) => n + 1), []);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    (async () => {
      const cfg = config ?? (await loadWellbeingConfig());
      const snap = await loadWellbeingV3(cfg, userId);
      if (!alive) return;
      setActiveConfig(cfg);
      setSnapshot(snap);
      setCorrelations(buildCorrelationReport(snap.series));
    })()
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, nonce, config]);

  return { snapshot, correlations, config: activeConfig, loading, reload };
}
