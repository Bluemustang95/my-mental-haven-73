import { supabase } from "@/integrations/supabase/client";
import { getHiddenToolSlugs, filterOutHidden } from "./hiddenTools";

// ============================================================================
// Índice de Bienestar — Modelo A (auto-reporte puro)
// Mide cómo se SIENTE la persona en los últimos 7 días, según sus check-ins
// de mañana (Sintonía) y noche (Balance). El uso de recursos (hábitos, tests,
// medicación, engagement) se conserva como `selfCare` pero NO entra al cálculo.
// ============================================================================

export type WellbeingSnapshot = {
  score: number;          // 0-100, 0 = insuficientes datos
  delta: number;          // % vs ánimo de los 7 días previos
  trend: number[];        // últimos 7 días (mood ×20; 0 = sin check-in)
  message: string;
  hasEnoughData: boolean; // true si ≥ 3 días con check-in en la ventana
  daysMissing: number;    // cuántos días faltan para llegar al umbral (0 si ya alcanzó)
  components: {
    mood: number | null;    // 0-100  (mood_score promedio ×20)
    sleep: number | null;   // 0-100  (sleep_score promedio ×20)
    dawn: number | null;    // 0-100  (dawn_score mapeado)
    balance: number | null; // 0-100  (positivas / (positivas+negativas) en emotions del night)
  };
  // Autocuidado — se muestra aparte, no entra al cálculo del índice
  selfCare: {
    habits: number | null;
    engagement: number | null;
    medication: number | null;
    tests: number | null;
  };
};

// Pesos base — se renormalizan si algún componente es null
const WEIGHTS = {
  mood: 35,
  sleep: 25,
  balance: 25,
  dawn: 15,
} as const;

const MIN_DAYS = 3;

const EMPTY: WellbeingSnapshot = {
  score: 0, delta: 0, trend: [0,0,0,0,0,0,0],
  message: `Faltan ${MIN_DAYS} día(s) de registro para calcular tu bienestar.`,
  hasEnoughData: false,
  daysMissing: MIN_DAYS,
  components: { mood: null, sleep: null, dawn: null, balance: null },
  selfCare: { habits: null, engagement: null, medication: null, tests: null },
};

const POSITIVE_EMOTIONS = new Set(["Calma", "Alegría", "Energía", "Motivado", "Cariño"]);
const NEGATIVE_EMOTIONS = new Set(["Ansiedad", "Tristeza", "Enojo", "Agotamiento", "Confuso"]);

const DAWN_MAP: Record<string, number> = {
  "Excelente": 100,
  "Muy bien": 80,
  "Normal": 60,
  "Mal": 30,
  "Pésimo": 10,
};

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0,0,0,0); return x; }
function isoDate(d: Date) {
  const tz = new Date(d.getTime() - d.getTimezoneOffset()*60000);
  return tz.toISOString().slice(0,10);
}

