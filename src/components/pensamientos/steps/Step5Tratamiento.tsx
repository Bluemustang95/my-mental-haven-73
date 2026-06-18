import { useState } from "react";
import { Sparkles, Loader2, Plus, X, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import type { ThoughtDraft, ActionRow } from "@/lib/pensamientos/state";
import { toast } from "@/components/ui/sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step5Tratamiento({ draft, patch }: Props) {
  const isRealProblem = draft.isRealProblem ?? false;

  return (
    <div className="space-y-4">
      <GlassCard className="p-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/80 border border-white/70 shadow-sm">
          <Scale size={22} className="text-[#101927]" />
        </div>
        <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
          Resultado de la balanza
        </p>
        <h2 className="mt-2 font-serif text-2xl font-bold text-[#101927]">
          {isRealProblem ? "Camino B: Modificación Conductual" : "Camino A: Pensamiento Alternativo"}
        </h2>
        <p className="mt-3 text-sm text-[#101927]/75 leading-relaxed">
          {isRealProblem
            ? `Las evidencias a favor de la creencia (${draft.evidenceFor.length}) tienen un peso real igual o superior a las pruebas en contra (${draft.evidenceAgainst.length}). El problema tiene bases reales y requiere modificar tu comportamiento de manera proactiva.`
            : `Las evidencias en contra (${draft.evidenceAgainst.length}) superan a las que están a favor (${draft.evidenceFor.length}). El pensamiento original no se sostiene fácticamente: corresponde reestructurarlo en una creencia más racional.`}
        </p>
      </GlassCard>

      {isRealProblem ? <CaminoB draft={draft} patch={patch} /> : <CaminoA draft={draft} patch={patch} />}
    </div>
  );
}

function CaminoA({ draft, patch }: Props) {
  const delta = draft.intensityInitial - draft.intensityFinal;

  return (
    <>
      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          Redactá un pensamiento alternativo racional
        </p>
        <p className="mt-1 text-xs text-[#101927]/65">
          Unificá las evidencias en contra que analizaste en un nuevo pensamiento balanceado.
        </p>
        <textarea
          rows={5}
          value={draft.alternativeThought}
          onChange={(e) => patch({ alternativeThought: e.target.value })}
          placeholder="Ej: Cometí errores puntuales que puedo corregir; eso no me define como profesional."
          className="mt-3 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          ¿Y ahora cuánto creés en tu pensamiento negativo inicial?
        </p>
        <div className="mt-4 flex items-baseline justify-between">
          <span className="text-[11px] font-bold uppercase tracking-widest text-[#101927]/55">
            Re-evaluación
          </span>
          <span className="font-display text-3xl font-bold text-[#101927]">
            {draft.intensityFinal}%
          </span>
        </div>
        <input
          type="range" min={0} max={100}
          value={draft.intensityFinal}
          onChange={(e) => patch({ intensityFinal: Number(e.target.value) })}
          className="mt-2 w-full accent-[#7cc2c8]"
        />
        {delta > 20 && (
          <motion.p
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 rounded-xl bg-[#A7F3D0]/30 px-3 py-2 text-sm text-[#065f46] text-center"
          >
            🌱 Bajaste {delta} puntos. La reestructuración está funcionando.
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
        },
      });
      if (error) throw error;
      if (data?.suggestions?.length) patch({ aiSuggestions: data.suggestions });
      else if (data?.error) toast.error(data.error);
    } catch {
      toast.error("No pudimos generar sugerencias ahora. Probá de nuevo en un momento.");
    } finally {
      setLoading(false);
    }
  };

  const addRow = () =>
    patch({ actionPlan: [...draft.actionPlan, { id: crypto.randomUUID(), what: "", when: "" }] });
  const updateRow = (id: string, k: keyof ActionRow, v: string) =>
    patch({
      actionPlan: draft.actionPlan.map((r) => (r.id === id ? { ...r, [k]: v } : r)),
    });
  const removeRow = (id: string) =>
    patch({ actionPlan: draft.actionPlan.filter((r) => r.id !== id) });

  return (
    <>
      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          Lluvia de ideas
        </p>
        <textarea
          rows={4}
          value={draft.brainstorm}
          onChange={(e) => patch({ brainstorm: e.target.value })}
          placeholder="Tirá ideas sueltas para resolver este problema concreto…"
          className="mt-3 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
        <button
          onClick={askAi}
          disabled={loading}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-3.5 font-display text-sm font-semibold text-white shadow-[0_10px_24px_-12px_rgba(124,194,200,0.6)] active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
          {loading ? "Pensando…" : "Sugerir resoluciones con RESMA IA"}
        </button>

        {draft.aiSuggestions.length > 0 && (
          <div className="mt-4 space-y-2">
            {draft.aiSuggestions.map((s, i) => (
              <div
                key={i}
                className="rounded-xl border border-[#facb60]/40 bg-gradient-to-br from-white/80 to-[#facb60]/10 p-3 text-sm text-[#101927] leading-relaxed"
              >
                <span className="font-bold mr-1">{i + 1}.</span>{s}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          Planificador de Acciones
        </p>
        <p className="mt-1 text-xs text-[#101927]/65">
          Listá conductas concretas y cuándo las vas a hacer.
        </p>

        <div className="mt-4 space-y-2">
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">¿Qué conducta?</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">¿Cuándo?</span>
            <span />
          </div>
          {draft.actionPlan.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input
                value={r.what}
                onChange={(e) => updateRow(r.id, "what", e.target.value)}
                placeholder="Acción"
                className="rounded-lg border border-[#101927]/10 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />
              <input
                value={r.when}
                onChange={(e) => updateRow(r.id, "when", e.target.value)}
                placeholder="Día / hora"
                className="rounded-lg border border-[#101927]/10 bg-white px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />
              <button
                onClick={() => removeRow(r.id)}
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#101927]/5 active:scale-90 transition"
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-3 w-full rounded-xl border border-dashed border-[#101927]/20 bg-white/40 py-3 text-sm font-semibold text-[#101927]/70 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Sumar acción
        </button>
      </GlassCard>
    </>
  );
}
