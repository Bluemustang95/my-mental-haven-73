import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  TrendUp, Path, Pill, MagicWand, Brain, HeartHalf, Moon, Lightning, Sparkle, FileText, Notepad, CaretRight,
} from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  LineChart, Line, CartesianGrid,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/* ── Humanized test config ─────────────────── */
const testMeta: Record<string, {
  humanLabel: string;
  techId: string;
  color: string;
  icon: typeof Brain;
  interpret: (score: number) => { label: string; message: string; tone: "positive" | "moderate" | "attention" };
}> = {
  "PHQ-9": {
    humanLabel: "¿Cómo viene tu ánimo?",
    techId: "PHQ-9",
    color: "hsl(var(--mood-2))",
    icon: Brain,
    interpret: (s) => {
      if (s <= 4) return { label: "Muy bien", message: "Venís con buena energía. ¡Seguí así!", tone: "positive" };
      if (s <= 9) return { label: "Leve", message: "Hay algo que podríamos trabajar, pero vas bien.", tone: "moderate" };
      if (s <= 14) return { label: "Moderado", message: "Podríamos mejorar cómo te sentís. Hablalo con tu psico.", tone: "moderate" };
      return { label: "Necesita atención", message: "Es importante que hables con un profesional.", tone: "attention" };
    },
  },
  "GAD-7": {
    humanLabel: "¿Cómo estás con la ansiedad?",
    techId: "GAD-7",
    color: "hsl(var(--mood-3))",
    icon: Lightning,
    interpret: (s) => {
      if (s <= 4) return { label: "Tranqui", message: "Tu ansiedad está en niveles bajos. ¡Bien!", tone: "positive" };
      if (s <= 9) return { label: "Algo elevada", message: "Las herramientas de respiración pueden ayudarte.", tone: "moderate" };
      if (s <= 14) return { label: "Moderada", message: "Podrías beneficiarte de hablar con tu psico.", tone: "moderate" };
      return { label: "Necesita atención", message: "Es importante buscar acompañamiento profesional.", tone: "attention" };
    },
  },
  "PSS-10": {
    humanLabel: "¿Cómo manejás el estrés?",
    techId: "PSS-10",
    color: "hsl(var(--mood-4))",
    icon: Sparkle,
    interpret: (s) => {
      if (s <= 13) return { label: "Bien manejado", message: "Tenés buenas estrategias para el estrés.", tone: "positive" };
      if (s <= 26) return { label: "Algo estresado", message: "Las herramientas de la app pueden ayudarte.", tone: "moderate" };
      return { label: "Nivel alto", message: "Te recomendamos hablar con un profesional.", tone: "attention" };
    },
  },
  "ISI": {
    humanLabel: "¿Cómo estás descansando?",
    techId: "ISI",
    color: "hsl(var(--secondary))",
    icon: Moon,
    interpret: (s) => {
      if (s <= 7) return { label: "Buen descanso", message: "Tu sueño parece estar en buen estado.", tone: "positive" };
      if (s <= 14) return { label: "Podría mejorar", message: "Podríamos mejorar tu higiene del sueño.", tone: "moderate" };
      if (s <= 21) return { label: "Moderado", message: "Te recomendamos consultar sobre tu descanso.", tone: "moderate" };
      return { label: "Necesita atención", message: "Es importante buscar ayuda con tu sueño.", tone: "attention" };
    },
  },
  "Rosenberg": {
    humanLabel: "¿Cómo te sentís con vos?",
    techId: "Rosenberg",
    color: "hsl(var(--mood-5))",
    icon: HeartHalf,
    interpret: (s) => {
      if (s >= 25) return { label: "Saludable", message: "Tu autoestima se ve sólida. ¡Muy bien!", tone: "positive" };
      if (s >= 15) return { label: "Normal", message: "Siempre podés seguir fortaleciéndote.", tone: "moderate" };
      return { label: "Necesita atención", message: "Trabajar en esto con tu psico puede ayudarte mucho.", tone: "attention" };
    },
  },
};

