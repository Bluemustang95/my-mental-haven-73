import { describe, expect, it } from "vitest";
import {
  MIN_PAIRS,
  buildCorrelationReport,
  correlate,
  pValue,
  pairSeries,
  rank,
  spearman,
  strengthOf,
} from "@/lib/wellbeing/correlations";
import type { DailyPoint } from "@/lib/wellbeing/types";

function pt(date: string, over: Partial<DailyPoint> = {}): DailyPoint {
  return {
    date,
    mood: null, balance: null, sleep: null, resources: null, treatment: null,
    wellbeing: null, hasCheckin: true,
    ...over,
  };
}

function seriesOf(pairs: Array<[number | null, number | null]>): DailyPoint[] {
  return pairs.map(([sleep, mood], i) =>
    pt(`2026-01-${String(i + 1).padStart(2, "0")}`, { sleep, mood }),
  );
}

describe("rank", () => {
  it("asigna rangos 1..n", () => {
    expect(rank([10, 30, 20])).toEqual([1, 3, 2]);
  });
  it("promedia empates", () => {
    expect(rank([5, 5, 9])).toEqual([1.5, 1.5, 3]);
  });
});

describe("spearman", () => {
  it("detecta monotonía perfecta creciente aunque no sea lineal", () => {
    const xs = [1, 2, 3, 4, 5];
    const ys = [1, 4, 9, 16, 25];
    expect(spearman(xs, ys)).toBeCloseTo(1, 6);
  });
  it("detecta monotonía perfecta inversa", () => {
    expect(spearman([1, 2, 3, 4], [9, 7, 5, 1])).toBeCloseTo(-1, 6);
  });
  it("devuelve null sin varianza", () => {
    expect(spearman([2, 2, 2], [1, 5, 9])).toBeNull();
  });
});

describe("pValue", () => {
  it("rho fuerte con n grande es significativo", () => {
    expect(pValue(0.9, 20)).toBeLessThan(0.05);
  });
  it("rho débil con n chico no es significativo", () => {
    expect(pValue(0.1, 12)).toBeGreaterThan(0.05);
  });
});

describe("pairSeries", () => {
  it("descarta días con huecos", () => {
    const s = seriesOf([[50, 60], [null, 70], [80, null], [90, 40]]);
    const { xs, ys } = pairSeries(s, "sleep", "mood", 0);
    expect(xs).toEqual([50, 90]);
    expect(ys).toEqual([60, 40]);
  });
  it("aplica lag +1 (X de ayer contra Y de hoy)", () => {
    const s = seriesOf([[50, 10], [60, 20], [70, 30]]);
    const { xs, ys } = pairSeries(s, "sleep", "mood", 1);
    expect(xs).toEqual([50, 60]);
    expect(ys).toEqual([20, 30]);
  });
});

describe("correlate", () => {
  it("no devuelve nada por debajo del mínimo de pares", () => {
    const s = seriesOf(Array.from({ length: MIN_PAIRS - 1 }, (_, i) => [i * 10, i * 9] as [number, number]));
    expect(correlate(s, "sleep", "mood", 0)).toBeNull();
  });
  it("devuelve resultado con n suficiente", () => {
    const s = seriesOf(Array.from({ length: 14 }, (_, i) => [i * 5, i * 6] as [number, number]));
    const r = correlate(s, "sleep", "mood", 0);
    expect(r).not.toBeNull();
    expect(r!.n).toBe(14);
    expect(r!.rho).toBe(1);
    expect(r!.significant).toBe(true);
    expect(r!.strength).toBe("strong");
    expect(r!.direction).toBe("positive");
  });
});

describe("strengthOf", () => {
  it("clasifica por umbrales", () => {
    expect(strengthOf(0.1)).toBe("none");
    expect(strengthOf(-0.3)).toBe("weak");
    expect(strengthOf(0.5)).toBe("moderate");
    expect(strengthOf(-0.8)).toBe("strong");
  });
});

describe("buildCorrelationReport", () => {
  it("sin datos suficientes no reporta nada", () => {
    const rep = buildCorrelationReport(seriesOf([[10, 10], [20, 20]]));
    expect(rep.hasEnoughData).toBe(false);
    expect(rep.insights).toHaveLength(0);
    expect(rep.minPairs).toBe(MIN_PAIRS);
  });
  it("ordena por magnitud y filtra insights significativos", () => {
    const s = Array.from({ length: 20 }, (_, i) =>
      pt(`2026-02-${String(i + 1).padStart(2, "0")}`, {
        sleep: 40 + i * 3,
        mood: 35 + i * 3,
        balance: 50,
        resources: (i % 5) * 20,
      }),
    );
    const rep = buildCorrelationReport(s);
    expect(rep.hasEnoughData).toBe(true);
    expect(rep.maxPairs).toBeGreaterThanOrEqual(19);
    const mags = rep.results.map((r) => Math.abs(r.rho));
    expect([...mags].sort((a, b) => b - a)).toEqual(mags);
    expect(rep.insights.every((r) => r.significant && r.strength !== "none")).toBe(true);
  });
});
