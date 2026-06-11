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
