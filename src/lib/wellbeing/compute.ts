// ============================================================================
// Motor de cálculo del Índice de Bienestar v3 — función pura.
// ============================================================================
import {
  type AnyPillarKey,
  type ClinicalModulator,
  type DailyPoint,
  type PillarResult,
  type SubItems,
  type WellbeingConfig,
  type WellbeingRaw,
  type WellbeingSnapshotV3,
  COMBINED_WEIGHTS,
  DEFAULT_CONFIG,
  SERIES_DAYS,
  SLEEP_INNER,
} from "./types";
import {
  avg,
  clamp100,
  consolidateDailyMood,
  countCappedActions,
  emotionalBalance,
  isModulatorTest,
  mapDawn,
  medicationAdherence,
  modulatorPenalty,
  notesCreatedScore,
  notesSharedScore,
  parseSeverity,
  resourceTier,
  sleepHygieneComposite,
  sleepQuality,
  therapyAttendance,
} from "./normalize";

export function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function isoDate(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return tz.toISOString().slice(0, 10);
}

function daysAgoIso(today: Date, n: number) {
  return isoDate(new Date(startOfDay(today).getTime() - n * 86400000));
}

function dateOnly(ts: string) {
  return ts.slice(0, 10);
}

function renormalize<K extends string>(
  entries: Array<[K, number | null, number]>,
): { score: number | null; applied: Record<K, number> } {
  const applied = {} as Record<K, number>;
  for (const [k] of entries) applied[k] = 0;
  const present = entries.filter(([, v]) => v !== null) as Array<[K, number, number]>;
  if (!present.length) return { score: null, applied };
  const totalW = present.reduce((s, [, , w]) => s + w, 0);
  for (const [k, , w] of present) applied[k] = Math.round((w / totalW) * 100);
  const score = clamp100(present.reduce((s, [, v, w]) => s + v * w, 0) / totalW);
  return { score, applied };
}

/** Combina sub-ítems de un pilar promediando los presentes con pesos internos. */
function combineParts(parts: Array<[number | null, number]>): number | null {
  const present = parts.filter(([v]) => v !== null) as Array<[number, number]>;
  if (!present.length) return null;
  const totalW = present.reduce((s, [, w]) => s + w, 0);
  return clamp100(present.reduce((s, [v, w]) => s + v * w, 0) / totalW);
}

