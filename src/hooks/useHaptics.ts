import { useCallback } from "react";

type Pattern = "tick" | "confirm" | "celebrate" | "warn";

const PATTERNS: Record<Pattern, number | number[]> = {
  tick: 12,
  confirm: 18,
  celebrate: [20, 40, 20, 40, 30],
  warn: [30, 60, 30],
};

export function useHaptics() {
  return useCallback((pattern: Pattern = "tick") => {
    try {
      if (typeof navigator === "undefined") return;
      navigator.vibrate?.(PATTERNS[pattern]);
    } catch {
      // no-op
    }
  }, []);
}
