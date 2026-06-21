import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles, Loader2, Check, Wand2 } from "lucide-react";
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
  const [holisticOpen, setHolisticOpen] = useState(true);
  const [holisticText, setHolisticText] = useState("");
  const [loadingHolistic, setLoadingHolistic] = useState(false);
  const [loadingAi, setLoadingAi] = useState(false);

  const hasThought = draft.automaticThought.trim().length >= 8;
  const canCallAi = draft.triggerEvent.trim().length >= 4 && !!draft.emotion;

  const handleHolistic = async () => {
    const story = holisticText.trim();
    if (story.length < 10) {
      toast.error("Contame un poco más para que la IA pueda organizarlo.");
      return;
    }
    setLoadingHolistic(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-thought", {
        body: { mode: "holistic", story },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      const trigger = typeof data?.trigger === "string" ? data.trigger : "";
      const emotion = typeof data?.emotion === "string" ? data.emotion.toLowerCase() : "";
      const intensity = Number.isFinite(data?.intensity) ? Math.min(100, Math.max(1, Math.round(data.intensity))) : draft.intensityInitial;
      const thoughts: string[] = Array.isArray(data?.thoughts)
        ? data.thoughts.filter((t: unknown) => typeof t === "string" && t.trim().length > 0)
        : [];

      const known = EMOTIONS.find((e) => e.key === emotion || e.label.toLowerCase() === emotion);
      patch({
        triggerEvent: trigger || draft.triggerEvent,
        emotion: known ? known.key : "otro",
        emotionOther: known ? draft.emotionOther : (emotion || draft.emotionOther),
        intensityInitial: intensity,
        automaticThought: thoughts[0] ?? draft.automaticThought,
        pendingThoughts: thoughts.slice(1),
      });
      setHolisticOpen(false);
      toast.success(thoughts.length > 1
        ? "Detectamos varios pensamientos. Empezá con uno."
        : "Listo. Revisá y editá si querés.");
    } catch {
      toast.error("No pudimos consultar a la IA ahora. Probá de nuevo.");
    } finally {
      setLoadingHolistic(false);
    }
  };

  const handleAnalyze = async () => {
    if (!canCallAi) {
      toast.error("Primero cargá un evento breve y una emoción.");
      return;
    }
    const mode = hasThought ? "refine" : "identify";
    setLoadingAi(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-thought", {
        body: {
          mode,
          thought: draft.automaticThought,
          trigger: draft.triggerEvent,
          emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
          intensity: draft.intensityInitial,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      if (mode === "identify") {
        const tips = Array.isArray(data?.tips) ? data.tips.slice(0, 3) : [];
        const candidates = Array.isArray(data?.candidates) ? data.candidates.slice(0, 3) : [];
        if (!tips.length && !candidates.length) {
          toast.error("La IA no devolvió pistas. Probá de nuevo.");
          return;
        }
        patch({ aiAnalysis: { mode: "identify", tips, candidates } });
      } else {
        const factual = typeof data?.factual === "string" ? data.factual.trim() : "";
        const questions = Array.isArray(data?.questions) ? data.questions : [];
        if (!factual && questions.length === 0) {
          toast.error("La IA no devolvió respuesta. Probá de nuevo.");
          return;
        }
        patch({ aiAnalysis: { mode: "refine", factual, questions } });
      }
    } catch {
      toast.error("No pudimos consultar a la IA ahora. Probá de nuevo.");
    } finally {
      setLoadingAi(false);
    }
  };

  const adopt = (text: string) => {
    patch({ automaticThought: text, aiAnalysis: null });
  };

  const pickPending = (text: string) => {
    patch({
      automaticThought: text,
      pendingThoughts: draft.pendingThoughts.filter((t) => t !== text),
      aiAnalysis: null,
    });
  };

  return (
    <div className="space-y-3">
      {/* Holistic IA helper */}
      <GlassCard tone="gold" className="p-3.5">
        <button
          onClick={() => setHolisticOpen((v) => !v)}
          className="flex w-full items-center gap-2 text-left"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white shadow-glass">
            <Wand2 size={14} className="text-[#7cc2c8]" />
          </div>
          <div className="flex-1">
            <p className="font-display text-[13px] font-semibold text-[#101927]">
              Contame qué pasó y la IA lo organiza
            </p>
            <p className="text-[10.5px] text-[#101927]/65">
              Te separa evento, emoción y pensamiento(s).
            </p>
          </div>
          <span className="text-[20px] text-[#101927]/40">{holisticOpen ? "−" : "+"}</span>
        </button>

        <AnimatePresence>
          {holisticOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <textarea
                rows={3}
                value={holisticText}
                onChange={(e) => setHolisticText(e.target.value)}
                placeholder="Ej: Hoy en la reunión mi jefa me marcó errores, sentí que me ardía la cara y pensé que soy un desastre y que me van a echar…"
                className="mt-2.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 text-[12.5px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
              />
              <button
                onClick={handleHolistic}
                disabled={loadingHolistic}
                className="mt-2 w-full rounded-full bg-[#101927] py-2.5 font-display text-[12px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loadingHolistic ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {loadingHolistic ? "Organizando…" : "Que la IA lo organice"}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      {/* Pending thoughts */}
      {draft.pendingThoughts.length > 0 && (
        <GlassCard className="p-3">
          <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
            Otros pensamientos detectados
          </p>
          <p className="mt-0.5 text-[11px] text-[#101927]/70">
            Tocá uno para trabajar ese ahora.
          </p>
          <div className="mt-1.5 space-y-1">
            {draft.pendingThoughts.map((t, i) => (
              <button
                key={i}
                onClick={() => pickPending(t)}
                className="block w-full rounded-xl border border-white/80 bg-white/90 p-2 text-left text-[11.5px] italic text-[#101927] leading-snug active:scale-[0.99]"
              >
                "{t}" <span className="not-italic text-[10px] font-semibold text-[#92561a]">→ usar</span>
              </button>
            ))}
          </div>
        </GlassCard>
      )}

      {/* 1. Evento */}
      <GlassCard className="p-3.5">
        <p className="font-display text-[13px] font-semibold text-[#101927]">
          1. ¿Qué evento la disparó?
        </p>
        <textarea
          rows={2}
          value={draft.triggerEvent}
          onChange={(e) => patch({ triggerEvent: e.target.value })}
          placeholder="Ej: Mi jefa me marcó tres errores en público."
          className="mt-1.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 text-[12.5px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      {/* 2. Emoción */}
      <GlassCard className="p-3.5">
        <p className="font-display text-[13px] font-semibold text-[#101927]">
          2. ¿Qué emoción sentiste?
        </p>
        <select
          value={draft.emotion}
          onChange={(e) => patch({ emotion: e.target.value })}
          className="mt-1.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 font-display text-[12.5px] font-semibold text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
        >
          <option value="">Seleccioná…</option>
          {EMOTIONS.map((e) => (
            <option key={e.key} value={e.key}>{e.emoji} {e.label}</option>
          ))}
        </select>

        <AnimatePresence>
          {draft.emotion === "otro" && (
            <motion.input
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              type="text"
              placeholder="Escribí la emoción…"
              value={draft.emotionOther}
              onChange={(e) => patch({ emotionOther: e.target.value })}
              className="mt-1.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 text-[12.5px] text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            />
          )}
        </AnimatePresence>

        {draft.emotion && (
          <div className="mt-2.5">
            <div className="flex items-baseline justify-between">
              <label className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/55">
                Intensidad
              </label>
              <span className="font-display text-[15px] font-semibold text-[#101927]">
                {draft.intensityInitial}%
              </span>
            </div>
            <input
              type="range" min={1} max={100}
              value={draft.intensityInitial}
              onChange={(e) => patch({ intensityInitial: Number(e.target.value) })}
              className="mt-1 w-full accent-[#7cc2c8]"
            />
          </div>
        )}
      </GlassCard>

      {/* 3. Pensamiento + IA */}
      <GlassCard className="p-3.5">
        <p className="font-display text-[13px] font-semibold text-[#101927]">
          3. ¿Qué pensamiento cruzó por tu mente?
        </p>
        <textarea
          rows={3}
          value={draft.automaticThought}
          onChange={(e) => patch({ automaticThought: e.target.value })}
          placeholder="Tu interpretación literal (ej: Soy un completo inútil)"
          className="mt-1.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 text-[12.5px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />

        <button
          onClick={handleAnalyze}
          disabled={loadingAi || !canCallAi}
          className="mt-2 w-full rounded-full bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-2.5 font-display text-[12px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {loadingAi ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loadingAi
            ? "Pensando…"
            : hasThought
            ? draft.aiAnalysis ? "Volver a analizar" : "Refinar con IA"
            : "Ayudame a identificarlo"}
        </button>

        <AnimatePresence>
          {draft.aiAnalysis && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2.5 space-y-2 rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-white/85 to-[#facb60]/10 p-3"
            >
              {draft.aiAnalysis.mode === "identify" ? (
                <>
                  {draft.aiAnalysis.tips.length > 0 && (
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                        Pistas para identificarlo
                      </p>
                      <ul className="mt-1 space-y-0.5">
                        {draft.aiAnalysis.tips.map((t, i) => (
                          <li key={i} className="text-[11.5px] text-[#101927]/85 leading-relaxed">
                            · {t}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {draft.aiAnalysis.candidates.length > 0 && (
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                        Posibles pensamientos
                      </p>
                      <div className="mt-1 space-y-1.5">
                        {draft.aiAnalysis.candidates.map((c, i) => (
                          <button
                            key={i}
                            onClick={() => adopt(c)}
                            className="block w-full rounded-xl border border-white/80 bg-white/90 p-2 text-left text-[12px] italic text-[#101927] leading-relaxed active:scale-[0.99] transition"
                          >
                            "{c}"
                            <span className="mt-1 block not-italic text-[10px] font-semibold text-[#92561a]">
                              Tocar para usar →
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <>
                  {draft.aiAnalysis.factual && (
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                        Versión observable
                      </p>
                      <p className="mt-0.5 text-[12px] text-[#101927] leading-relaxed italic">
                        "{draft.aiAnalysis.factual}"
                      </p>
                      <button
                        onClick={() => adopt(draft.aiAnalysis!.mode === "refine" ? draft.aiAnalysis!.factual : "")}
                        className="mt-1.5 inline-flex items-center gap-1.5 rounded-full bg-[#101927] px-3 py-1.5 text-[10.5px] font-semibold text-white active:scale-95 transition"
                      >
                        <Check size={11} /> Usar esta versión
                      </button>
                    </div>
                  )}
                  {draft.aiAnalysis.questions.length > 0 && (
                    <div>
                      <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                        Preguntas socráticas
                      </p>
                      <ul className="mt-0.5 space-y-0.5">
                        {draft.aiAnalysis.questions.map((q, i) => (
                          <li key={i} className="text-[11.5px] text-[#101927]/85 leading-relaxed">
                            — {q}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
}