export function computeWellbeingV3(
  raw: WellbeingRaw,
  config: WellbeingConfig = DEFAULT_CONFIG,
): WellbeingSnapshotV3 {
  const today = startOfDay(raw.today ?? new Date());
  const win = config.windowDays;
  const cutoff7 = daysAgoIso(today, win - 1);
  const cutoff14 = daysAgoIso(today, 13);

  const checkins7 = raw.checkins.filter((c) => c.checkin_date >= cutoff7);
  const dailyMood = consolidateDailyMood(checkins7);

  // ── Umbral de fiabilidad ──
  const daysWithCheckin = new Set(checkins7.map((c) => c.checkin_date)).size;
  const hasEnoughData = daysWithCheckin >= config.minDays;
  const daysMissing = Math.max(0, config.minDays - daysWithCheckin);

  // ── Sub-ítems ──
  const A1 = avg(dailyMood.map((d) => d.score).filter((v): v is number => v !== null));
  const A1Delta = avg(dailyMood.map((d) => d.delta).filter((v): v is number => v !== null));
  const B1 = emotionalBalance(checkins7);

  const sleepLogs7 = raw.sleepLogs.filter((l) => l.log_date >= cutoff7);
  const audits7 = raw.hygieneAudits.filter((a) => a.audit_date >= cutoff7);
  const dreams7 = raw.dreams.filter((d) => d.dream_date >= cutoff7);
  const S0 = sleepQuality(checkins7, sleepLogs7);
  const S1 = sleepHygieneComposite(audits7, dreams7, win);
  const S2 = avg(checkins7.map((c) => mapDawn(c.dawn_score)).filter((v): v is number => v !== null));

  const acts7 = raw.activities.filter((a) => dateOnly(a.date) >= cutoff7).map((a) => dateOnly(a.date));
  const R1 = resourceTier(countCappedActions(acts7));

  const sessions14 = raw.sessionNotes.filter((s) => s.session_date >= cutoff14).length;
  const T1A = therapyAttendance(sessions14, raw.inTherapy);
  const medLogs7 = raw.medLogs.filter((m) => m.log_date >= cutoff7);
  const T1B = medicationAdherence(medLogs7, raw.hasMedications);
  const prep14 = raw.prepNotes.filter((n) => dateOnly(n.created_at) >= cutoff14);
  const T1C = notesCreatedScore(prep14.length + sessions14, raw.inTherapy);
  const T1D = notesSharedScore(prep14.filter((n) => !!n.shared_at).length, prep14.length, raw.inTherapy);

  const subItems: SubItems = { A1, A1Delta, B1, S0, S1, S2, R1, T1A, T1B, T1C, T1D };

  // ── Pilares ──
  const moodScore = A1;
  const sleepScore = combineParts([
    [S0, SLEEP_INNER.S0],
    [S2, SLEEP_INNER.S2],
    [S1, SLEEP_INNER.S1],
  ]);
  const balanceScore = B1;
  const resourcesScore = R1;
  const treatmentScore = combineParts([
    [T1A, 40],
    [T1B, 35],
    [T1C, 15],
    [T1D, 10],
  ]);

  // ── Índice de Bienestar (SENTIR) ──
  const wb = renormalize<"mood" | "sleep" | "balance">([
    ["mood", hasEnoughData ? moodScore : null, config.wellbeingWeights.mood],
    ["sleep", hasEnoughData ? sleepScore : null, config.wellbeingWeights.sleep],
    ["balance", hasEnoughData ? balanceScore : null, config.wellbeingWeights.balance],
  ]);

  // ── Índice de Cuidado (HACER) ──
  const care = renormalize<"resources" | "treatment">([
    ["resources", resourcesScore, config.careWeights.resources],
    ["treatment", treatmentScore, config.careWeights.treatment],
  ]);

  // ── Modulador clínico ──
  const modulator = computeModulator(raw, today, config.modulatorEnabled);
  const wellbeingRaw = hasEnoughData ? wb.score : null;
  const wellbeingScore =
    wellbeingRaw === null ? null : clamp100(wellbeingRaw - modulator.penalty);

  // ── Lectura combinada opcional ──
  const combined = renormalize<"mood" | "sleep" | "resources" | "treatment">([
    ["mood", hasEnoughData ? moodScore : null, COMBINED_WEIGHTS.mood],
    ["sleep", hasEnoughData ? sleepScore : null, COMBINED_WEIGHTS.sleep],
    ["resources", resourcesScore, COMBINED_WEIGHTS.resources],
    ["treatment", treatmentScore, COMBINED_WEIGHTS.treatment],
  ]);
  const combinedScore = hasEnoughData ? combined.score : null;

  const pillars: Record<AnyPillarKey, PillarResult> = {
    mood: {
      key: "mood",
      score: moodScore,
      baseWeight: config.wellbeingWeights.mood,
      appliedWeight: wb.applied.mood,
      parts: [{ key: "A1", label: "Ánimo diario consolidado", value: A1, innerWeight: 100 }],
    },
    sleep: {
      key: "sleep",
      score: sleepScore,
      baseWeight: config.wellbeingWeights.sleep,
      appliedWeight: wb.applied.sleep,
      parts: [
        { key: "S0", label: "Calidad de sueño", value: S0, innerWeight: SLEEP_INNER.S0 },
        { key: "S2", label: "Sensación al despertar", value: S2, innerWeight: SLEEP_INNER.S2 },
        { key: "S1", label: "Higiene y sueños", value: S1, innerWeight: SLEEP_INNER.S1 },
      ],
    },
    balance: {
      key: "balance",
      score: balanceScore,
      baseWeight: config.wellbeingWeights.balance,
      appliedWeight: wb.applied.balance,
      parts: [{ key: "B1", label: "Balance emocional nocturno", value: B1, innerWeight: 100 }],
    },
    resources: {
      key: "resources",
      score: resourcesScore,
      baseWeight: config.careWeights.resources,
      appliedWeight: care.applied.resources,
      parts: [{ key: "R1", label: "Uso de recursos", value: R1, innerWeight: 100 }],
    },
    treatment: {
      key: "treatment",
      score: treatmentScore,
      baseWeight: config.careWeights.treatment,
      appliedWeight: care.applied.treatment,
      parts: [
        { key: "T1A", label: "Asistencia a terapia", value: T1A, innerWeight: 40 },
        { key: "T1B", label: "Adherencia a medicación", value: T1B, innerWeight: 35 },
        { key: "T1C", label: "Notas creadas", value: T1C, innerWeight: 15 },
        { key: "T1D", label: "Notas compartidas", value: T1D, innerWeight: 10 },
      ],
    },
  };

  // ── Serie diaria (30 días) ──
  const series = buildSeries(raw, today, config);

  // ── Trend 7 días (ánimo consolidado, 0 = sin registro) ──
  const trend: number[] = [];
  for (let i = win - 1; i >= 0; i--) {
    const ds = daysAgoIso(today, i);
    trend.push(dailyMood.find((d) => d.date === ds)?.score ?? 0);
  }

  // ── Delta vs. 7 días previos ──
  const prevRows = raw.checkins.filter((c) => c.checkin_date < cutoff7 && c.checkin_date >= daysAgoIso(today, win * 2 - 1));
  const prevMood = avg(consolidateDailyMood(prevRows).map((d) => d.score).filter((v): v is number => v !== null));
  let delta = 0;
  if (prevMood && A1) {
    const rawDelta = Math.round(((A1 - prevMood) / prevMood) * 100);
    delta = Math.abs(rawDelta) > 2 ? rawDelta : 0;
  }

  const wbPresent = (["mood", "sleep", "balance"] as const)
    .map((k) => [k, pillars[k].score] as const)
    .filter(([, v]) => v !== null) as Array<readonly [AnyPillarKey, number]>;
  const weakestPillar = wbPresent.length
    ? wbPresent.reduce((min, cur) => (cur[1] < min[1] ? cur : min))[0]
    : null;

  return {
    wellbeingScore,
    wellbeingRaw,
    careScore: care.score,
    combinedScore,
    delta,
    daysWithCheckin,
    minDays: config.minDays,
    hasEnoughData,
    daysMissing,
    pillars,
    subItems,
    modulator,
    series,
    trend,
    weakestPillar,
    message: buildMessage({ hasEnoughData, daysMissing, wellbeingScore, weakestPillar, pillars, modulator }),
  };
}

