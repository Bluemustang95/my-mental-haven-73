// ============================================================================
// Fase 2 · Motor de correlaciones (Spearman) sobre la serie diaria del índice.
// Reglas duras:
//   · n mínimo de pares completos = 10 (si no, no se muestra nada).
//   · Rangos con empates promediados (Spearman correcto, no atajo d²).
//   · Bidireccional: lag 0 (mismo día) y lag +1 (X de ayer → Y de hoy).
//   · Significancia aproximada con t de Student (df = n-2), umbral p < 0.05.
// ============================================================================
import type { DailyPoint } from "./types";

export const MIN_PAIRS = 10;
export const P_THRESHOLD = 0.05;

/** Rangos 1..n con empates promediados. */
export function rank(values: number[]): number[] {
  const idx = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0]);
  const out = new Array<number>(values.length);
  let i = 0;
  while (i < idx.length) {
    let j = i;
    while (j + 1 < idx.length && idx[j + 1][0] === idx[i][0]) j++;
    const avgRank = (i + j) / 2 + 1;
    for (let k = i; k <= j; k++) out[idx[k][1]] = avgRank;
    i = j + 1;
  }
  return out;
}

function pearsonRaw(xs: number[], ys: number[]): number | null {
  const n = xs.length;
  if (n < 2) return null;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;
  let num = 0, dx = 0, dy = 0;
  for (let i = 0; i < n; i++) {
    const a = xs[i] - mx, b = ys[i] - my;
    num += a * b; dx += a * a; dy += b * b;
  }
  const den = Math.sqrt(dx * dy);
  if (!den) return null;
  return Math.max(-1, Math.min(1, num / den));
}

/** Coeficiente de Spearman (rho) sobre dos vectores del mismo largo. */
export function spearman(xs: number[], ys: number[]): number | null {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return null;
  return pearsonRaw(rank(xs.slice(0, n)), rank(ys.slice(0, n)));
}

/** p-valor bilateral aproximado para rho con df = n-2 (t de Student). */
export function pValue(rho: number, n: number): number {
  if (n <= 2) return 1;
  const a = Math.abs(rho);
  if (a >= 0.999999) return 0;
  const t = a * Math.sqrt((n - 2) / (1 - a * a));
  return 2 * studentTailT(t, n - 2);
}

/** Cola superior de la t de Student vía función beta incompleta regularizada. */
function studentTailT(t: number, df: number): number {
  const x = df / (df + t * t);
  return 0.5 * incompleteBeta(x, df / 2, 0.5);
}

function logGamma(z: number): number {
  const g = [76.18009172947146, -86.50532032941677, 24.01409824083091,
    -1.231739572450155, 0.1208650973866179e-2, -0.5395239384953e-5];
  let x = z, y = z, tmp = x + 5.5;
  tmp -= (x + 0.5) * Math.log(tmp);
  let ser = 1.000000000190015;
  for (let j = 0; j < 6; j++) ser += g[j] / ++y;
  return -tmp + Math.log((2.5066282746310005 * ser) / x);
}

function incompleteBeta(x: number, a: number, b: number): number {
  if (x <= 0) return 0;
  if (x >= 1) return 1;
  const front = Math.exp(
    logGamma(a + b) - logGamma(a) - logGamma(b) + a * Math.log(x) + b * Math.log(1 - x),
  );
  const useComplement = x > (a + 1) / (a + b + 2);
  if (useComplement) return 1 - incompleteBeta(1 - x, b, a);
  // Fracción continua de Lentz.
  let f = 1, c = 1, d = 0;
  for (let i = 0; i <= 200; i++) {
    const m = Math.floor(i / 2);
    let num: number;
    if (i === 0) num = 1;
    else if (i % 2 === 0) num = (m * (b - m) * x) / ((a + 2 * m - 1) * (a + 2 * m));
    else num = -((a + m) * (a + b + m) * x) / ((a + 2 * m) * (a + 2 * m + 1));
    d = 1 + num * d;
    if (Math.abs(d) < 1e-30) d = 1e-30;
    d = 1 / d;
    c = 1 + num / c;
    if (Math.abs(c) < 1e-30) c = 1e-30;
    f *= c * d;
    if (Math.abs(1 - c * d) < 1e-10) break;
  }
  return (front * (f - 1)) / a;
}

export type CorrelationStrength = "none" | "weak" | "moderate" | "strong";

export type CorrelationResult = {
  xKey: string;
  yKey: string;
  xLabel: string;
  yLabel: string;
  /** 0 = mismo día · 1 = X del día anterior contra Y de hoy. */
  lag: 0 | 1;
  rho: number;
  n: number;
  p: number;
  significant: boolean;
  strength: CorrelationStrength;
  direction: "positive" | "negative";
  /** Frase lista para mostrar al usuario. */
  message: string;
};

