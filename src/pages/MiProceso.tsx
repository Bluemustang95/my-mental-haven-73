import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendUp, Path, Pill, MagicWand, ArrowRight, Plus, CaretDown, CaretUp,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";

/* ── Test type config ─────────────────── */
const testMeta: Record<string, { label: string; fullName: string; color: string }> = {
  "PHQ-9": { label: "PHQ-9", fullName: "Depresión", color: "hsl(var(--mood-2))" },
  "GAD-7": { label: "GAD-7", fullName: "Ansiedad", color: "hsl(var(--mood-3))" },
  "PSS-10": { label: "PSS-10", fullName: "Estrés percibido", color: "hsl(var(--mood-4))" },
  "ISI": { label: "ISI", fullName: "Insomnio", color: "hsl(var(--secondary))" },
  "Rosenberg": { label: "Rosenberg", fullName: "Autoestima", color: "hsl(var(--mood-5))" },
};

/* ── Quick-link items ─────────────────── */
const quickLinks = [
  { path: "/mi-proceso/linea-temporal", label: "Línea temporal", icon: Path },
  { path: "/mi-proceso/medicacion", label: "Medicación", icon: Pill },
  { path: "/mi-proceso/espejo", label: "El Espejo", icon: MagicWand },
];

export default function MiProceso() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [moodData, setMoodData] = useState<{ date: string; score: number }[]>([]);
  const [testsByType, setTestsByType] = useState<Record<string, { date: string; score: number }[]>>({});
  const [expandedTest, setExpandedTest] = useState<string | null>(null);
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
        .limit(100),
    ]).then(([checkins, tests]) => {
      setMoodData(
        (checkins.data ?? [])
          .filter((c) => c.mood_score != null)
          .map((c) => ({
            date: format(new Date(c.checkin_date), "dd/MM", { locale: es }),
            score: c.mood_score!,
          }))
      );

      // Group tests by type
      const grouped: Record<string, { date: string; score: number }[]> = {};
      for (const t of tests.data ?? []) {
        if (!grouped[t.test_type]) grouped[t.test_type] = [];
        grouped[t.test_type].push({
          date: format(new Date(t.created_at!), "dd/MM", { locale: es }),
          score: t.score,
        });
      }
      setTestsByType(grouped);
      setLoading(false);
    });
  }, [user]);

  const allTestTypes = Object.keys(testMeta);

  return (
    <div className="px-5 pt-14 pb-28 safe-area-top">
      <h1 className="mb-1 font-display text-xl font-semibold">Mi Proceso</h1>
      <p className="mb-5 text-sm text-muted-foreground">Tu evolución y herramientas de evaluación.</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Mood chart (top) ─────────────────── */}
          <section className="mb-6">
            <h2 className="mb-3 flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              <TrendUp size={14} weight="duotone" /> Estado de ánimo · 30 días
            </h2>
            {moodData.length > 1 ? (
              <div className="rounded-2xl border border-border bg-card p-4">
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={20} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        fontSize: 12,
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--mood-4))"
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: "hsl(var(--mood-4))" }}
                      activeDot={{ r: 5 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="rounded-2xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
                Necesitás al menos 2 check-ins para ver tu gráfico.
              </p>
            )}
          </section>

          {/* ── Test cards ───────────────────────── */}
          <section className="mb-6">
            <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tests clínicos
            </h2>
            <div className="space-y-3">
              {allTestTypes.map((type) => {
                const meta = testMeta[type];
                const results = testsByType[type] ?? [];
                const lastScore = results.length > 0 ? results[results.length - 1].score : null;
                const isExpanded = expandedTest === type;

                return (
                  <motion.div
                    key={type}
                    layout
                    className="rounded-2xl border border-border bg-card overflow-hidden"
                  >
                    {/* Card header */}
                    <div className="flex items-center gap-3 p-4">
                      <div
                        className="flex h-10 w-10 items-center justify-center rounded-xl"
                        style={{ backgroundColor: meta.color, opacity: 0.3 }}
                      >
                        <span className="font-display text-xs font-bold" style={{ color: "hsl(var(--foreground))" }}>
                          {meta.label.split("-")[0]}
                        </span>
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-sm font-medium">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{meta.fullName}</p>
                      </div>

                      {lastScore !== null ? (
                        <div className="text-right mr-2">
                          <p className="font-display text-lg font-bold">{lastScore}</p>
                          <p className="text-[10px] text-muted-foreground">último</p>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground mr-2">Sin datos</p>
                      )}

                      {/* Evolution toggle */}
                      {results.length > 1 && (
                        <button
                          onClick={() => setExpandedTest(isExpanded ? null : type)}
                          className="flex items-center gap-1 rounded-lg border border-border px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-muted"
                        >
                          {isExpanded ? <CaretUp size={12} /> : <CaretDown size={12} />}
                          Evolución
                        </button>
                      )}

                      {/* New test button */}
                      <button
                        onClick={() => navigate("/mi-proceso/tests")}
                        className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20 text-accent-foreground transition-colors hover:bg-accent/40"
                      >
                        <Plus size={16} weight="bold" />
                      </button>
                    </div>

                    {/* Evolution chart (expandable) */}
                    <AnimatePresence>
                      {isExpanded && results.length > 1 && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="border-t border-border px-4 pb-4 pt-2"
                        >
                          <ResponsiveContainer width="100%" height={140}>
                            <LineChart data={results}>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                              <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" />
                              <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={25} />
                              <Tooltip
                                contentStyle={{
                                  background: "hsl(var(--card))",
                                  border: "1px solid hsl(var(--border))",
                                  borderRadius: "12px",
                                  fontSize: 12,
                                }}
                              />
                              <Line
                                type="monotone"
                                dataKey="score"
                                stroke={meta.color}
                                strokeWidth={2}
                                dot={{ r: 3, fill: meta.color }}
                                activeDot={{ r: 5 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Global new test CTA */}
            <button
              onClick={() => navigate("/mi-proceso/tests")}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/40 bg-accent/5 py-3 font-display text-sm font-medium text-accent-foreground transition-colors hover:bg-accent/15"
            >
              <Plus size={18} weight="bold" />
              Realizar nuevo test
            </button>
          </section>

          {/* ── Quick links (compact) ────────────── */}
          <section>
            <div className="space-y-2">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex w-full items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-left transition-colors active:bg-muted"
                  >
                    <Icon size={18} weight="duotone" className="text-muted-foreground" />
                    <span className="flex-1 font-display text-sm">{item.label}</span>
                    <ArrowRight size={12} className="text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
