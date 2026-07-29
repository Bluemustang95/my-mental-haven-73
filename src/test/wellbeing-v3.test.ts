import { describe, it, expect } from "vitest";
import { computeWellbeingV3 } from "@/lib/wellbeing/compute";
import {
  consolidateDailyMood,
  countCappedActions,
  emotionalBalance,
  mapDawn,
  medicationAdherence,
  modulatorPenalty,
  resourceTier,
  sleepHygieneComposite,
} from "@/lib/wellbeing/normalize";
import { EMPTY_RAW, type RawCheckin, type WellbeingRaw } from "@/lib/wellbeing/types";

const TODAY = new Date("2026-07-29T12:00:00");
function d(n: number) {
  const x = new Date(TODAY);
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() - n);
  const tz = new Date(x.getTime() - x.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}
function raw(partial: Partial<WellbeingRaw>): WellbeingRaw {
  return { today: TODAY, ...EMPTY_RAW, ...partial };
}
function checkin(date: string, o: Partial<RawCheckin> = {}): RawCheckin {
  return { checkin_date: date, mode: "night", mood_score: null, sleep_score: null, dawn_score: null, emotions: null, ...o };
}

describe("normalización de sub-ítems", () => {
  it("mapea la sensación al despertar", () => {
    expect(mapDawn("Pésimo")).toBe(10);
    expect(mapDawn("Normal")).toBe(60);
    expect(mapDawn("Excelente")).toBe(100);
    expect(mapDawn("otra cosa")).toBeNull();
  });

  it("consolida mañana y noche del mismo día en un solo valor", () => {
    const rows = [
      checkin(d(0), { mode: "morning", mood_score: 3 }),
      checkin(d(0), { mode: "night", mood_score: 5 }),
    ];
    const [day] = consolidateDailyMood(rows);
    expect(day.score).toBe(80); // (60 + 100) / 2
    expect(day.delta).toBe(40); // noche − mañana
  });

  it("calcula balance emocional sólo con check-ins de noche", () => {
    const rows = [
      checkin(d(0), { mode: "night", emotions: ["Calma", "Alegría", "Ansiedad"] }),
      checkin(d(1), { mode: "morning", emotions: ["Ansiedad"] }),
    ];
    expect(emotionalBalance(rows)).toBe(67);
  });

  it("aplica el tope de 3 acciones por día en Recursos", () => {
    const dates = [d(0), d(0), d(0), d(0), d(0), d(1)];
    expect(countCappedActions(dates)).toBe(4);
    expect(resourceTier(4)).toBe(60);
    expect(resourceTier(0)).toBeNull();
    expect(resourceTier(12)).toBe(100);
  });

  it("renormaliza S1 cuando faltan componentes", () => {
    const onlyHygiene = sleepHygieneComposite([{ audit_date: d(0), score: 80 }], [], 7);
    expect(onlyHygiene).toBe(80);
    expect(sleepHygieneComposite([], [], 7)).toBeNull();
  });

  it("no penaliza adherencia si no hay medicación cargada", () => {
    expect(medicationAdherence([{ taken: true }], false)).toBeNull();
    expect(medicationAdherence([{ taken: true }, { taken: false }], true)).toBe(50);
  });

  it("aplica decaimiento al modulador clínico", () => {
    expect(modulatorPenalty("severe", 5)).toBe(15);
    expect(modulatorPenalty("moderate", 5)).toBe(8);
    expect(modulatorPenalty("moderate", 37)).toBe(4);
    expect(modulatorPenalty("severe", 45)).toBe(0);
    expect(modulatorPenalty("mild", 1)).toBe(0);
  });
});

describe("umbral de fiabilidad 3/7", () => {
  it("devuelve null con menos de 3 días registrados", () => {
    const snap = computeWellbeingV3(
      raw({ checkins: [checkin(d(0), { mood_score: 5 }), checkin(d(1), { mood_score: 5 })] }),
    );
    expect(snap.wellbeingScore).toBeNull();
    expect(snap.hasEnoughData).toBe(false);
    expect(snap.daysMissing).toBe(1);
  });

  it("calcula el índice con 3 días o más", () => {
    const snap = computeWellbeingV3(
      raw({
        checkins: [
          checkin(d(0), { mood_score: 5, sleep_score: 5, dawn_score: "Excelente", emotions: ["Calma"] }),
          checkin(d(1), { mood_score: 5, sleep_score: 5, dawn_score: "Excelente", emotions: ["Calma"] }),
          checkin(d(2), { mood_score: 5, sleep_score: 5, dawn_score: "Excelente", emotions: ["Calma"] }),
        ],
      }),
    );
    expect(snap.hasEnoughData).toBe(true);
    expect(snap.wellbeingScore).toBe(100);
  });
});

describe("renormalización proporcional", () => {
  it("excluye pilares sin datos en vez de puntuarlos 0", () => {
    // Sólo ánimo: sin sueño ni emociones → ánimo debe llevarse el 100% del peso
    const snap = computeWellbeingV3(
      raw({
        checkins: [
          checkin(d(0), { mood_score: 3 }),
          checkin(d(1), { mood_score: 3 }),
          checkin(d(2), { mood_score: 3 }),
        ],
      }),
    );
    expect(snap.wellbeingScore).toBe(60);
    expect(snap.pillars.mood.appliedWeight).toBe(100);
    expect(snap.pillars.sleep.appliedWeight).toBe(0);
    expect(snap.pillars.balance.score).toBeNull();
  });

  it("mantiene el Índice de Cuidado separado del de Bienestar", () => {
    const snap = computeWellbeingV3(
      raw({
        checkins: [
          checkin(d(0), { mood_score: 1 }),
          checkin(d(1), { mood_score: 1 }),
          checkin(d(2), { mood_score: 1 }),
        ],
        activities: Array.from({ length: 12 }, (_, i) => ({ date: `${d(i % 6)}T10:00:00Z`, kind: "habit" })),
      }),
    );
    expect(snap.wellbeingScore).toBe(20);
    expect(snap.careScore).toBe(100); // el uso de recursos NO infla el bienestar
  });
});

describe("modulador clínico", () => {
  it("resta puntos al bienestar sin tocar el score crudo", () => {
    const snap = computeWellbeingV3(
      raw({
        checkins: [
          checkin(d(0), { mood_score: 5 }),
          checkin(d(1), { mood_score: 5 }),
          checkin(d(2), { mood_score: 5 }),
        ],
        tests: [{ test_type: "BDI-II", severity: "Severa", created_at: new Date(TODAY.getTime() - 5 * 86400000).toISOString() }],
      }),
    );
    expect(snap.wellbeingRaw).toBe(100);
    expect(snap.modulator.penalty).toBe(15);
    expect(snap.wellbeingScore).toBe(85);
  });
});

describe("serie diaria", () => {
  it("devuelve 30 puntos ordenados terminando hoy", () => {
    const snap = computeWellbeingV3(raw({}));
    expect(snap.series).toHaveLength(30);
    expect(snap.series[29].date).toBe(d(0));
    expect(snap.series[0].date).toBe(d(29));
  });
});