export function strengthOf(rho: number): CorrelationStrength {
  const a = Math.abs(rho);
  if (a < 0.2) return "none";
  if (a < 0.4) return "weak";
  if (a < 0.6) return "moderate";
  return "strong";
}

const STRENGTH_LABEL: Record<CorrelationStrength, string> = {
  none: "sin relación clara",
  weak: "relación leve",
  moderate: "relación moderada",
  strong: "relación fuerte",
};

export type MetricKey = keyof Pick<DailyPoint, "mood" | "sleep" | "balance" | "resources" | "treatment" | "wellbeing">;

export const METRIC_LABELS: Record<MetricKey, string> = {
  mood: "Ánimo",
  sleep: "Sueño",
  balance: "Balance emocional",
  resources: "Uso de recursos",
  treatment: "Tratamiento",
  wellbeing: "Índice de bienestar",
};

/** Pares completos (ambos valores presentes) aplicando el desfase indicado. */
export function pairSeries(
  series: DailyPoint[],
  xKey: MetricKey,
  yKey: MetricKey,
  lag: 0 | 1,
): { xs: number[]; ys: number[] } {
  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = lag; i < series.length; i++) {
    const x = series[i - lag][xKey];
    const y = series[i][yKey];
    if (x === null || y === null) continue;
    xs.push(x);
    ys.push(y);
  }
  return { xs, ys };
}

function buildMessage(xLabel: string, yLabel: string, lag: 0 | 1, rho: number, strength: CorrelationStrength): string {
  if (strength === "none") return `${xLabel} y ${yLabel} no muestran una relación clara en tus últimos registros.`;
  const dir = rho >= 0 ? "mejor" : "peor";
  const when = lag === 1 ? "al día siguiente" : "ese mismo día";
  return `Cuando tu ${xLabel.toLowerCase()} sube, tu ${yLabel.toLowerCase()} tiende a estar ${dir} ${when}.`;
}

/** Correlación de un par concreto. Devuelve null si no hay pares suficientes. */
export function correlate(
  series: DailyPoint[],
  xKey: MetricKey,
  yKey: MetricKey,
  lag: 0 | 1 = 0,
  minPairs = MIN_PAIRS,
): CorrelationResult | null {
  const { xs, ys } = pairSeries(series, xKey, yKey, lag);
  const n = xs.length;
  if (n < minPairs) return null;
  const rho = spearman(xs, ys);
  if (rho === null) return null;
  const p = pValue(rho, n);
  const strength = strengthOf(rho);
  return {
    xKey, yKey,
    xLabel: METRIC_LABELS[xKey],
    yLabel: METRIC_LABELS[yKey],
    lag,
    rho: Math.round(rho * 100) / 100,
    n,
    p: Math.round(p * 1000) / 1000,
    significant: p < P_THRESHOLD,
    strength,
    direction: rho >= 0 ? "positive" : "negative",
    message: buildMessage(METRIC_LABELS[xKey], METRIC_LABELS[yKey], lag, rho, strength),
  };
}

/** Pares candidatos con sentido clínico (bidireccionales donde aplica). */
const CANDIDATE_PAIRS: Array<[MetricKey, MetricKey, Array<0 | 1>]> = [
  ["sleep", "mood", [0, 1]],
  ["mood", "sleep", [1]],
  ["resources", "mood", [0, 1]],
  ["resources", "balance", [0, 1]],
  ["treatment", "mood", [0, 1]],
  ["balance", "sleep", [0, 1]],
  ["sleep", "balance", [1]],
  ["resources", "sleep", [1]],
];

export type CorrelationReport = {
  /** Todas las correlaciones calculables, ordenadas por |rho| descendente. */
  results: CorrelationResult[];
  /** Solo las significativas y con fuerza al menos leve. */
  insights: CorrelationResult[];
  /** Máximo de pares disponible entre todos los cruces (para el mensaje de cobertura). */
  maxPairs: number;
  hasEnoughData: boolean;
  minPairs: number;
};

export function buildCorrelationReport(
  series: DailyPoint[],
  minPairs = MIN_PAIRS,
): CorrelationReport {
  const results: CorrelationResult[] = [];
  let maxPairs = 0;
  for (const [x, y, lags] of CANDIDATE_PAIRS) {
    for (const lag of lags) {
      maxPairs = Math.max(maxPairs, pairSeries(series, x, y, lag).xs.length);
      const r = correlate(series, x, y, lag, minPairs);
      if (r) results.push(r);
    }
  }
  results.sort((a, b) => Math.abs(b.rho) - Math.abs(a.rho));
  const insights = results.filter((r) => r.significant && r.strength !== "none");
  return {
    results,
    insights,
    maxPairs,
    hasEnoughData: results.length > 0,
    minPairs,
  };
}

export function describeStrength(r: CorrelationResult): string {
  return `${STRENGTH_LABEL[r.strength]} ${r.direction === "positive" ? "positiva" : "inversa"}`;
}
