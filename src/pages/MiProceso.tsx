import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendUp, Path, Pill, MagicWand, Brain, HeartHalf, Moon, Lightning, Sparkle, FileText,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* ── Test type config ─────────────────── */
const testMeta: Record<string, { label: string; fullName: string; color: string; icon: typeof Brain }> = {
  "PHQ-9": { label: "PHQ-9", fullName: "Depresión", color: "hsl(var(--mood-2))", icon: Brain },
  "GAD-7": { label: "GAD-7", fullName: "Ansiedad", color: "hsl(var(--mood-3))", icon: Lightning },
  "PSS-10": { label: "PSS-10", fullName: "Estrés", color: "hsl(var(--mood-4))", icon: Sparkle },
  "ISI": { label: "ISI", fullName: "Insomnio", color: "hsl(var(--secondary))", icon: Moon },
  "Rosenberg": { label: "Rosenberg", fullName: "Autoestima", color: "hsl(var(--mood-5))", icon: HeartHalf },
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
  const [selectedTest, setSelectedTest] = useState<string | null>(null);
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
  const selectedMeta = selectedTest ? testMeta[selectedTest] : null;
  const selectedResults = selectedTest ? testsByType[selectedTest] ?? [] : [];

  return (
    <div className="pb-28 safe-area-top">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <h1 className="mb-1 font-display text-xl font-semibold">Mi Proceso</h1>
        <p className="text-sm text-muted-foreground">Tu evolución y bienestar.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Mood chart — edge-to-edge with gradient bg ── */}
          <section className="mb-6">
            <div className="px-5 mb-2">
              <h2 className="flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <TrendUp size={14} weight="duotone" /> Estado de ánimo · 30 días
              </h2>
            </div>
            <div className="w-full bg-gradient-to-b from-secondary/30 to-transparent px-2 py-4">
              {moodData.length > 1 ? (
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={moodData}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--mood-4))" stopOpacity={0.4} />
                        <stop offset="100%" stopColor="hsl(var(--mood-4))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.4} />
                    <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                    <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={18} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "16px",
                        fontSize: 12,
                        boxShadow: "0 8px 24px hsl(var(--foreground) / 0.06)",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="score"
                      stroke="hsl(var(--mood-4))"
                      strokeWidth={2.5}
                      fill="url(#moodGrad)"
                      dot={{ r: 3, fill: "hsl(var(--mood-4))", strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <p className="px-5 py-8 text-center text-sm text-muted-foreground">
                  Necesitás al menos 2 check-ins para ver tu gráfico.
                </p>
              )}
            </div>
          </section>

          {/* ── Bento Grid — Tests ───────────────── */}
          <section className="px-5 mb-6">
            <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Tests clínicos
            </h2>
            <div className="grid grid-cols-2 gap-3">
              {allTestTypes.map((type) => {
                const meta = testMeta[type];
                const results = testsByType[type] ?? [];
                const lastScore = results.length > 0 ? results[results.length - 1].score : null;
                const Icon = meta.icon;

                return (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => setSelectedTest(type)}
                    className="flex flex-col items-start rounded-3xl bg-card p-4 text-left shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] transition-shadow active:shadow-[0_1px_4px_hsl(var(--foreground)/0.06)]"
                    style={{ borderLeft: `3px solid ${meta.color}` }}
                  >
                    <Icon size={22} weight="duotone" className="mb-2 text-muted-foreground" />
                    <p className="font-display text-xs font-semibold tracking-wide">{meta.label}</p>
                    <p className="text-[10px] text-muted-foreground">{meta.fullName}</p>
                    {lastScore !== null ? (
                      <p className="mt-2 font-display text-2xl font-bold">{lastScore}</p>
                    ) : (
                      <p className="mt-2 text-xs text-muted-foreground italic">Sin datos</p>
                    )}
                  </motion.button>
                );
              })}

              {/* New test CTA card */}
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate("/mi-proceso/tests")}
                className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-accent/30 bg-accent/5 p-4 text-center shadow-none transition-colors active:bg-accent/10"
              >
                <TrendUp size={24} weight="duotone" className="mb-1 text-accent-foreground/60" />
                <p className="font-display text-xs font-medium text-accent-foreground/80">Nuevo test</p>
              </motion.button>
            </div>
          </section>

          {/* ── Resumen para mi Psico CTA ───── */}
          <section className="px-5 mb-6">
            <button
              onClick={() => navigate("/mi-proceso/resumen")}
              className="flex w-full items-center gap-3 rounded-3xl bg-accent/15 p-4 shadow-[0_2px_12px_hsl(var(--accent)/0.1)] transition-all active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/25">
                <FileText size={22} weight="duotone" className="text-accent-foreground" />
              </div>
              <div className="text-left">
                <p className="font-display text-sm font-semibold text-foreground">Resumen para mi Psico</p>
                <p className="text-[11px] text-muted-foreground">Generá un reporte semanal en PDF</p>
              </div>
            </button>
          </section>

          {/* ── Quick links — horizontal row ─────── */}
          <section className="px-5">
            <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Accesos directos
            </h2>
            <div className="flex gap-3">
              {quickLinks.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-1 flex-col items-center gap-1.5 rounded-2xl bg-card p-3.5 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] transition-shadow active:shadow-[0_1px_4px_hsl(var(--foreground)/0.06)]"
                  >
                    <Icon size={22} weight="duotone" className="text-muted-foreground" />
                    <span className="font-display text-[10px] font-medium leading-tight text-center">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* ── Test detail modal ────────────────── */}
      <Dialog open={!!selectedTest} onOpenChange={(o) => !o && setSelectedTest(null)}>
        <DialogContent className="max-w-[92vw] rounded-3xl p-5">
          {selectedMeta && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display text-base">
                  <selectedMeta.icon size={20} weight="duotone" />
                  {selectedMeta.label} — {selectedMeta.fullName}
                </DialogTitle>
              </DialogHeader>

              {selectedResults.length > 1 ? (
                <div className="mt-2">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={selectedResults}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" strokeOpacity={0.5} />
                      <XAxis dataKey="date" tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" axisLine={false} tickLine={false} />
                      <YAxis tick={{ fontSize: 9 }} stroke="hsl(var(--muted-foreground))" width={25} axisLine={false} tickLine={false} />
                      <Tooltip
                        contentStyle={{
                          background: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "16px",
                          fontSize: 12,
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke={selectedMeta.color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: selectedMeta.color, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  {selectedResults.length === 1
                    ? "Realizá el test una vez más para ver tu evolución."
                    : "Aún no hay resultados para este test."}
                </p>
              )}

              <button
                onClick={() => {
                  setSelectedTest(null);
                  navigate("/mi-proceso/tests");
                }}
                className="mt-2 w-full rounded-2xl bg-accent/20 py-3 font-display text-sm font-medium text-accent-foreground transition-colors active:bg-accent/30"
              >
                Realizar test
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
