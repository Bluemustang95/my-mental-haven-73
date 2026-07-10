export function pearson(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return null;
  const mx = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const my = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  if (!den) return null;
  const r = num / den;
  return Math.max(-1, Math.min(1, r));
}

export function interpretR(r: number | null): { label: string; color: string } {
  if (r === null) return { label: "sin datos", color: "#94a3b8" };
  const a = Math.abs(r);
  const dir = r >= 0 ? "positiva" : "negativa";
  if (a < 0.15) return { label: `conexión mínima`, color: "#94a3b8" };
  if (a < 0.35) return { label: `conexión leve ${dir}`, color: r >= 0 ? "#7cc2c8" : "#f59e0b" };
  if (a < 0.6) return { label: `conexión media ${dir}`, color: r >= 0 ? "#10b981" : "#f97316" };
  return { label: `conexión fuerte ${dir}`, color: r >= 0 ? "#16a34a" : "#ef4444" };
}