function computeModulator(raw: WellbeingRaw, today: Date, enabled: boolean): ClinicalModulator {
  const empty: ClinicalModulator = { testType: null, severity: null, ageDays: null, penalty: 0, stale: false };
  if (!enabled) return empty;
  const candidates = raw.tests
    .filter((t) => isModulatorTest(t.test_type))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
  if (!candidates.length) return empty;

  let best: ClinicalModulator = empty;
  for (const t of candidates) {
    const severity = parseSeverity(t.severity);
    const ageDays = Math.floor((today.getTime() - new Date(t.created_at).getTime()) / 86400000);
    const penalty = modulatorPenalty(severity, ageDays);
    if (penalty > best.penalty) {
      best = { testType: t.test_type, severity, ageDays, penalty, stale: false };
    }
  }
  if (best.penalty === 0) {
    const latest = candidates[0];
    const ageDays = Math.floor((today.getTime() - new Date(latest.created_at).getTime()) / 86400000);
    const severity = parseSeverity(latest.severity);
    return {
      testType: latest.test_type,
      severity,
      ageDays,
      penalty: 0,
      stale: ageDays >= 45 && (severity === "moderate" || severity === "severe"),
    };
  }
  return best;
}

/** Serie diaria de 30 días para el calendario y los gráficos de tendencia. */
function buildSeries(raw: WellbeingRaw, today: Date, config: WellbeingConfig): DailyPoint[] {
  const out: DailyPoint[] = [];
  for (let i = SERIES_DAYS - 1; i >= 0; i--) {
    const date = daysAgoIso(today, i);
    const dayCheckins = raw.checkins.filter((c) => c.checkin_date === date);
    const mood = consolidateDailyMood(dayCheckins)[0]?.score ?? null;
    const balance = emotionalBalance(dayCheckins);
    const sleep = combineParts([
      [sleepQuality(dayCheckins, raw.sleepLogs.filter((l) => l.log_date === date)), SLEEP_INNER.S0],
      [avg(dayCheckins.map((c) => mapDawn(c.dawn_score)).filter((v): v is number => v !== null)), SLEEP_INNER.S2],
      [
        sleepHygieneComposite(
          raw.hygieneAudits.filter((a) => a.audit_date === date),
          raw.dreams.filter((d) => d.dream_date === date),
          1,
        ),
        SLEEP_INNER.S1,
      ],
    ]);
    const dayActs = raw.activities.filter((a) => dateOnly(a.date) === date).map((a) => dateOnly(a.date));
    const resources = resourceTier(countCappedActions(dayActs));
    const dayMeds = raw.medLogs.filter((m) => m.log_date === date);
    const treatment = medicationAdherence(dayMeds, raw.hasMedications);
    const wellbeing = renormalize<"mood" | "sleep" | "balance">([
      ["mood", mood, config.wellbeingWeights.mood],
      ["sleep", sleep, config.wellbeingWeights.sleep],
      ["balance", balance, config.wellbeingWeights.balance],
    ]).score;

    out.push({ date, mood, balance, sleep, resources, treatment, wellbeing, hasCheckin: dayCheckins.length > 0 });
  }
  return out;
}

