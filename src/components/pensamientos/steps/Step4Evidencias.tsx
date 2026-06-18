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

export default function Step4Evidencias({ draft, patch }: Props) {
  const [loadingSide, setLoadingSide] = useState<"for" | "against" | null>(null);
  const [suggestions, setSuggestions] = useState<Record<"for" | "against", string[]>>({ for: [], against: [] });

  const addFor = (t: string, source: "user" | "ai" = "user") =>
    patch({
      evidenceFor: [...draft.evidenceFor, t],
      evidenceSources: { ...draft.evidenceSources, for: [...draft.evidenceSources.for, source] },
    });
  const removeFor = (i: number) =>
    patch({
      evidenceFor: draft.evidenceFor.filter((_, idx) => idx !== i),
      evidenceSources: { ...draft.evidenceSources, for: draft.evidenceSources.for.filter((_, idx) => idx !== i) },
    });
  const addAgainst = (t: string, source: "user" | "ai" = "user") =>
    patch({
      evidenceAgainst: [...draft.evidenceAgainst, t],
      evidenceSources: { ...draft.evidenceSources, against: [...draft.evidenceSources.against, source] },
    });
  const removeAgainst = (i: number) =>
    patch({
      evidenceAgainst: draft.evidenceAgainst.filter((_, idx) => idx !== i),
      evidenceSources: { ...draft.evidenceSources, against: draft.evidenceSources.against.filter((_, idx) => idx !== i) },
    });

  const askAi = async (side: "for" | "against") => {
    setLoadingSide(side);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-evidence", {
        body: {
          side,
          thought: draft.automaticThought,
          trigger: draft.triggerEvent,
          emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
          distortion: draft.distortionLabel,
          existing: side === "for" ? draft.evidenceFor : draft.evidenceAgainst,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.suggestions?.length) {
        setSuggestions((s) => ({ ...s, [side]: data.suggestions }));
      } else {
        toast.error("La IA no devolvió sugerencias.");
      }
    } catch {
      toast.error("No pudimos consultar a la IA ahora.");
    } finally {
      setLoadingSide(null);
    }
  };

  const acceptSuggestion = (side: "for" | "against", text: string) => {
    if (side === "for") addFor(text, "ai");
    else addAgainst(text, "ai");
    setSuggestions((s) => ({ ...s, [side]: s[side].filter((x) => x !== text) }));
  };

  return (
    <div className="space-y-3">
      <div className="text-center px-2">
        <h2 className="font-display text-[18px] font-semibold text-[#101927] leading-tight">
          Evidencias fácticas
        </h2>
        <p className="mt-0.5 text-[11.5px] text-[#101927]/65 leading-relaxed">
          Hechos observables a favor y en contra. El medidor se mueve solo.
        </p>
      </div>

      <GlassCard className="p-3">
        <TermometroEvidencia
          favor={draft.evidenceFor.length}
          contra={draft.evidenceAgainst.length}
        />
      </GlassCard>

      {(["for", "against"] as const).map((side) => {
        const isFor = side === "for";
        return (
          <div key={side} className="space-y-1.5">
            <div className="flex items-center justify-between gap-2 px-1">
              <p className={`text-[10px] font-bold uppercase tracking-widest ${isFor ? "text-[#9b1c1c]" : "text-[#065f46]"}`}>
                {isFor ? "A favor del pensamiento" : "En contra del pensamiento"}
              </p>
              <button
                onClick={() => askAi(side)}
                disabled={loadingSide !== null}
                className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#101927] shadow-glass active:scale-95 transition disabled:opacity-50"
              >
                {loadingSide === side ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                Sugerencias IA
              </button>
            </div>

            <EvidenceList
              items={isFor ? draft.evidenceFor : draft.evidenceAgainst}
              onAdd={(t) => (isFor ? addFor(t, "user") : addAgainst(t, "user"))}
              onRemove={isFor ? removeFor : removeAgainst}
              placeholder={isFor ? "Escribí un hecho a favor…" : "Escribí un hecho en contra…"}
              tone={isFor ? "favor" : "contra"}
              title={isFor ? "Hechos que lo sostienen" : "Hechos que lo refutan"}
              emptyHint={isFor ? "Sin evidencias a favor todavía." : "Sin evidencias en contra todavía."}
            />

            <AnimatePresence>
              {suggestions[side].length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl border border-[#facb60]/40 bg-gradient-to-br from-white/85 to-[#facb60]/15 p-2.5"
                >
                  <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                    Sugerencias IA · tocá para sumar
                  </p>
                  <div className="mt-1.5 space-y-1">
                    {suggestions[side].map((s, i) => (
                      <button
                        key={i}
                        onClick={() => acceptSuggestion(side, s)}
                        className="flex w-full items-start gap-1.5 rounded-xl border border-white/80 bg-white/90 p-2 text-left text-[11.5px] text-[#101927] leading-snug active:scale-[0.99] transition"
                      >
                        <Plus size={11} className="mt-0.5 shrink-0 text-[#7cc2c8]" />
                        <span>{s}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
