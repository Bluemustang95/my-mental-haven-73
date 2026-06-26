import { useMemo } from "react";
import { BODY_SENSATIONS } from "@/lib/pensamientos/bodySensations";
import type { ThoughtDraft } from "@/lib/pensamientos/state";
import type { EmotionKey } from "@/lib/pensamientos/emotions";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

export default function Step5Sensaciones({ draft, patch }: Props) {
  const emo = draft.emotion as EmotionKey;

  const ordered = useMemo(() => {
    const linked = BODY_SENSATIONS.filter((s) => s.linkedEmotions.includes(emo));
    const rest = BODY_SENSATIONS.filter((s) => !s.linkedEmotions.includes(emo));
    return [...linked, ...rest];
  }, [emo]);

  const linkedIds = new Set(BODY_SENSATIONS.filter((s) => s.linkedEmotions.includes(emo)).map((s) => s.id));

  const toggle = (id: string) => {
    const has = draft.bodySensations.includes(id);
    patch({
      bodySensations: has ? draft.bodySensations.filter((x) => x !== id) : [...draft.bodySensations, id],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Sensaciones corporales
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          ¿Dónde impacta en tu cuerpo? Ancladas a tu sentir.
        </p>
      </div>

      <div className="rounded-3xl border border-white/60 bg-white/55 p-3 shadow-glass backdrop-blur-xl">
        <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/45 py-1">
          ¿En qué parte del cuerpo lo sentís?
        </p>
        <div className="grid grid-cols-2 gap-2 mt-1">
          {ordered.map((s) => {
            const on = draft.bodySensations.includes(s.id);
            const isLinked = linkedIds.has(s.id);
            return (
              <button
                key={s.id}
                onClick={() => toggle(s.id)}
                className={`relative rounded-2xl border p-3 text-left transition active:scale-[0.97] ${
                  on
                    ? "border-[#7cc2c8] bg-[#7cc2c8]/15 shadow-sm"
                    : "border-white/80 bg-white/85"
                }`}
              >
                {isLinked && !on && (
                  <span className="absolute -top-1.5 left-2 rounded-full bg-[#7cc2c8] px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider text-white">
                    Frecuente en tu sentir
                  </span>
                )}
                <p className="font-display text-[12.5px] font-semibold leading-snug text-[#101927]">
                  {s.label} <span className="ml-0.5">{s.emoji}</span>
                </p>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
