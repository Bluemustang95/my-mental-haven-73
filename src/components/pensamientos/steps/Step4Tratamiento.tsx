import { useState } from "react";
import { Sparkles, Loader2, Plus, X, Scale, Calendar } from "lucide-react";
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
    <div className="space-y-3">
      {/* Resumen */}
      <GlassCard className="p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
          Resumen
        </p>
        <ul className="mt-1.5 space-y-0.5 text-[11.5px] text-[#101927]/80 leading-relaxed">
          <li><span className="font-semibold">Emoción:</span> {draft.emotion === "otro" ? draft.emotionOther : draft.emotion || "—"} ({draft.intensityInitial}%)</li>
          <li><span className="font-semibold">Pensamiento:</span> "{draft.automaticThought.slice(0, 80)}{draft.automaticThought.length > 80 ? "…" : ""}"</li>
          <li><span className="font-semibold">Factualidad:</span> {score}% en contra</li>
        </ul>
      </GlassCard>

      <GlassCard className="p-4 text-center">
        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white/80 border border-white/70">
          <Scale size={16} className="text-[#101927]" />
        </div>
        <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
          Camino sugerido
        </p>
        <h2 className="mt-0.5 font-display text-[17px] font-semibold text-[#101927]">
          {isRealProblem ? "Modificación Conductual" : "Reestructuración Racional"}
        </h2>
        <p className="mt-1.5 text-[12px] text-[#101927]/70 leading-relaxed">
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
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          Pensamiento alternativo racional
        </p>
        <p className="mt-1 text-[11.5px] text-[#101927]/65 leading-relaxed">
          Unificá las evidencias en contra en un pensamiento balanceado.
        </p>
        <textarea
          rows={4}
          value={draft.alternativeThought}
          onChange={(e) => patch({ alternativeThought: e.target.value })}
          placeholder="Ej: Cometí errores puntuales que puedo corregir; eso no me define."
          className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      <GlassCard className="p-4">
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          ¿Cuánto creés ahora en el pensamiento original?
        </p>
        <div className="mt-2.5 flex items-baseline justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
            Re-evaluación
          </span>
          <span className="font-display text-[18px] font-semibold text-[#101927]">
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
            className="mt-2.5 rounded-xl bg-[#A7F3D0]/30 px-3 py-2 text-[12px] text-[#065f46] text-center"
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
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          Lluvia de ideas
        </p>
        <textarea
          rows={3}
          value={draft.brainstorm}
          onChange={(e) => patch({ brainstorm: e.target.value })}
          placeholder="Tirá ideas sueltas para resolver este problema…"
          className="mt-2 w-full rounded-2xl border border-[#101927]/10 bg-white px-3 py-2.5 text-[13px] leading-relaxed text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
        <button
          onClick={askAi}
          disabled={loading}
          className="mt-2.5 w-full rounded-full bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-2.5 font-display text-[12.5px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-60 flex items-center justify-center gap-2"
        >
          {loading ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
          {loading ? "Pensando…" : "Sugerir resoluciones con IA"}
        </button>

        {draft.aiSuggestions.length > 0 && (
          <div className="mt-2.5 space-y-1.5">
            {draft.aiSuggestions.map((s, i) => (
              <div key={i} className="rounded-2xl border border-[#facb60]/40 bg-white/80 p-2.5 text-[12px] text-[#101927] leading-relaxed">
                <span className="font-bold mr-1">{i + 1}.</span>{s}
              </div>
            ))}
          </div>
        )}
      </GlassCard>

      <GlassCard className="p-4">
        <p className="font-display text-[14px] font-semibold text-[#101927]">
          Planificador de acciones
        </p>
        <p className="mt-1 text-[11.5px] text-[#101927]/65">
          Conductas concretas y cuándo.
        </p>

        <div className="mt-3 space-y-2.5">
          {draft.actionPlan.map((r, idx) => (
            <div
              key={r.id}
              className="relative rounded-2xl border border-[#101927]/10 bg-white/80 p-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
                  Acción {idx + 1}
                </span>
                <button
                  onClick={() => removeRow(r.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-[#101927]/5 active:scale-90 transition"
                  aria-label="Eliminar acción"
                >
                  <X size={12} />
                </button>
              </div>
              <input
                value={r.what}
                onChange={(e) => updateRow(r.id, "what", e.target.value)}
                placeholder="¿Qué conducta voy a hacer?"
                className="mt-2 w-full rounded-xl border border-[#101927]/10 bg-white px-3 py-2 text-[13px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
              />
              <div className="mt-1.5 flex items-center gap-2">
                <Calendar size={13} className="shrink-0 text-[#101927]/50" />
                <input
                  value={r.when}
                  onChange={(e) => updateRow(r.id, "when", e.target.value)}
                  placeholder="¿Cuándo? (ej: mañana 10hs)"
                  className="flex-1 rounded-xl border border-[#101927]/10 bg-white px-3 py-2 text-[13px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
                />
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={addRow}
          className="mt-2.5 w-full rounded-xl border border-dashed border-[#101927]/20 bg-white/40 py-2.5 text-[12.5px] font-semibold text-[#101927]/70 flex items-center justify-center gap-1.5"
        >
          <Plus size={13} /> Sumar acción
        </button>
      </GlassCard>
    </>
  );
}
