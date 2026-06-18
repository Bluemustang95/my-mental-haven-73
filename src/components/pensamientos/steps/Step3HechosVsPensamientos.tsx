import { useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import HechosTrainer from "../pieces/HechosTrainer";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import { toast } from "@/components/ui/sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step3HechosVsPensamientos({ draft, patch }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (!draft.automaticThought.trim()) {
      toast.error("Primero completá tu pensamiento en el Paso 2.");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-thought", {
        body: { thought: draft.automaticThought, trigger: draft.triggerEvent },
      });
      if (error) throw error;
      if (data?.analysis) {
        patch({ aiAnalysis: data.analysis });
      } else if (data?.error) {
        toast.error(data.error);
      }
    } catch (e: any) {
      toast.error("No pudimos analizar tu pensamiento ahora. Probá de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <GlassCard className="p-5">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">
          Entrenamiento Clínico
        </p>
        <h2 className="mt-2 text-center font-serif text-2xl font-bold text-[#101927]">
          Hechos vs. Pensamientos
        </h2>
        <p className="mt-2 text-center text-sm text-[#101927]/70 leading-relaxed">
          Desafiar la validez empírica de tu pensamiento antes de ponerlo a prueba.
        </p>
      </GlassCard>

      <HechosTrainer
        onComplete={(score) => patch({ trainerScore: score, trainerCompleted: true })}
      />

      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          Análisis de tu pensamiento
        </p>
        <p className="mt-1 text-xs text-[#101927]/65 leading-relaxed">
          RESMA va a leer el pensamiento que cargaste y te va a mostrar por qué es una interpretación y cómo redactarlo como un hecho fáctico.
        </p>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-4 w-full rounded-2xl bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-3.5 font-display text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(124,194,200,0.6)] active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Analizando…" : "Analizar mi pensamiento con la IA"}
        </button>

        {draft.aiAnalysis && (
          <div className="mt-4 rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-white/80 to-[#facb60]/10 p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
              Análisis RESMA
            </p>
            <p className="mt-2 text-sm text-[#101927] leading-relaxed whitespace-pre-wrap">
              {draft.aiAnalysis}
            </p>
          </div>
        )}
      </GlassCard>
    </div>
  );
}
