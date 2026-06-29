import { supabase } from "@/integrations/supabase/client";

export type WellbeingSnapshot = {
  score: number;          // 0-100 (compuesto)
  delta: number;          // % vs semana anterior
  trend: number[];        // últimos 7 días (mood/check-in equivalente 0-100)
  message: string;
  components: {
    sleep: number | null;       // 0-100
    mood: number | null;        // 0-100
    habits: number | null;      // 0-100 (% completado)
    tests: number | null;       // 0-100 (severity invertida)
    engagement: number | null;  // 0-100 (uso clínico: pensamientos + dbt + diario)
  };
};

const EMPTY: WellbeingSnapshot = {
  score: 0, delta: 0, trend: [0,0,0,0,0,0,0],
  message: "Empezá registrando tu día para ver tu evolución.",
  components: { sleep: null, mood: null, habits: null, tests: null, engagement: null },
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

  const [{ data: ci }, { data: tr }, { data: hc }, { data: th }, { data: dbt }, { data: jr }] = await Promise.all([
    supabase.from("daily_checkins")
      .select("checkin_date, mood_score, sleep_score, mode")
      .eq("user_id", user.id)
      .gte("checkin_date", isoDate(from14)),
    supabase.from("test_results")
      .select("test_type, score, severity, created_at")
      .eq("user_id", user.id)
      .gte("created_at", new Date(today.getTime() - 30*86400000).toISOString()),
    supabase.from("habit_completions")
      .select("completed_date")
      .eq("user_id", user.id)
      .gte("completed_date", isoDate(from14)),
    supabase.from("thought_records").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("dbt_emotion_sessions").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
    supabase.from("journal_entries").select("created_at").eq("user_id", user.id).gte("created_at", from7iso),
  ]);

  // ── Trend (últimos 7 días, normalizado a 0-100) ──
  const trend: number[] = [];
  for (let i = 6; i >= 0; i--) {
    const ds = isoDate(new Date(today.getTime() - i * 86400000));
    const row = (ci ?? []).find((c) => c.checkin_date === ds && (c.mood_score ?? 0) > 0);
    trend.push(row?.mood_score ? Math.round((row.mood_score / 5) * 100) : 0);
  }

  // ── Components ──
  const recent7 = (ci ?? []).filter((c) => c.checkin_date >= isoDate(new Date(today.getTime() - 6*86400000)));
  const moods = recent7.map((c) => c.mood_score).filter((x): x is number => typeof x === "number" && x > 0);
  const mood = moods.length ? Math.round((moods.reduce((a,b)=>a+b,0) / moods.length / 5) * 100) : null;

  const sleeps = recent7.map((c) => c.sleep_score).filter((x): x is number => typeof x === "number" && x > 0);
  const sleep = sleeps.length ? Math.round((sleeps.reduce((a,b)=>a+b,0) / sleeps.length / 5) * 100) : null;

  // habits: % días con al menos 1 hábito completado en últimos 7
  const habitDays = new Set((hc ?? []).map((h) => h.completed_date));
  const last7Days = Array.from({ length: 7 }, (_, i) => isoDate(new Date(today.getTime() - i*86400000)));
  const habits = habitDays.size === 0 ? null : Math.round((last7Days.filter((d) => habitDays.has(d)).length / 7) * 100);

  // tests: tomamos el último de cada tipo, invertimos severidad
  const seenTypes = new Set<string>();
  const latestTests = (tr ?? []).filter((t) => {
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

  // engagement: actividad clínica (pensamientos + DBT + diario) últimos 7d
  // 0 sesiones → null, 1 sesión → 40, 3 → 70, 6+ → 100
  const totalEngagement = (th?.length ?? 0) + (dbt?.length ?? 0) + (jr?.length ?? 0);
  const engagement = totalEngagement === 0 ? null : Math.min(100, 30 + totalEngagement * 12);

  // Weighted score
  const buckets = [mood, sleep, habits, tests, engagement].filter((x): x is number => x !== null);
  const score = buckets.length ? Math.round(buckets.reduce((a,b)=>a+b,0) / buckets.length) : 0;

  // Delta: comparar promedio últimos 7 vs 7 anteriores
  const prev7 = (ci ?? []).filter((c) => c.checkin_date < isoDate(new Date(today.getTime() - 6*86400000)));
  const prevMoods = prev7.map((c) => c.mood_score).filter((x): x is number => typeof x === "number" && x > 0);
  const prevAvg = prevMoods.length ? (prevMoods.reduce((a,b)=>a+b,0)/prevMoods.length/5)*100 : 0;
  const curAvg = mood ?? 0;
  const delta = prevAvg > 0 ? Math.round(((curAvg - prevAvg) / prevAvg) * 100) : 0;

  const message =
    score === 0 ? "Empezá registrando tu día para ver tu evolución."
    : score >= 70 ? "Vas muy bien. Sostené las rutinas que te están ayudando."
    : score >= 45 ? "Semana con altibajos. Es normal que el proceso no sea lineal."
    : "Días difíciles. Bajá la exigencia y volvé a lo básico: dormir y respirar.";

  return { score, delta, trend, message, components: { sleep, mood, habits, tests, engagement } };
}
