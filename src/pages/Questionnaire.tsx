import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CheckCircle } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Question = { id: string; code: string; prompt: string; kind: string; sort: number };
type Option = { id: string; question_id: string; label: string; score: number; sort: number };

export default function Questionnaire() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [options, setOptions] = useState<Option[]>([]);
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const [q, o] = await Promise.all([
        supabase.from("algo_questions").select("*").eq("active", true).in("kind", ["symptom", "personality"]).order("sort"),
        supabase.from("algo_options").select("*").order("sort"),
      ]);
      setQuestions((q.data ?? []) as Question[]);
      setOptions((o.data ?? []) as Option[]);
      setLoading(false);
    })();
  }, []);

  const current = questions[idx];
  const currentOpts = current ? options.filter((o) => o.question_id === current.id) : [];

  const pick = async (optionId: string) => {
    const next = { ...answers, [current.id]: optionId };
    setAnswers(next);
    if (idx < questions.length - 1) {
      setIdx(idx + 1);
    } else {
      if (!user) return;
      setSaving(true);
      const rows = Object.entries(next).map(([qid, oid]) => ({
        user_id: user.id,
        question_id: qid,
        option_id: oid,
      }));
      const { error } = await supabase.from("algo_user_answers").insert(rows);
      if (error) toast.error("No pudimos guardar tus respuestas");
      setSaving(false);
      setDone(true);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center safe-area-top">
        <p className="mb-4 font-display text-base text-muted-foreground">
          Todavía no hay preguntas configuradas.
        </p>
        <button onClick={() => navigate("/")} className="rounded-2xl bg-primary px-6 py-3 font-display text-sm text-primary-foreground">
          Volver al inicio
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-6 text-center safe-area-top">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <CheckCircle size={64} weight="duotone" className="mx-auto mb-4 text-accent" />
          <h1 className="mb-2 font-display text-xl font-semibold">¡Gracias por contarnos!</h1>
          <p className="mb-8 max-w-xs text-sm text-muted-foreground">
            Actualizamos tus prácticas recomendadas para hoy en tu inicio.
          </p>
          <button
            onClick={() => navigate("/")}
            className="rounded-2xl bg-primary px-8 py-3 font-display text-sm font-medium text-primary-foreground"
          >
            Ver mi inicio
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-6 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 font-display text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Salir
        </button>
      </div>

      <div className="mb-2 flex gap-1">
        {questions.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= idx ? "bg-accent" : "bg-border")} />
        ))}
      </div>
      <p className="mb-6 text-right font-display text-[10px] text-muted-foreground">
        {idx + 1}/{questions.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={current.id}
          initial={{ x: 30, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -30, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="flex-1"
        >
          <p className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
            Contanos un poco
          </p>
          <h2 className="mb-8 font-display text-lg font-medium leading-snug">{current.prompt}</h2>

          <div className="space-y-2.5">
            {currentOpts.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">Esta pregunta no tiene opciones.</p>
            ) : (
              currentOpts.map((opt) => (
                <button
                  key={opt.id}
                  disabled={saving}
                  onClick={() => pick(opt.id)}
                  className="w-full rounded-2xl bg-card p-4 text-left font-display text-sm shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] transition-all active:bg-muted active:ring-1 active:ring-accent disabled:opacity-50"
                >
                  {opt.label}
                </button>
              ))
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