export async function loadWellbeing(): Promise<WellbeingSnapshot> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return EMPTY;

  const today = startOfDay(new Date());
  const from14 = new Date(today.getTime() - 13 * 86400000);
  const from7iso = new Date(today.getTime() - 6 * 86400000).toISOString();

  const [
    { data: ci }, { data: tr }, { data: hc },
    { data: th }, { data: dbt }, { data: jr },
    { data: ex }, { data: wr }, { data: bad }, { data: ml }
  ] = await Promise.all([
    supabase.from("daily_checkins").select("checkin_date, mood_score, sleep_score, dawn_score, emotions, mode").eq("user_id", user.id).gte("checkin_date", isoDate(from14)),
    supabase.from("test_results").select("test_type, score, severity, created_at").eq("user_id", user.id).gte("created_at", new Date(today.getTime() - 30*86400000).toISOString()),
    supabase.from("habit_completions").select("completed_date").eq("user_id", user.id).gte("completed_date", isoDate(from14)),
    supabase.from("thought_records").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("dbt_emotion_sessions").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("journal_entries").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("exercise_sessions").select("created_at, exercise_type").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("weekly_reflections").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("ba_day_logs").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("medication_logs").select("taken").eq("user_id", user.id).gte("log_date", isoDate(from14)),
  ]);

  const hidden = await getHiddenToolSlugs();
  const exFiltered = filterOutHidden(ex as any[], hidden, "exercise_type");

  // Ventana últimos 7 días
  const cutoff = isoDate(new Date(today.getTime() - 6 * 86400000));
  const recent7 = (ci ?? []).filter((c: any) => c.checkin_date >= cutoff);

  // ── Trend (últimos 7 días — mood ×20) ──
  const trend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const ds = isoDate(new Date(today.getTime() - i * 86400000));
    const row = recent7.find((c: any) => c.checkin_date === ds && (c.mood_score ?? 0) > 0);
    trend.push(row?.mood_score ? Math.round((row.mood_score / 5) * 100) : 0);
  }

  // Umbral: días distintos con al menos un check-in
  const daysWithCheckin = new Set(recent7.map((c: any) => c.checkin_date)).size;
  if (daysWithCheckin < MIN_DAYS) {
    const missing = MIN_DAYS - daysWithCheckin;
    return {
      ...EMPTY,
      trend,
      daysMissing: missing,
      message: `Faltan ${missing} día(s) de registro para calcular tu bienestar.`,
    };
  }

  // ── Componentes ──
  const moods = recent7.map((c: any) => c.mood_score).filter((x: any): x is number => typeof x === "number" && x > 0);
  const mood = moods.length ? Math.round((moods.reduce((a: number, b: number) => a + b, 0) / moods.length / 5) * 100) : null;

  const sleeps = recent7.map((c: any) => c.sleep_score).filter((x: any): x is number => typeof x === "number" && x > 0);
  const sleep = sleeps.length ? Math.round((sleeps.reduce((a: number, b: number) => a + b, 0) / sleeps.length / 5) * 100) : null;

  const dawnScores = recent7
    .map((c: any) => (c.dawn_score ? DAWN_MAP[c.dawn_score] ?? null : null))
    .filter((x: number | null): x is number => x !== null);
  const dawn = dawnScores.length ? Math.round(dawnScores.reduce((a, b) => a + b, 0) / dawnScores.length) : null;

  // Balance emocional — solo check-ins de noche con emotions
  const nightRows = recent7.filter((c: any) => (c.mode === "night" || c.mode === null) && Array.isArray(c.emotions) && c.emotions.length > 0);
  const perNightBalance: number[] = [];
  for (const row of nightRows) {
    let pos = 0, neg = 0;
    for (const e of row.emotions as string[]) {
      if (POSITIVE_EMOTIONS.has(e)) pos++;
      else if (NEGATIVE_EMOTIONS.has(e)) neg++;
    }
    if (pos + neg > 0) perNightBalance.push((pos / (pos + neg)) * 100);
  }
  const balance = perNightBalance.length ? Math.round(perNightBalance.reduce((a, b) => a + b, 0) / perNightBalance.length) : null;

  // ── Score compuesto — renormalización ──
  const parts: Array<[keyof typeof WEIGHTS, number | null]> = [
    ["mood", mood], ["sleep", sleep], ["dawn", dawn], ["balance", balance],
  ];
  const present = parts.filter(([, v]) => v !== null) as Array<[keyof typeof WEIGHTS, number]>;
  let score = 0;
  if (present.length) {
    const totalW = present.reduce((s, [k]) => s + WEIGHTS[k], 0);
    score = Math.round(present.reduce((s, [k, v]) => s + v * WEIGHTS[k], 0) / totalW);
  }

  // ── Delta: ánimo actual vs. 7 días previos ──
  const prev7 = (ci ?? []).filter((c: any) => c.checkin_date < cutoff);
  const prevMoods = prev7.map((c: any) => c.mood_score).filter((x: any): x is number => typeof x === "number" && x > 0);
  const prevAvg = prevMoods.length ? (prevMoods.reduce((a: number, b: number) => a + b, 0) / prevMoods.length / 5) * 100 : 0;
  const curAvg = mood ?? 0;
  let delta = 0;
  if (prevAvg > 0) {
    const raw = Math.round(((curAvg - prevAvg) / prevAvg) * 100);
    delta = Math.abs(raw) > 2 ? raw : 0;
  }

  // ── Autocuidado (no entra al score) ──
  const habitDays = new Set((hc ?? []).map((h: any) => h.completed_date));
  const last7 = Array.from({ length: 7 }, (_, i) => isoDate(new Date(today.getTime() - i * 86400000)));
  const habits = habitDays.size === 0 ? null : Math.round((last7.filter((d) => habitDays.has(d)).length / 7) * 100);

  const mindCount = exFiltered.filter((e: any) => {
    const t = (e.exercise_type ?? "").toLowerCase();
    return t.includes("mindful") || t.includes("respir") || t.includes("breath");
  }).length;
  const totalEngagement =
    (th?.length ?? 0) + (dbt?.length ?? 0) + (jr?.length ?? 0) +
    mindCount + (wr?.length ?? 0) + (bad?.length ?? 0);
  let engagement: number | null = null;
  if (totalEngagement >= 10) engagement = 100;
  else if (totalEngagement >= 6) engagement = 80;
  else if (totalEngagement >= 3) engagement = 60;
  else if (totalEngagement >= 1) engagement = 35;

  const medRows = (ml ?? []) as { taken: boolean | null }[];
  let medication: number | null = null;
  if (medRows.length > 0) {
    const taken = medRows.filter((r) => r.taken === true).length;
    medication = Math.round((taken / medRows.length) * 100);
  }

  const seenTypes = new Set<string>();
  const latestTests = (tr ?? []).filter((t: any) => {
    const code = (t.test_type || "").toUpperCase();
    if (code === "BIGFIVE" || code === "BIG-FIVE" || code === "BFI") return false;
    if (seenTypes.has(t.test_type)) return false;
    seenTypes.add(t.test_type);
    return true;
  });
  const severityScore = (sev?: string | null): number | null => {
    if (!sev) return null;
    const s = sev.toLowerCase();
    if (s.includes("mínim") || s.includes("saludable") || s.includes("bajo") || s.includes("buen")) return 90;
    if (s.includes("leve") || s.includes("normal")) return 70;
    if (s.includes("modera")) return 45;
    if (s.includes("signif") || s.includes("alto")) return 25;
    if (s.includes("severa") || s.includes("necesita")) return 10;
    return null;
  };
  const tScores = latestTests.map((t: any) => severityScore(t.severity)).filter((x: number | null): x is number => x !== null);
  const tests = tScores.length ? Math.round(tScores.reduce((a, b) => a + b, 0) / tScores.length) : null;

  const message =
    score >= 70 ? "Vas muy bien. Sostené las rutinas que te están ayudando."
    : score >= 45 ? "Semana con altibajos. Es normal que el proceso no sea lineal."
    : "Días difíciles. Bajá la exigencia y volvé a lo básico: dormir y respirar.";

  return {
    score,
    delta,
    trend,
    message,
    hasEnoughData: true,
    daysMissing: 0,
    components: { mood, sleep, dawn, balance },
    selfCare: { habits, engagement, medication, tests },
  };
}
