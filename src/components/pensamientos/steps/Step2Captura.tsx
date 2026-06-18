import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import { EMOTIONS } from "@/lib/pensamientos/emotions";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import { toast } from "sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step2Captura({ draft, patch }: Props) {
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    if (draft.automaticThought.trim().length < 8) {
      toast.error("Escribí primero tu pensamiento (al menos una frase).");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-thought", {
        body: { thought: draft.automaticThought, trigger: draft.triggerEvent },
      });
      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      const factual = typeof data?.factual === "string" ? data.factual.trim() : "";
      const questions = Array.isArray(data?.questions) ? data.questions : [];
      if (!factual && questions.length === 0) {
        toast.error("La IA no devolvió respuesta. Probá de nuevo en un momento.");
        return;
      }
      patch({ aiAnalysis: { factual, questions } });
    } catch {
      toast.error("No pudimos analizar tu pensamiento ahora. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* 1. Emoción */}
      <GlassCard className="p-4">
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          1. ¿Qué emoción sentiste?
        </p>
        <select
          value={draft.emotion}
          onChange={(e) => patch({ emotion: e.target.value })}
          className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2.5 font-display text-[13.5px] font-semibold text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
        >
          <option value="">Seleccioná una emoción…</option>
          {EMOTIONS.map((e) => (
            <option key={e.key} value={e.key}>{e.emoji} {e.label}</option>
          ))}
        </select>

        <AnimatePresence>
          {draft.emotion === "otro" && (
            <motion.input
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              type="text"
              placeholder="Escribí la emoción con tus palabras…"
              value={draft.emotionOther}
              onChange={(e) => patch({ emotionOther: e.target.value })}
              className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2.5 text-[13.5px] text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            />
          )}
        </AnimatePresence>

        {draft.emotion && (
          <div className="mt-3.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                Intensidad
              </label>
              <span className="font-display text-[17px] font-semibold text-[#101927]">
                {draft.intensityInitial}%
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={100}
              value={draft.intensityInitial}
              onChange={(e) => patch({ intensityInitial: Number(e.target.value) })}
              className="mt-1.5 w-full accent-[#7cc2c8]"
            />
          </div>
        )}
      </GlassCard>

      {/* 2. Evento */}
      <GlassCard className="p-4">
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          2. ¿Qué evento objetivo la disparó?
        </p>
        <textarea
          rows={3}
          value={draft.triggerEvent}
          onChange={(e) => patch({ triggerEvent: e.target.value })}
          placeholder="Describí la escena observable (ej: Mi jefa me marcó tres errores en público)"
          className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      {/* 3. Pensamiento + IA */}
      <GlassCard className="p-4">
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          3. ¿Qué pensamiento cruzó por tu mente?
        </p>
        <textarea
          rows={4}
          value={draft.automaticThought}
          onChange={(e) => patch({ automaticThought: e.target.value })}
          placeholder="Tu interpretación literal (ej: Soy un completo inútil)"
          className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2.5 text-[13.5px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />

        <button
          onClick={handleAnalyze}
          disabled={loading || draft.automaticThought.trim().length < 8}
          className="mt-2.5 w-full rounded-full bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-2.5 font-display text-[12.5px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? "Analizando…" : draft.aiAnalysis ? "Volver a analizar" : "Analizar con IA"}
        </button>

        <AnimatePresence>
          {draft.aiAnalysis && (draft.aiAnalysis.factual || draft.aiAnalysis.questions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-3 space-y-2.5 rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-white/80 to-[#facb60]/10 p-3"
            >
              {draft.aiAnalysis.factual && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
                    Versión fáctica sugerida
                  </p>
                  <p className="mt-1 text-[12.5px] text-[#101927] leading-relaxed italic">
                    "{draft.aiAnalysis.factual}"
                  </p>
                  <button
                    onClick={() => patch({ automaticThought: draft.aiAnalysis!.factual })}
                    className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#101927] px-3 py-1.5 text-[11px] font-semibold text-white active:scale-95 transition"
                  >
                    <Check size={11} /> Usar esta versión
                  </button>
                </div>
              )}
              {draft.aiAnalysis.questions?.length > 0 && (
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
                    Preguntas para profundizar
                  </p>
                  <ul className="mt-1 space-y-1">
                    {draft.aiAnalysis.questions.map((q, i) => (
                      <li key={i} className="text-[12px] text-[#101927]/85 leading-relaxed">
                        — {q}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
