// ============================================================================
// Índice de Bienestar v3 — Tipos
// Dos índices separados:
//   · Bienestar (SENTIR)  = Ánimo 45 / Sueño 35 / Balance emocional 20
//   · Cuidado   (HACER)   = Recursos 40 / Tratamiento 60
// El combinado (35/30/15/20) queda disponible como lectura opcional.
// ============================================================================

export type WellbeingPillarKey = "mood" | "sleep" | "balance";
export type CarePillarKey = "resources" | "treatment";
export type AnyPillarKey = WellbeingPillarKey | CarePillarKey;

export type Severity = "minimal" | "mild" | "moderate" | "severe";

/** Valor 0-100 de un sub-ítem, o null si no hay datos en la ventana. */
export type SubScore = number | null;

export type SubItems = {
  /** A1 · Ánimo auto-reportado consolidado por día (mañana+noche → un valor). */
  A1: SubScore;
  /** A1Δ · Delta intradía promedio (noche − mañana) ×20. Informativo, no puntúa. */
  A1Delta: number | null;
  /** B1 · Balance emocional nocturno (positivas / positivas+negativas). */
  B1: SubScore;
  /** S0 · Calidad de sueño auto-reportada (Balance nocturno + sleep_log). */
  S0: SubScore;
  /** S1 · Compuesto de higiene del sueño + pesadillas + registro de sueños. */
  S1: SubScore;
  /** S2 · Sensación al despertar (dawn_score mapeado). */
  S2: SubScore;
  /** R1 · Uso de recursos de la plataforma (tiers semanales, tope 3/día). */
  R1: SubScore;
  /** T1A · Asistencia a terapia (14 días). */
  T1A: SubScore;
  /** T1B · Adherencia a medicación. */
  T1B: SubScore;
  /** T1C · Notas de sesión creadas. */
  T1C: SubScore;
  /** T1D · Notas compartidas con el profesional. */
  T1D: SubScore;
};

export type PillarResult = {
  key: AnyPillarKey;
  /** 0-100 o null si el pilar no tiene ningún dato en la ventana. */
  score: number | null;
  /** Peso base configurado (%). */
  baseWeight: number;
  /** Peso efectivo tras renormalizar por pilares ausentes (%). 0 si ausente. */
  appliedWeight: number;
  /** Sub-ítems que componen el pilar, con su aporte. */
  parts: Array<{ key: keyof SubItems; label: string; value: SubScore; innerWeight: number }>;
};

export type ClinicalModulator = {
  /** Test que dispara el modulador (BDI-II, BAI, PHQ-9, GAD-7…). */
  testType: string | null;
  severity: Severity | null;
  /** Días desde el test. */
  ageDays: number | null;
  /** Puntos restados al índice de bienestar (0-15, ya con decaimiento aplicado). */
  penalty: number;
  /** true si el test superó los 45 días y el modulador se apagó. */
  stale: boolean;
};

export type DailyPoint = {
  date: string; // YYYY-MM-DD
  mood: number | null;
  balance: number | null;
  sleep: number | null;
  resources: number | null;
  treatment: number | null;
  /** Índice de bienestar del día (si hay datos suficientes ese día). */
  wellbeing: number | null;
  hasCheckin: boolean;
};

export type WellbeingSnapshotV3 = {
  /** Índice de Bienestar (SENTIR). null si no se alcanzó el umbral de días. */
  wellbeingScore: number | null;
  /** Score antes de aplicar el modulador clínico. */
  wellbeingRaw: number | null;
  /** Índice de Cuidado (HACER). null si no hay ninguna conducta registrada. */
  careScore: number | null;
  /** Lectura combinada 35/30/15/20 (opcional, flag de admin). */
  combinedScore: number | null;

  /** Variación % del ánimo vs. los 7 días previos. */
  delta: number;

  /** Umbral de fiabilidad. */
  daysWithCheckin: number;
  minDays: number;
  hasEnoughData: boolean;
  daysMissing: number;

  pillars: Record<AnyPillarKey, PillarResult>;
  subItems: SubItems;
  modulator: ClinicalModulator;

  /** Serie diaria de los últimos 30 días (para calendario y gráficos). */
  series: DailyPoint[];
  /** Últimos 7 días de ánimo ×20 (0 = sin registro), para las barras del hero. */
  trend: number[];

  weakestPillar: AnyPillarKey | null;
  message: string;
};

// ── Pesos base ──────────────────────────────────────────────────────────────
export const WELLBEING_WEIGHTS: Record<WellbeingPillarKey, number> = {
  mood: 45,
  sleep: 35,
  balance: 20,
};

export const CARE_WEIGHTS: Record<CarePillarKey, number> = {
  resources: 40,
  treatment: 60,
};

/** Lectura combinada opcional (modo "un solo índice"). */
export const COMBINED_WEIGHTS: Record<"mood" | "sleep" | "resources" | "treatment", number> = {
  mood: 35,
  sleep: 30,
  resources: 15,
  treatment: 20,
};

/** Pesos internos del pilar Sueño. */
export const SLEEP_INNER = { S0: 50, S2: 30, S1: 20 } as const;

export const MIN_DAYS = 3;
export const WINDOW_DAYS = 7;
export const SERIES_DAYS = 30;
export const MODULATOR_FULL_DAYS = 30;
export const MODULATOR_STALE_DAYS = 45;

export type WellbeingConfig = {
  minDays: number;
  windowDays: number;
  wellbeingWeights: Record<WellbeingPillarKey, number>;
  careWeights: Record<CarePillarKey, number>;
  modulatorEnabled: boolean;
  /** "split" = dos índices (default) · "combined" = un solo número. */
  displayMode: "split" | "combined";
};

export const DEFAULT_CONFIG: WellbeingConfig = {
  minDays: MIN_DAYS,
  windowDays: WINDOW_DAYS,
  wellbeingWeights: WELLBEING_WEIGHTS,
  careWeights: CARE_WEIGHTS,
  modulatorEnabled: true,
  displayMode: "split",
};

// ── Datos crudos que consume el motor ───────────────────────────────────────
export type RawCheckin = {
  checkin_date: string;
  mode: string | null;
  mood_score: number | null;
  sleep_score: number | null;
  dawn_score: string | null;
  emotions: string[] | null;
};

export type RawSleepLog = { log_date: string; score: number | null; quality: string | null };
export type RawHygieneAudit = { audit_date: string; score: number | null };
export type RawDream = { dream_date: string; themes: string[] | null; emotions: string[] | null; sleep_quality: number | null };
export type RawActivity = { date: string; kind: string };
export type RawMedLog = { log_date: string; taken: boolean | null };
export type RawSessionNote = { session_date: string };
export type RawPrepNote = { created_at: string; shared_at: string | null };
export type RawTest = { test_type: string; severity: string | null; created_at: string };

export type WellbeingRaw = {
  today: Date;
  checkins: RawCheckin[];
  sleepLogs: RawSleepLog[];
  hygieneAudits: RawHygieneAudit[];
  dreams: RawDream[];
  activities: RawActivity[];
  medLogs: RawMedLog[];
  sessionNotes: RawSessionNote[];
  prepNotes: RawPrepNote[];
  tests: RawTest[];
  inTherapy: boolean;
  hasMedications: boolean;
};

export const EMPTY_RAW: Omit<WellbeingRaw, "today"> = {
  checkins: [],
  sleepLogs: [],
  hygieneAudits: [],
  dreams: [],
  activities: [],
  medLogs: [],
  sessionNotes: [],
  prepNotes: [],
  tests: [],
  inTherapy: false,
  hasMedications: false,
};
