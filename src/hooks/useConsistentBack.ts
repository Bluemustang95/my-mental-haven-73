import { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

type BackNavigationState = {
  returnTo?: string;
  returnState?: unknown;
};

export function useConsistentBack(fallback: string) {
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(() => {
    const state = location.state as BackNavigationState | null;
    if (state?.returnTo) {
      navigate(state.returnTo, { state: state.returnState });
      return;
    }
    navigate(fallback);
  }, [fallback, location.state, navigate]);
}

export function calendarModuleState(returnTo: string, returnState?: unknown): BackNavigationState {
  return { returnTo, returnState };
}