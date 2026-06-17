import { useCallback } from "react";

export function useHaptics(enabled: boolean) {
  const vibrate = (pattern: number | number[]) => {
    if (!enabled) return;
    if (typeof navigator === "undefined" || !navigator.vibrate) return;
    try {
      navigator.vibrate(pattern);
    } catch {
      // noop
    }
  };

  return {
    inhale: () => vibrate([20, 40, 20]),
    hold: () => vibrate(0),
    exhale: () => vibrate(180),
    tap: () => vibrate(10),
  };
}

type Pattern = "tick" | "confirm" | "celebrate" | "warn";

const PATTERNS: Record<Pattern, number | number[]> = {
  tick: 12,
  confirm: 18,
  celebrate: [20, 40, 20, 40, 30],
  warn: [30, 60, 30],
};

/** Single-pattern haptic pulse, always-on. Use for one-shot UX feedback. */
export function useHapticPulse() {
  return useCallback((pattern: Pattern = "tick") => {
    try {
      if (typeof navigator === "undefined") return;
      navigator.vibrate?.(PATTERNS[pattern]);
    } catch {
      // no-op
    }
  }, []);
}
