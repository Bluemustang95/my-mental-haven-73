import { supabase } from "@/integrations/supabase/client";

export type WellbeingSnapshot = {
  score: number;          // 0-100 (compuesto ponderado y renormalizado)
  delta: number;          // % vs semana anterior
  trend: number[];        // últimos 7 días (mood/check-in equivalente 0-100)
  message: string;
  components: {
    sleep: number | null;       // 0-100
    mood: number | null;        // 0-100
    habits: number | null;      // 0-100 (% completado)
    tests: number | null;       // 0-100 (severity invertida)
    engagement: number | null;  // 0-100 (uso clínico ampliado)
    medication: number | null;  // 0-100 (adherencia últimos 7d, si registra)
  };
};

// Pesos base — se renormalizan al ignorar componentes null (no penaliza)
const WEIGHTS = {
  mood: 25,
  sleep: 20,
  habits: 15,
  engagement: 15,
  tests: 15,
  medication: 10,
} as const;

const EMPTY: WellbeingSnapshot = {
  score: 0, delta: 0, trend: [0,0,0,0,0,0,0],
  message: "Empezá registrando tu día para ver tu evolución.",
  components: { sleep: null, mood: null, habits: null, tests: null, engagement: null, medication: null },
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
    supabase.from("daily_checkins").select("checkin_date, mood_score, sleep_score, mode").eq("user_id", user.id).gte("checkin_date", isoDate(from14)),
    supabase.from("test_results").select("test_type, score, severity, created_at").eq("user_id", user.id).gte("created_at", new Date(today.getTime() - 30*86400000).toISOString()),
    supabase.from("habit_completions").select("completed_date").eq("user_id", user.id).gte("completed_date", isoDate(from14)),
    supabase.from("thought_records").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("dbt_emotion_sessions").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("journal_entries").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("exercise_sessions").select("created_at, exercise_type").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("weekly_reflections").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("ba_day_logs").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("medication_logs").select("taken, created_at").eq("user_id", user.id).gte("created_at", from7iso),
  ]);

  // ── Trend (últimos 7 días, 0-100) ──
  const trend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const ds = isoDate(new Date(today.getTime() - i * 86400000));
    const row = (ci ?? []).find((c) => c.checkin_date === ds && (c.mood_score ?? 0) > 0);
    trend.push(row?.mood_score ? Math.round((row.mood_score / 5) * 100) : 0);
  }

  // ── Components ──
  const cutoff = isoDate(new Date(today.getTime() - 6*86400000));
  const recent7 = (ci ?? []).filter((c) => c.checkin_date >= cutoff);
  const moods = recent7.map((c) => c.mood_score).filter((x): x is number => typeof x === "number" && x > 0);
  const mood = moods.length ? Math.round((moods.reduce((a,b)=>a+b,0) / moods.length / 5) * 100) : null;

  const sleeps = recent7.map((c) => c.sleep_score).filter((x): x is number => typeof x === "number" && x > 0);
  const sleep = sleeps.length ? Math.round((sleeps.reduce((a,b)=>a+b,0) / sleeps.length / 5) * 100) : null;

  const habitDays = new Set((hc ?? []).map((h) => h.completed_date));
  const last7Days = Array.from({ length: 7 }, (_, i) => isoDate(new Date(today.getTime() - i*86400000)));
  const habits = habitDays.size === 0 ? null : Math.round((last7Days.filter((d) => habitDays.has(d)).length / 7) * 100);

  // tests — último por tipo, severity invertida (BFI excluido)
  const seenTypes = new Set<string>();
  const latestTests = (tr ?? []).filter((t) => {
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
  const tScores = latestTests.map((t) => severityScore(t.severity)).filter((x): x is number => x !== null);
  const tests = tScores.length ? Math.round(tScores.reduce((a,b)=>a+b,0) / tScores.length) : null;

  // engagement — ampliado: pensamientos + DBT + diario + mindfulness/respiración + reflexiones + pack
  const mindCount = (ex ?? []).filter((e: any) => {
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

  // medication — adherencia últimos 7d (solo si registra)
  const medRows = (ml ?? []) as { taken: boolean | null }[];
  let medication: number | null = null;
  if (medRows.length > 0) {
    const taken = medRows.filter((r) => r.taken === true).length;
    medication = Math.round((taken / medRows.length) * 100);
  }

  // Score compuesto — pesos renormalizados sobre componentes presentes
  const parts: Array<[keyof typeof WEIGHTS, number | null]> = [
    ["mood", mood], ["sleep", sleep], ["habits", habits],
    ["engagement", engagement], ["tests", tests], ["medication", medication],
  ];
  const present = parts.filter(([, v]) => v !== null) as Array<[keyof typeof WEIGHTS, number]>;
  let score = 0;
  if (present.length) {
    const totalW = present.reduce((s, [k]) => s + WEIGHTS[k], 0);
    score = Math.round(present.reduce((s, [k, v]) => s + (v * WEIGHTS[k]), 0) / totalW);
  }

  // Delta (mood 7 vs 7 anteriores)
  const prev7 = (ci ?? []).filter((c) => c.checkin_date < cutoff);
  const prevMoods = prev7.map((c) => c.mood_score).filter((x): x is number => typeof x === "number" && x > 0);
  const prevAvg = prevMoods.length ? (prevMoods.reduce((a,b)=>a+b,0)/prevMoods.length/5)*100 : 0;
  const curAvg = mood ?? 0;
  const delta = prevAvg > 0 ? Math.round(((curAvg - prevAvg) / prevAvg) * 100) : 0;

  const message =
    score === 0 ? "Empezá registrando tu día para ver tu evolución."
    : score >= 70 ? "Vas muy bien. Sostené las rutinas que te están ayudando."
    : score >= 45 ? "Semana con altibajos. Es normal que el proceso no sea lineal."
    : "Días difíciles. Bajá la exigencia y volvé a lo básico: dormir y respirar.";

  return { score, delta, trend, message, components: { sleep, mood, habits, tests, engagement, medication } };
}
