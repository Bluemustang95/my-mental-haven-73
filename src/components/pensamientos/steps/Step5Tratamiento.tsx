import { useState } from "react";
import { Sparkles, Loader2, Plus, X, Calendar, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import type { ThoughtDraft, ActionRow } from "@/lib/pensamientos/state";
import { toast } from "sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step5Tratamiento({ draft, patch }: Props) {
  const isRealProblem = draft.isRealProblem ?? false;
  const total = draft.evidenceFor.length + draft.evidenceAgainst.length;
  const score = total === 0 ? 50 : Math.round((draft.evidenceAgainst.length / total) * 100);

  return (
    <div className="space-y-3">
      {/* Chip resumen + camino */}
      <div className="flex items-center justify-between rounded-full bg-white/70 backdrop-blur px-3 py-1.5 border border-white/70 shadow-glass">
        <span className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
          {score}% en contra
        </span>
        <span className="font-display text-[11.5px] font-semibold text-[#101927]">
          {isRealProblem ? "Plan de acción" : "Reestructurar"}
        </span>
      </div>

      {isRealProblem ? <CaminoB draft={draft} patch={patch} /> : <CaminoA draft={draft} patch={patch} />}
    </div>
  );
}

function CaminoA({ draft, patch }: Props) {
  const [loading, setLoading] = useState(false);
  const delta = draft.intensityInitial - draft.intensityFinal;

  const askAi = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-thought", {
        body: {
          mode: "alternatives",
          thought: draft.automaticThought,
          trigger: draft.triggerEvent,
          emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
          distortion: draft.distortionLabel,
          evidenceAgainst: draft.evidenceAgainst,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const alts = Array.isArray(data?.alternatives) ? data.alternatives.slice(0, 3) : [];
      if (!alts.length) { toast.error("La IA no devolvió alternativas."); return; }
      patch({ aiAlternatives: alts });
    } catch {
      toast.error("No pudimos consultar a la IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <GlassCard className="p-3.5">
        <p className="font-display text-[13px] font-semibold text-[#101927]">
          Pensamiento alternativo racional
        </p>
        <p className="mt-0.5 text-[11px] text-[#101927]/65 leading-relaxed">
          Tocá una sugerencia para usarla o editá la tuya abajo.
        </p>

        <button
          onClick={askAi}
          disabled={loading}
          className="mt-2 w-full rounded-full bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-2.5 font-display text-[12px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? "Generando…" : draft.aiAlternatives.length ? "Nuevas alternativas" : "Sugerir alternativas con IA"}
        </button>

        <AnimatePresence>
          {draft.aiAlternatives.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 space-y-1.5"
            >
              {draft.aiAlternatives.map((alt, i) => {
                const active = draft.alternativeThought === alt;
                return (
                  <button
                    key={i}
                    onClick={() => patch({ alternativeThought: alt })}
                    className={`flex w-full items-start gap-2 rounded-xl border p-2.5 text-left text-[11.5px] leading-snug transition ${
                      active
                        ? "border-[#101927] bg-[#101927]/5"
                        : "border-white/80 bg-white/90"
                    }`}
                  >
                    {active ? (
                      <Check size={12} className="mt-0.5 shrink-0 text-[#065f46]" />
                    ) : (
                      <span className="mt-0.5 text-[10px] font-bold text-[#92561a]">{i + 1}</span>
                    )}
                    <span className="italic text-[#101927]">"{alt}"</span>
                  </button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        <textarea
          rows={3}
          value={draft.alternativeThought}
          onChange={(e) => patch({ alternativeThought: e.target.value })}
          placeholder="Ej: Cometí errores puntuales que puedo corregir; eso no me define."
          className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 text-[12px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      <GlassCard className="p-3.5">
        <div className="flex items-baseline justify-between">
          <p className="font-display text-[12.5px] font-semibold text-[#101927]">
            ¿Cuánto creés ahora?
          </p>
          <span className="font-display text-[16px] font-semibold text-[#101927]">
            {draft.intensityFinal}%
          </span>
        </div>
        <input
          type="range" min={0} max={100}
          value={draft.intensityFinal}
          onChange={(e) => patch({ intensityFinal: Number(e.target.value) })}
          className="mt-1.5 w-full accent-[#7cc2c8]"
        />
        {delta > 20 && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-2 rounded-xl bg-[#A7F3D0]/30 px-3 py-1.5 text-[11.5px] text-[#065f46] text-center"
          >
            🌱 Bajaste {delta} puntos. La reestructuración funciona.
          </motion.p>
        )}
      </GlassCard>
    </>
  );
}

function CaminoB({ draft, patch }: Props) {
  const [loading, setLoading] = useState(false);

  const askAi = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-behavior-plan", {
        body: {
          thought: draft.automaticThought,
          trigger: draft.triggerEvent,
          evidenceFor: draft.evidenceFor,
          brainstorm: draft.brainstorm,
          distortion: draft.distortionLabel,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      const actions = Array.isArray(data?.actions) ? data.actions : [];
      if (!actions.length) { toast.error("La IA no devolvió acciones."); return; }
      patch({ aiActionSuggestions: actions });
    } catch {
      toast.error("No pudimos generar sugerencias ahora.");
    } finally {
      setLoading(false);
    }
  };

  const adoptAction = (a: { what: string; when: string; why?: string }) => {
    patch({
      actionPlan: [...draft.actionPlan, { id: crypto.randomUUID(), what: a.what, when: a.when, why: a.why }],
      aiActionSuggestions: draft.aiActionSuggestions.filter((x) => x.what !== a.what),
    });
  };

  const addEmpty = () =>
    patch({ actionPlan: [...draft.actionPlan, { id: crypto.randomUUID(), what: "", when: "" }] });
  const updateRow = (id: string, k: keyof ActionRow, v: string) =>
    patch({ actionPlan: draft.actionPlan.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
  const removeRow = (id: string) =>
    patch({ actionPlan: draft.actionPlan.filter((r) => r.id !== id) });

  return (
    <>
      <GlassCard className="p-3.5">
        <p className="font-display text-[13px] font-semibold text-[#101927]">
          Lluvia de ideas
        </p>
        <textarea
          rows={2}
          value={draft.brainstorm}
          onChange={(e) => patch({ brainstorm: e.target.value })}
          placeholder="Ideas sueltas para resolver el problema…"
          className="mt-1.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2 text-[12px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
        <button
          onClick={askAi}
          disabled={loading}
          className="mt-2 w-full rounded-full bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-2.5 font-display text-[12px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? "Pensando…" : "Sugerir acciones con IA"}
        </button>

        <AnimatePresence>
          {draft.aiActionSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mt-2 space-y-1.5"
            >
              {draft.aiActionSuggestions.map((a, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-[#facb60]/40 bg-white/85 p-2.5"
                >
                  <p className="font-display text-[12px] font-semibold text-[#101927] leading-snug">
                    {a.what}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1 text-[10.5px] text-[#101927]/65">
                    <Calendar size={10} /> {a.when}
                  </div>
                  {a.why && (
                    <p className="mt-1 text-[10.5px] italic text-[#101927]/55 leading-snug">
                      {a.why}
                    </p>
                  )}
                  <button
                    onClick={() => adoptAction(a)}
                    className="mt-1.5 inline-flex items-center gap-1 rounded-full bg-[#101927] px-2.5 py-1 text-[10.5px] font-semibold text-white active:scale-95 transition"
                  >
                    <Plus size={10} /> Sumar al plan
                  </button>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>

      <GlassCard className="p-3.5">
        <div className="flex items-center justify-between">
          <p className="font-display text-[13px] font-semibold text-[#101927]">
            Mi plan de acción
          </p>
          <button
            onClick={addEmpty}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#101927] shadow-glass active:scale-95 transition"
          >
            <Plus size={10} /> Acción
          </button>
        </div>

        {draft.actionPlan.length === 0 && (
          <p className="mt-2 text-[11.5px] italic text-[#101927]/45 leading-snug">
            Vacío. Sumá una acción IA o creá una manual.
          </p>
        )}

        <div className="mt-2 space-y-1.5">
          {draft.actionPlan.map((r) => (
            <div
              key={r.id}
              className="rounded-xl border border-[#101927]/10 bg-white/80 p-2"
            >
              <div className="flex items-start gap-1.5">
                <input
                  value={r.what}
                  onChange={(e) => updateRow(r.id, "what", e.target.value)}
                  placeholder="¿Qué acción?"
                  className="flex-1 rounded-lg border border-[#101927]/10 bg-white px-2 py-1.5 text-[12px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-1 focus:ring-[#7cc2c8]/40"
                />
                <button
                  onClick={() => removeRow(r.id)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#101927]/5 active:scale-90 transition"
                >
                  <X size={11} />
                </button>
              </div>
              <div className="mt-1 flex items-center gap-1.5">
                <Calendar size={11} className="shrink-0 text-[#101927]/50" />
                <input
                  value={r.when}
                  onChange={(e) => updateRow(r.id, "when", e.target.value)}
                  placeholder="¿Cuándo? (ej: mañana 10hs)"
                  className="flex-1 rounded-lg border border-[#101927]/10 bg-white px-2 py-1.5 text-[12px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-1 focus:ring-[#7cc2c8]/40"
                />
              </div>
            </div>
          ))}
        </div>
      </GlassCard>
    </>
  );
}
