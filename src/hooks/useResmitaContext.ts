import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { getResmitaContext, isResmitaHidden, type ResmitaScreenContext } from "@/lib/resmitaContextMap";
import { useResmitaStep } from "@/hooks/useResmitaStep";

export function useResmitaContext(): { hidden: boolean; ctx: ResmitaScreenContext; route: string } {
  const { pathname } = useLocation();
  const stepInfo = useResmitaStep();
  return useMemo(() => {
    const base = getResmitaContext(pathname);
    // Cuando un wizard publica un paso, priorizamos ese contexto sobre el de la ruta.
    const ctx: ResmitaScreenContext = stepInfo
      ? {
          ...base,
          screenTitle: stepInfo.stepTitle,
          screenPurpose: stepInfo.purpose,
          welcome: stepInfo.welcome ?? base.welcome,
        }
      : base;
    return { hidden: isResmitaHidden(pathname), ctx, route: pathname };
  }, [pathname, stepInfo]);
}

