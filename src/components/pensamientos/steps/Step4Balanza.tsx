import { useEffect } from "react";
import { GlassCard } from "../pieces/GlassCard";
import BalanzaFisica from "../pieces/BalanzaFisica";
import EvidenceList from "../pieces/EvidenceList";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import { detectDistortion } from "@/lib/pensamientos/distortionDetector";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step4Balanza({ draft, patch }: Props) {
  // Auto-detect distortion when entering this step
  useEffect(() => {
    if (!draft.distortionKey && draft.automaticThought) {
      const d = detectDistortion(draft.automaticThought);
      if (d) patch({ distortionKey: d.key, distortionLabel: d.label });
    }
  }, [draft.automaticThought, draft.distortionKey, patch]);

  const distortion = draft.automaticThought ? detectDistortion(draft.automaticThought) : null;

  const addFor = (t: string) =>
    patch({ evidenceFor: [...draft.evidenceFor, t] });
  const removeFor = (i: number) =>
    patch({ evidenceFor: draft.evidenceFor.filter((_, idx) => idx !== i) });
  const addAgainst = (t: string) =>
    patch({ evidenceAgainst: [...draft.evidenceAgainst, t] });
  const removeAgainst = (i: number) =>
    patch({ evidenceAgainst: draft.evidenceAgainst.filter((_, idx) => idx !== i) });

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="font-serif text-3xl font-bold text-[#101927]">
          Balanza de Evidencias
        </h2>
        <p className="mt-2 text-sm text-[#101927]/65 leading-relaxed px-2">
          Ingresá todas las evidencias fácticas que puedas. La balanza se inclinará automáticamente según la cantidad de pruebas a cada lado.
        </p>
      </div>

      <GlassCard className="p-4">
        <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">
          Balanza de Mente Sabia
        </p>
        <BalanzaFisica
          favor={draft.evidenceFor.length}
          contra={draft.evidenceAgainst.length}
        />
      </GlassCard>

      <EvidenceList
        items={draft.evidenceFor}
        onAdd={addFor}
        onRemove={removeFor}
        placeholder="Escribí un hecho a favor…"
        tone="favor"
        title="Evidencias a favor de tu pensamiento…"
        emptyHint="No se agregaron evidencias a favor todavía."
      />

      <EvidenceList
        items={draft.evidenceAgainst}
        onAdd={addAgainst}
        onRemove={removeAgainst}
        placeholder="Escribí un hecho en contra…"
        tone="contra"
        title="Evidencias en contra…"
        emptyHint="No se agregaron evidencias en contra todavía."
      />

      {distortion && (
        <GlassCard tone="gold" className="p-5">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
            Análisis de Patrón Cognitivo
          </p>
          <h3 className="mt-2 font-serif text-xl font-bold text-[#101927]">
            {distortion.label}
          </h3>
          <p className="mt-2 text-sm text-[#101927]/80 leading-relaxed">
            {distortion.description}
          </p>
          <p className="mt-3 text-[11px] italic text-[#101927]/55">
            Tomalo en cuenta para hablarlo en tu próximo turno.
          </p>
        </GlassCard>
      )}
    </div>
  );
}
