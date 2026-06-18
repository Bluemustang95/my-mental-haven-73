import { useState } from "react";
import { Sparkles, Loader2, Plus, X, Scale } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import type { ThoughtDraft, ActionRow } from "@/lib/pensamientos/state";
import { toast } from "sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step4Tratamiento({ draft, patch }: Props) {
  const isRealProblem = draft.isRealProblem ?? false;
  const total = draft.evidenceFor.length + draft.evidenceAgainst.length;
  const score = total === 0 ? 50 : Math.round((draft.evidenceAgainst.length / total) * 100);

  return (
    <div className="space-y-3.5">
      {/* Resumen */}
      <GlassCard className="p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
          Resumen
        </p>
        <ul className="mt-2 space-y-1 text-[12.5px] text-[#101927]/80">
          <li><span className="font-semibold">Emoción:</span> {draft.emotion === "otro" ? draft.emotionOther : draft.emotion || "—"} ({draft.intensityInitial}%)</li>
          <li><span className="font-semibold">Pensamiento:</span> "{draft.automaticThought.slice(0, 90)}{draft.automaticThought.length > 90 ? "…" : ""}"</li>
          <li><span className="font-semibold">Factualidad:</span> {score}% en contra</li>
        </ul>
      </GlassCard>

      <GlassCard className="p-4 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-white/80 border border-white/70">
          <Scale size={18} className="text-[#101927]" />
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
          Camino sugerido
        </p>
        <h2 className="mt-1 font-serif text-xl font-bold text-[#101927]">
          {isRealProblem ? "Modificación Conductual" : "Reestructuración Racional"}
        </h2>
        <p className="mt-2 text-[12.5px] text-[#101927]/70 leading-relaxed">
          {isRealProblem
            ? "El pensamiento se sostiene con hechos. Conviene actuar sobre la realidad con un plan concreto."
            : "El pensamiento no se sostiene fácticamente. Conviene reescribirlo en una versión más balanceada."}
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
      <GlassCard className="p-4">
        <p className="font-display text-[15px] font-bold text-[#101927]">
          Pensamiento alternativo racional
        </p>
        <p className="mt-1 text-[11.5px] text-[#101927]/65">
          Unificá las evidencias en contra en un pensamiento balanceado.
        </p>
        <textarea
          rows={4}
          value={draft.alternativeThought}
          onChange={(e) => patch({ alternativeThought: e.target.value })}
          placeholder="Ej: Cometí errores puntuales que puedo corregir; eso no me define."
          className="mt-2.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      <GlassCard className="p-4">
        <p className="font-display text-[15px] font-bold text-[#101927]">
          ¿Cuánto creés ahora en el pensamiento original?
        </p>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
            Re-evaluación
          </span>
          <span className="font-display text-2xl font-bold text-[#101927]">
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
            className="mt-3 rounded-xl bg-[#A7F3D0]/30 px-3 py-2 text-[13px] text-[#065f46] text-center"
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
      toast.error("No pudimos generar sugerencias ahora.");
    } finally {
      setLoading(false);
    }
  };

  const addRow = () =>
    patch({ actionPlan: [...draft.actionPlan, { id: crypto.randomUUID(), what: "", when: "" }] });
  const updateRow = (id: string, k: keyof ActionRow, v: string) =>
    patch({ actionPlan: draft.actionPlan.map((r) => (r.id === id ? { ...r, [k]: v } : r)) });
  const removeRow = (id: string) =>
    patch({ actionPlan: draft.actionPlan.filter((r) => r.id !== id) });

  return (
    <>
      <GlassCard className="p-4">
        <p className="font-display text-[15px] font-bold text-[#101927]">
          Lluvia de ideas
        </p>
        <textarea
          rows={3}
          value={draft.brainstorm}
          onChange={(e) => patch({ brainstorm: e.target.value })}
          placeholder="Tirá ideas sueltas para resolver este problema…"
          className="mt-2.5 w-full rounded-2xl border border-[#101927]/10 bg-white px-3.5 py-2.5 text-[14px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
        <button
          onClick={askAi}
          disabled={loading}
          className="mt-3 w-full rounded-2xl bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-3 font-display text-[13px] font-semibold text-white shadow-[0_10px_24px_-12px_rgba(124,194,200,0.6)] active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {loading ? "Pensando…" : "Sugerir resoluciones con IA"}
        </button>

        {draft.aiSuggestions.length > 0 && (
          <div className="mt-3 space-y-2">
            {draft.aiSuggestions.map((s, i) => (
              <div key={i} className="rounded-xl border border-[#facb60]/40 bg-white/70 p-3 text-[13px] text-[#101927] leading-relaxed">
                <span className="font-bold mr-1">{i + 1}.</span>{s}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <p className="font-display text-[15px] font-bold text-[#101927]">
          Planificador de acciones
        </p>
        <p className="mt-1 text-[11.5px] text-[#101927]/65">
          Conductas concretas y cuándo.
        </p>
        <div className="mt-3 space-y-2">
          {draft.actionPlan.map((r) => (
            <div key={r.id} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
              <input
                value={r.what}
                onChange={(e) => updateRow(r.id, "what", e.target.value)}
                placeholder="Acción"
                className="rounded-lg border border-[#101927]/10 bg-white px-2.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />
              <input
                value={r.when}
                onChange={(e) => updateRow(r.id, "when", e.target.value)}
                placeholder="Día / hora"
                className="rounded-lg border border-[#101927]/10 bg-white px-2.5 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
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
          className="mt-3 w-full rounded-xl border border-dashed border-[#101927]/20 bg-white/40 py-2.5 text-[13px] font-semibold text-[#101927]/70 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} /> Sumar acción
        </button>
      </GlassCard>
    </>
  );
}
