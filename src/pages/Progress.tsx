import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, TrendUp, Fire, Barbell } from "@phosphor-icons/react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

export default function Progress() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [moodData, setMoodData] = useState<{ date: string; score: number }[]>([]);
  const [testData, setTestData] = useState<{ date: string; type: string; score: number }[]>([]);
  const [stats, setStats] = useState({ checkins: 0, exercises: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const since = subDays(new Date(), 30).toISOString();

    Promise.all([
      supabase
        .from("daily_checkins")
        .select("checkin_date, mood_score")
        .eq("user_id", user.id)
        .gte("created_at", since)
        .order("checkin_date", { ascending: true }),
      supabase
        .from("test_results")
        .select("created_at, test_type, score")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(20),
      supabase
        .from("daily_checkins")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("exercise_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("completed", true),
    ]).then(([checkins, tests, checkinCount, exerciseCount]) => {
      setMoodData(
        (checkins.data ?? [])
          .filter((c) => c.mood_score != null)
          .map((c) => ({
            date: format(new Date(c.checkin_date), "dd/MM", { locale: es }),
            score: c.mood_score!,
          }))
      );
      setTestData(
        (tests.data ?? []).map((t) => ({
          date: format(new Date(t.created_at!), "dd/MM", { locale: es }),
          type: t.test_type,
          score: t.score,
        }))
      );
      setStats({
        checkins: checkinCount.count ?? 0,
        exercises: exerciseCount.count ?? 0,
      });
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/mi-proceso")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Mi Progreso</h1>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* Stats */}
          <div className="mb-6 grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <Fire size={20} weight="duotone" className="mx-auto mb-1 text-accent" />
              <p className="font-display text-2xl font-bold">{stats.checkins}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Check-ins</p>
            </div>
            <div className="rounded-2xl border border-border bg-card p-4 text-center">
              <Barbell size={20} weight="duotone" className="mx-auto mb-1 text-accent" />
              <p className="font-display text-2xl font-bold">{stats.exercises}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Ejercicios</p>
            </div>
          </div>

          {/* Mood chart */}
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
              <TrendUp size={16} /> Estado de ánimo (30 días)
            </h2>
            {moodData.length > 1 ? (
              <div className="rounded-2xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={moodData}>
                    <XAxis dataKey="date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                    <Tooltip />
                    <Line type="monotone" dataKey="score" stroke="hsl(var(--accent))" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Necesitás al menos 2 check-ins para ver tu gráfico.
              </p>
            )}
          </section>

          {/* Test history */}
          <section>
            <h2 className="mb-3 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Historial de tests
            </h2>
            {testData.length > 0 ? (
              <div className="space-y-2">
                {testData.map((t, i) => (
                  <div key={i} className="flex items-center justify-between rounded-2xl border border-border bg-card p-4">
                    <div>
                      <p className="font-display text-sm font-medium">{t.type}</p>
                      <p className="text-[10px] text-muted-foreground">{t.date}</p>
                    </div>
                    <p className="font-display text-lg font-bold">{t.score}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Completá un test para ver tu historial.
              </p>
            )}
          </section>
        </>
      )}
    </div>
  );
}
