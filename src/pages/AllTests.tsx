import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Lightning, Sparkle, Moon, HeartHalf, CaretRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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
  const [lastScores, setLastScores] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("test_results")
      .select("test_type, score, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        const last: Record<string, number> = {};
        for (const t of data ?? []) {
          if (!last[t.test_type]) last[t.test_type] = t.score;
        }
        setLastScores(last);
        setLoading(false);
      });
  }, [user]);

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
            const score = lastScores[type] ?? null;
            const interp = score !== null ? meta.interpret(score) : null;
            const Icon = meta.icon;

            return (
              <motion.button
                key={type}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(`/mi-proceso/tests?test=${type}`)}
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
                <CaretRight size={16} className="text-muted-foreground shrink-0" />
              </motion.button>
            );
          })}

          {/* New test CTA */}
          <button
            onClick={() => navigate("/mi-proceso/tests")}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/30 bg-accent/5 py-4 font-display text-sm font-medium text-accent-foreground/80 transition-colors active:bg-accent/10"
          >
            Realizar un nuevo test
          </button>
        </div>
      )}

      <p className="mt-6 text-center text-[10px] text-muted-foreground">
        Estos indicadores son orientativos y no constituyen un diagnóstico clínico.
      </p>
    </div>
  );
}
