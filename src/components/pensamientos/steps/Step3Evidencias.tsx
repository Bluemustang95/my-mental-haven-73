import { useEffect, useState } from "react";
import { Sparkles, Loader2, Plus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { GlassCard } from "../pieces/GlassCard";
import TermometroEvidencia from "../pieces/TermometroEvidencia";
import EvidenceList from "../pieces/EvidenceList";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import { detectDistortion } from "@/lib/pensamientos/distortionDetector";
import { toast } from "sonner";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step3Evidencias({ draft, patch }: Props) {
  const [loadingSide, setLoadingSide] = useState<"for" | "against" | null>(null);
  const [suggestions, setSuggestions] = useState<{ side: "for" | "against"; items: string[] } | null>(null);
  const [openDistortion, setOpenDistortion] = useState(false);

  useEffect(() => {
    if (!draft.distortionKey && draft.automaticThought) {
      const d = detectDistortion(draft.automaticThought);
      if (d) patch({ distortionKey: d.key, distortionLabel: d.label });
    }
  }, [draft.automaticThought, draft.distortionKey, patch]);

  const distortion = draft.automaticThought ? detectDistortion(draft.automaticThought) : null;

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
    setSuggestions(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-evidence", {
        body: {
          side,
          thought: draft.automaticThought,
          trigger: draft.triggerEvent,
          existing: side === "for" ? draft.evidenceFor : draft.evidenceAgainst,
        },
      });
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      if (data?.suggestions?.length) setSuggestions({ side, items: data.suggestions });
      else toast.error("La IA no devolvió sugerencias. Probá de nuevo.");
    } catch {
      toast.error("No pudimos sugerir evidencias ahora. Probá de nuevo.");
    } finally {
      setLoadingSide(null);
    }
  };

  const acceptSuggestion = (s: string) => {
    if (!suggestions) return;
    if (suggestions.side === "for") addFor(s, "ai");
    else addAgainst(s, "ai");
    setSuggestions({ ...suggestions, items: suggestions.items.filter((x) => x !== s) });
  };

  return (
    <div className="space-y-3">
      <div className="text-center px-2">
        <h2 className="font-display text-[20px] font-semibold text-[#101927] leading-tight">
          Evidencias fácticas
        </h2>
        <p className="mt-1 text-[12px] text-[#101927]/65 leading-relaxed">
          Listá pruebas observables a favor y en contra. El medidor se mueve solo.
        </p>
      </div>

      <GlassCard className="p-4">
        <TermometroEvidencia
          favor={draft.evidenceFor.length}
          contra={draft.evidenceAgainst.length}
        />
      </GlassCard>

      {distortion && (
        <button
          onClick={() => setOpenDistortion((v) => !v)}
          className="w-full rounded-3xl border border-[#facb60]/40 bg-gradient-to-br from-[#facb60]/20 to-white/60 p-3 text-left shadow-glass active:scale-[0.99] transition"
        >
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
            Patrón cognitivo detectado
          </p>
          <p className="mt-0.5 font-display text-[13px] font-semibold text-[#101927]">
            {distortion.label}
          </p>
          <AnimatePresence>
            {openDistortion && (
              <motion.p
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: "auto", marginTop: 6 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                className="text-[11.5px] text-[#101927]/75 leading-relaxed"
              >
                {distortion.description}
              </motion.p>
            )}
          </AnimatePresence>
        </button>
      )}

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#9b1c1c]">
            A favor del pensamiento
          </p>
          <button
            onClick={() => askAi("for")}
            disabled={loadingSide !== null}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#101927] shadow-glass active:scale-95 transition disabled:opacity-50"
          >
            {loadingSide === "for" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            IA
          </button>
        </div>
        <EvidenceList
          items={draft.evidenceFor}
          onAdd={(t) => addFor(t, "user")}
          onRemove={removeFor}
          placeholder="Escribí un hecho a favor…"
          tone="favor"
          title="Hechos que lo sostienen"
          emptyHint="Sin evidencias a favor todavía."
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2 px-1">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#065f46]">
            En contra del pensamiento
          </p>
          <button
            onClick={() => askAi("against")}
            disabled={loadingSide !== null}
            className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-[10.5px] font-semibold text-[#101927] shadow-glass active:scale-95 transition disabled:opacity-50"
          >
            {loadingSide === "against" ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
            IA
          </button>
        </div>
        <EvidenceList
          items={draft.evidenceAgainst}
          onAdd={(t) => addAgainst(t, "user")}
          onRemove={removeAgainst}
          placeholder="Escribí un hecho en contra…"
          tone="contra"
          title="Hechos que lo refutan"
          emptyHint="Sin evidencias en contra todavía."
        />
      </div>

      <AnimatePresence>
        {suggestions && suggestions.items.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <GlassCard tone="gold" className="p-3">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
                  Sugerencias IA · {suggestions.side === "for" ? "a favor" : "en contra"}
                </p>
                <button onClick={() => setSuggestions(null)} className="text-[#101927]/50">
                  <X size={13} />
                </button>
              </div>
              <p className="mt-1 text-[11px] text-[#101927]/65">
                Tocá una para sumarla.
              </p>
              <div className="mt-2.5 space-y-1.5">
                {suggestions.items.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => acceptSuggestion(s)}
                    className="flex w-full items-start gap-2 rounded-2xl border border-white/70 bg-white/85 p-2.5 text-left text-[12px] text-[#101927] leading-relaxed active:scale-[0.99] transition"
                  >
                    <Plus size={12} className="mt-0.5 shrink-0 text-[#7cc2c8]" />
                    <span>{s}</span>
                  </button>
                ))}
              </div>
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