const WEAK_MESSAGE: Record<AnyPillarKey, string> = {
  mood: "Tu ánimo es lo que más pesa esta semana. Date margen y buscá momentos amables.",
  sleep: "Tu descanso es lo que más pesa esta semana. Cuidar el sueño mueve todo lo demás.",
  balance: "Las emociones difíciles predominaron en tus noches. Nombrarlas ya es un buen paso.",
  resources: "Casi no usaste recursos esta semana. Una práctica corta alcanza para empezar.",
  treatment: "Tu adherencia al tratamiento viene irregular. Revisala sin exigirte de más.",
};

function buildMessage(args: {
  hasEnoughData: boolean;
  daysMissing: number;
  wellbeingScore: number | null;
  weakestPillar: AnyPillarKey | null;
  pillars: Record<AnyPillarKey, PillarResult>;
  modulator: ClinicalModulator;
}): string {
  const { hasEnoughData, daysMissing, wellbeingScore, weakestPillar, pillars, modulator } = args;
  if (!hasEnoughData) {
    return `Faltan ${daysMissing} día(s) de registro para calcular tu bienestar.`;
  }
  if (modulator.penalty > 0) {
    return "Tu último inventario muestra síntomas a tener en cuenta. El índice lo refleja sin que sea un reproche.";
  }
  if (modulator.stale) {
    return "Tu último inventario tiene más de 45 días. Repetirlo ayuda a leer mejor tu proceso.";
  }
  if ((wellbeingScore ?? 0) >= 70) {
    return "Vas muy bien. Sostené las rutinas que te están ayudando.";
  }
  if (weakestPillar && (pillars[weakestPillar].score ?? 100) < 55) {
    return WEAK_MESSAGE[weakestPillar];
  }
  if ((wellbeingScore ?? 0) >= 45) {
    return "Semana con altibajos. Es normal que el proceso no sea lineal.";
  }
  return "Días difíciles. Bajá la exigencia y volvé a lo básico: dormir y respirar.";
}
