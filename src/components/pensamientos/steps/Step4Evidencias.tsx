import { useState } from "react";
import { Sparkles, Loader2, Plus } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import TermometroEvidencia from "../pieces/TermometroEvidencia";
import EvidenceList from "../pieces/EvidenceList";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import { toast } from "sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

type Side = "for" | "against";

const PROMPT_CHIPS = [
  "Algo que pasó esta semana",
  "Algo que dijo otra persona",
  "Un dato concreto / número",
  "Una vez que no se cumplió",
];

export default function Step4Evidencias({ draft, patch }: Props) {
  const [side, setSide] = useState<Side>("against");
  const [loadingSide, setLoadingSide] = useState<Side | null>(null);
  const [suggestions, setSuggestions] = useState<{ for: string[]; against: string[] }>({ for: [], against: [] });
  const [hint, setHint] = useState<string>("");

  const items = side === "for" ? draft.evidenceFor : draft.evidenceAgainst;

  const add = (t: string, source: "user" | "ai" = "user") => {
    if (side === "for") {
      patch({
        evidenceFor: [...draft.evidenceFor, t],
        evidenceSources: { ...draft.evidenceSources, for: [...draft.evidenceSources.for, source] },
      });
    } else {
      patch({
        evidenceAgainst: [...draft.evidenceAgainst, t],
        evidenceSources: { ...draft.evidenceSources, against: [...draft.evidenceSources.against, source] },
      });
    }
  };

  const remove = (i: number) => {
    if (side === "for") {
      patch({
        evidenceFor: draft.evidenceFor.filter((_, idx) => idx !== i),
        evidenceSources: { ...draft.evidenceSources, for: draft.evidenceSources.for.filter((_, idx) => idx !== i) },
      });
    } else {
      patch({
        evidenceAgainst: draft.evidenceAgainst.filter((_, idx) => idx !== i),
        evidenceSources: { ...draft.evidenceSources, against: draft.evidenceSources.against.filter((_, idx) => idx !== i) },
      });
    }
  };

  const askAi = async (s: Side) => {
    setLoadingSide(s);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-evidence", {
        body: {
          side: s,
          thought: draft.automaticThought,
          trigger: draft.triggerEvent,
          emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
          distortion: draft.distortionLabel,
          existing: s === "for" ? draft.evidenceFor : draft.evidenceAgainst,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.suggestions?.length) {
        setSuggestions((prev) => ({ ...prev, [s]: data.suggestions }));
      } else {
        toast.error("La IA no devolvió sugerencias.");
      }
    } catch {
      toast.error("No pudimos consultar a la IA ahora.");
    } finally {
      setLoadingSide(null);
    }
  };

  const acceptSuggestion = (s: Side, text: string) => {
    if (s === "for") {
      patch({
        evidenceFor: [...draft.evidenceFor, text],
        evidenceSources: { ...draft.evidenceSources, for: [...draft.evidenceSources.for, "ai"] },
      });
    } else {
      patch({
        evidenceAgainst: [...draft.evidenceAgainst, text],
        evidenceSources: { ...draft.evidenceSources, against: [...draft.evidenceSources.against, "ai"] },
      });
    }
    setSuggestions((prev) => ({ ...prev, [s]: prev[s].filter((x) => x !== text) }));
  };

  return (
    <div className="space-y-3">
      <div className="text-center px-2">
        <h2 className="font-display text-[18px] font-semibold text-[#101927] leading-tight">
          Evidencias fácticas
        </h2>
        <p className="mt-0.5 text-[11.5px] text-[#101927]/65 leading-relaxed">
          Sumá hechos observables. El medidor se mueve solo.
        </p>
      </div>

      <GlassCard className="p-3">
        <TermometroEvidencia
          favor={draft.evidenceFor.length}
          contra={draft.evidenceAgainst.length}
        />
      </GlassCard>

      {/* Tabs */}
      <div className="grid grid-cols-2 gap-1.5 rounded-full bg-white/70 p-1 shadow-glass">
        {(["against", "for"] as const).map((s) => {
          const active = side === s;
          const label = s === "for" ? "A favor" : "En contra";
          const tone = s === "for" ? "#9b1c1c" : "#065f46";
          return (
            <button
              key={s}
              onClick={() => setSide(s)}
              className={`rounded-full py-2 font-display text-[12px] font-semibold transition ${
                active ? "bg-white shadow-sm" : "text-[#101927]/55"
              }`}
              style={active ? { color: tone } : undefined}
            >
              {label}
              <span className="ml-1 text-[10px] opacity-60">
                ({s === "for" ? draft.evidenceFor.length : draft.evidenceAgainst.length})
              </span>
            </button>
          );
        })}
      </div>

      {/* Recomendar IA */}
      <button
        onClick={() => askAi(side)}
        disabled={loadingSide !== null}
        className="w-full rounded-full bg-gradient-to-r from-[#7cc2c8] to-[#facb60] py-2.5 font-display text-[12.5px] font-semibold text-white shadow-glass active:scale-[0.98] transition disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {loadingSide === side ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
        ¿Qué me recomendás?
      </button>

      <AnimatePresence>
        {suggestions[side].length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-white/85 to-[#facb60]/15 p-2.5"
          >
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
              Tocá para sumar
            </p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {suggestions[side].map((s, i) => (
                <button
                  key={i}
                  onClick={() => acceptSuggestion(side, s)}
                  className="inline-flex max-w-full items-start gap-1 rounded-full border border-white/80 bg-white/95 px-3 py-1.5 text-left text-[11.5px] text-[#101927] leading-snug active:scale-[0.97] transition"
                >
                  <Plus size={11} className="mt-0.5 shrink-0 text-[#7cc2c8]" />
                  <span className="line-clamp-2">{s}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick prompts */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
        {PROMPT_CHIPS.map((p) => (
          <button
            key={p}
            onClick={() => setHint(p)}
            className="shrink-0 rounded-full border border-white/80 bg-white/70 px-3 py-1 text-[11px] font-semibold text-[#101927]/70 active:scale-95"
          >
            {p}
          </button>
        ))}
      </div>

      <EvidenceList
        items={items}
        onAdd={(t) => add(t, "user")}
        onRemove={remove}
        placeholder={hint || (side === "for" ? "Escribí un hecho a favor…" : "Escribí un hecho en contra…")}
        tone={side === "for" ? "favor" : "contra"}
        title={side === "for" ? "Hechos que lo sostienen" : "Hechos que lo refutan"}
        emptyHint={side === "for" ? "Sin evidencias a favor todavía." : "Sin evidencias en contra todavía."}
      />
    </div>
  );
}
