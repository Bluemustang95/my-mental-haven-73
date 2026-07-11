import { useLocation } from "react-router-dom";
import { useMemo } from "react";
import { getResmitaContext, isResmitaHidden, type ResmitaScreenContext } from "@/lib/resmitaContextMap";

export function useResmitaContext(): { hidden: boolean; ctx: ResmitaScreenContext; route: string } {
  const { pathname } = useLocation();
  return useMemo(
    () => ({ hidden: isResmitaHidden(pathname), ctx: getResmitaContext(pathname), route: pathname }),
    [pathname],
  );
}