const toneColors = {
  positive: "text-success",
  moderate: "text-accent-foreground",
  attention: "text-destructive",
};
const toneBg = {
  positive: "bg-success/10",
  moderate: "bg-accent/10",
  attention: "bg-destructive/10",
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
  // Sort by most recent result, then show first 2
  const sortedTypes = [...allTestTypes].sort((a, b) => {
    const aLen = (testsByType[a] ?? []).length;
    const bLen = (testsByType[b] ?? []).length;
    return bLen - aLen;
  });
  const topTests = sortedTypes.slice(0, 2);

  const selectedMeta = selectedTest ? testMeta[selectedTest] : null;
  const selectedResults = selectedTest ? testsByType[selectedTest] ?? [] : [];

  return (
    <div className="pb-28 safe-area-top">
      {/* Header */}
      <div className="px-5 pt-14 pb-2">
        <h1 className="mb-1 font-display text-xl font-semibold">Mi Proceso</h1>
        <p className="text-sm text-muted-foreground">Tu evolución y bienestar, paso a paso.</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <>
          {/* ── Mood chart — 5 day minimum ── */}
          <section className="mb-6">
            <div className="px-5 mb-2">
              <h2 className="flex items-center gap-2 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
                <TrendUp size={14} weight="duotone" /> Estado de ánimo · 30 días
              </h2>
            </div>
            {moodData.length >= 5 ? (
              <div className="w-full px-2 py-4">
                <ResponsiveContainer width="100%" height={150}>
                  <AreaChart data={moodData}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="hsl(var(--accent))" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="hsl(var(--accent))" stopOpacity={0.02} />
                      </linearGradient>
                    </defs>
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
                      type="natural"
                      dataKey="score"
                      stroke="hsl(var(--accent))"
                      strokeWidth={2.5}
                      fill="url(#moodGrad)"
                      dot={{ r: 3, fill: "hsl(var(--accent))", strokeWidth: 0 }}
                      activeDot={{ r: 5, strokeWidth: 0 }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="mx-5 rounded-3xl bg-accent/8 border border-accent/15 p-6 text-center">
                <Sparkle size={28} weight="duotone" className="mx-auto mb-2 text-accent" />
                <p className="font-display text-sm font-medium text-foreground mb-1">
                  Tu gráfico de bienestar te espera
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Registrá cómo te sentís durante <strong>5 días</strong> para desbloquear tu evolución y ver tu progreso.
                </p>
                {moodData.length > 0 && (
                  <p className="mt-2 text-[10px] text-muted-foreground">
                    Llevás {moodData.length} de 5 registros 💪
                  </p>
                )}
              </div>
            )}
          </section>

          {/* ── Top 2 Humanized Test Cards ───────────────── */}
          <section className="px-5 mb-4">
            <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Indicadores de bienestar
            </h2>
            <div className="space-y-3">
              {topTests.map((type) => {
                const meta = testMeta[type];
                const results = testsByType[type] ?? [];
                const lastScore = results.length > 0 ? results[results.length - 1].score : null;
                const interp = lastScore !== null ? meta.interpret(lastScore) : null;
                const Icon = meta.icon;

                return (
                  <motion.button
                    key={type}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setSelectedTest(type)}
                    className="flex w-full items-center gap-4 rounded-3xl bg-card p-4 text-left shadow-[0_2px_12px_hsl(var(--foreground)/0.04)]"
                    style={{ borderLeft: `3px solid ${meta.color}` }}
                  >
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl" style={{ backgroundColor: `${meta.color}20` }}>
                      <Icon size={22} weight="duotone" className="text-muted-foreground" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display text-sm font-semibold leading-tight">{meta.humanLabel}</p>
                      {interp ? (
                        <div className="mt-1 flex items-center gap-2">
                          <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${toneBg[interp.tone]} ${toneColors[interp.tone]}`}>
                            {interp.label}
                          </span>
                          <span className="text-[10px] text-muted-foreground truncate">{interp.message}</span>
                        </div>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground italic">Completá tu primer test</p>
                      )}
                    </div>
                    <CaretRight size={16} className="text-muted-foreground shrink-0" />
                  </motion.button>
                );
              })}
            </div>
          </section>

          {/* ── Ver más tests ── */}
          <section className="px-5 mb-6">
            <button
              onClick={() => navigate("/mi-proceso/todos-tests")}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-card py-3 font-display text-sm font-medium text-muted-foreground transition-colors active:bg-muted"
            >
              <TrendUp size={16} weight="duotone" />
              Ver más indicadores
            </button>
          </section>

          {/* ── Notas para Terapia CTA ───── */}
          <section className="px-5 mb-4">
            <button
              onClick={() => navigate("/mi-proceso/terapia")}
              className="flex w-full items-center gap-3 rounded-3xl bg-card p-4 shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] transition-all active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-secondary">
                <Notepad size={22} weight="duotone" className="text-secondary-foreground" />
              </div>
              <div className="text-left flex-1">
                <p className="font-display text-sm font-semibold text-foreground">Notas para terapia</p>
                <p className="text-[11px] text-muted-foreground">Temas y preguntas para tu próxima sesión</p>
              </div>
              <CaretRight size={16} className="text-muted-foreground" />
            </button>
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

      {/* ── Test detail modal — humanized ────────────────── */}
      <Dialog open={!!selectedTest} onOpenChange={(o) => !o && setSelectedTest(null)}>
        <DialogContent className="max-w-[92vw] rounded-3xl p-5">
          {selectedMeta && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 font-display text-base">
                  <selectedMeta.icon size={20} weight="duotone" />
                  {selectedMeta.humanLabel}
                </DialogTitle>
              </DialogHeader>

              {selectedResults.length > 0 && (() => {
                const last = selectedResults[selectedResults.length - 1];
                const interp = selectedMeta.interpret(last.score);
                return (
                  <div className={`mt-2 rounded-2xl p-4 ${toneBg[interp.tone]}`}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-display text-sm font-semibold ${toneColors[interp.tone]}`}>{interp.label}</span>
                      <span className="text-xs text-muted-foreground">Último: {last.date}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{interp.message}</p>
                  </div>
                );
              })()}

              {selectedResults.length > 1 ? (
                <div className="mt-3">
                  <ResponsiveContainer width="100%" height={180}>
                    <LineChart data={selectedResults}>
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
                        type="natural"
                        dataKey="score"
                        stroke={selectedMeta.color}
                        strokeWidth={2.5}
                        dot={{ r: 4, fill: selectedMeta.color, strokeWidth: 0 }}
                        activeDot={{ r: 6, strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : selectedResults.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted-foreground">
                  Aún no completaste este indicador.
                </p>
              ) : null}

              <button
                onClick={() => {
                  const testId = selectedTest;
                  setSelectedTest(null);
                  navigate(`/mi-proceso/tests?test=${testId}`);
                }}
                className="mt-3 w-full rounded-2xl bg-accent/20 py-3 font-display text-sm font-medium text-accent-foreground transition-colors active:bg-accent/30"
              >
                Realizar evaluación
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
