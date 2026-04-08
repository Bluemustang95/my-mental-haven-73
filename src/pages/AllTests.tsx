import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Lightning, Sparkle, Moon, HeartHalf } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";

const testMeta: Record<string, {
  humanLabel: string;
  icon: typeof Brain;
  color: string;
  interpret: (score: number) => { label: string; message: string; tone: "positive" | "moderate" | "attention" };
}> = {
  "PHQ-9": {
    humanLabel: "¿Cómo viene tu ánimo?",
    icon: Brain,
    color: "hsl(var(--mood-2))",
    interpret: (s) => {
      if (s <= 4) return { label: "Muy bien", message: "Venís con buena energía.", tone: "positive" };
      if (s <= 9) return { label: "Leve", message: "Hay algo que podríamos trabajar.", tone: "moderate" };
      if (s <= 14) return { label: "Moderado", message: "Podríamos mejorar cómo te sentís.", tone: "moderate" };
      return { label: "Necesita atención", message: "Es importante que hables con un profesional.", tone: "attention" };
    },
  },
  "GAD-7": {
    humanLabel: "¿Cómo estás con la ansiedad?",
    icon: Lightning,
    color: "hsl(var(--mood-3))",
    interpret: (s) => {
      if (s <= 4) return { label: "Tranqui", message: "Tu ansiedad está en niveles bajos.", tone: "positive" };
      if (s <= 9) return { label: "Algo elevada", message: "Respiración y mindfulness pueden ayudarte.", tone: "moderate" };
      if (s <= 14) return { label: "Moderada", message: "Podrías hablar con tu psico.", tone: "moderate" };
      return { label: "Necesita atención", message: "Es importante buscar acompañamiento.", tone: "attention" };
    },
  },
  "PSS-10": {
    humanLabel: "¿Cómo manejás el estrés?",
    icon: Sparkle,
    color: "hsl(var(--mood-4))",
    interpret: (s) => {
      if (s <= 13) return { label: "Bien manejado", message: "Buenas estrategias para el estrés.", tone: "positive" };
      if (s <= 26) return { label: "Algo estresado", message: "Las herramientas pueden ayudarte.", tone: "moderate" };
      return { label: "Nivel alto", message: "Hablá con un profesional.", tone: "attention" };
    },
  },
  "ISI": {
    humanLabel: "¿Cómo estás descansando?",
    icon: Moon,
    color: "hsl(var(--secondary))",
    interpret: (s) => {
      if (s <= 7) return { label: "Buen descanso", message: "Tu sueño está en buen estado.", tone: "positive" };
      if (s <= 14) return { label: "Podría mejorar", message: "Mejorá tu higiene del sueño.", tone: "moderate" };
      if (s <= 21) return { label: "Moderado", message: "Consultá sobre tu descanso.", tone: "moderate" };
      return { label: "Necesita atención", message: "Buscá ayuda con tu sueño.", tone: "attention" };
    },
  },
  "Rosenberg": {
    humanLabel: "¿Cómo te sentís con vos?",
    icon: HeartHalf,
    color: "hsl(var(--mood-5))",
    interpret: (s) => {
      if (s >= 25) return { label: "Saludable", message: "Tu autoestima se ve sólida.", tone: "positive" };
      if (s >= 15) return { label: "Normal", message: "Siempre podés seguir fortaleciéndote.", tone: "moderate" };
      return { label: "Necesita atención", message: "Trabajar esto con tu psico ayuda.", tone: "attention" };
    },
  },
};

const toneBg = { positive: "bg-success/10", moderate: "bg-accent/10", attention: "bg-destructive/10" };
const toneColors = { positive: "text-success", moderate: "text-accent-foreground", attention: "text-destructive" };

export default function AllTests() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [testsByType, setTestsByType] = useState<Record<string, { date: string; score: number }[]>>({});
  const [loading, setLoading] = useState(true);
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("test_results")
      .select("test_type, score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(200)
      .then(({ data }) => {
        const grouped: Record<string, { date: string; score: number }[]> = {};
        for (const t of data ?? []) {
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

  const selectedMeta = selectedTest ? testMeta[selectedTest] : null;
  const selectedResults = selectedTest ? testsByType[selectedTest] ?? [] : [];

  return (
    <div className="px-5 pt-14 pb-28 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/mi-proceso")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold">Indicadores de bienestar</h1>
          <p className="text-xs text-muted-foreground">Todos tus indicadores en un solo lugar.</p>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-3">
          {Object.entries(testMeta).map(([type, meta], i) => {
            const results = testsByType[type] ?? [];
            const lastScore = results.length > 0 ? results[results.length - 1].score : null;
            const interp = lastScore !== null ? meta.interpret(lastScore) : null;
            const Icon = meta.icon;

            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
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
                    <p className="mt-1 text-xs text-muted-foreground italic">Todavía no completaste este indicador</p>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Estos indicadores son orientativos y no constituyen un diagnóstico clínico.
      </p>

      {/* ── Detail modal ── */}
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
                  setSelectedTest(null);
                  navigate(`/mi-proceso/tests?test=${selectedTest}`);
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
