import { motion, AnimatePresence } from "framer-motion";
import { EMOTIONS, type EmotionKey } from "@/lib/pensamientos/emotions";
import { SUB_EMOTIONS } from "@/lib/pensamientos/subEmotions";
import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = { draft: ThoughtDraft; patch: (p: Partial<ThoughtDraft>) => void };

const MAIN = EMOTIONS.filter((e) => e.key !== "otro").slice(0, 6);

export default function Step3Emociones({ draft, patch }: Props) {
  const selected = draft.emotion as EmotionKey | "";
  const subs = selected && selected !== "otro" ? SUB_EMOTIONS[selected] : [];

  const toggleSub = (s: string) => {
    const has = draft.subEmotions.includes(s);
    patch({
      subEmotions: has ? draft.subEmotions.filter((x) => x !== s) : [...draft.subEmotions, s],
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="font-serif text-[28px] font-bold leading-tight text-[#101927]">
          Emociones
        </h2>
        <p className="mt-1 text-[13px] text-[#101927]/65">
          Seleccioná las emociones predominantes y profundizá en tus subemociones.
        </p>
      </div>

      <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/45">
        Filtro de emociones
      </p>

      <div className="grid grid-cols-2 gap-2.5">
        {MAIN.map((e) => {
          const active = draft.emotion === e.key;
          return (
            <button
              key={e.key}
              onClick={() => patch({ emotion: e.key, subEmotions: e.key !== draft.emotion ? [] : draft.subEmotions })}
              className={`rounded-full border py-3.5 text-center font-display text-[14px] font-semibold transition active:scale-[0.97] ${
                active
                  ? "border-[#101927] bg-[#101927] text-white shadow-[0_10px_30px_-12px_rgba(16,25,39,0.45)]"
                  : "border-white/70 bg-white/70 text-[#101927] shadow-glass"
              }`}
            >
              {e.label}
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {subs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="rounded-3xl border border-white/70 bg-white/75 p-4 shadow-glass backdrop-blur-xl"
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
              Subemociones
            </p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              {subs.map((s) => {
                const on = draft.subEmotions.includes(s);
                return (
                  <button
                    key={s}
                    onClick={() => toggleSub(s)}
                    className={`rounded-full border px-3 py-1.5 text-[12px] font-semibold transition active:scale-95 ${
                      on
                        ? "border-[#7cc2c8] bg-[#7cc2c8]/20 text-[#101927]"
                        : "border-white/80 bg-white/80 text-[#101927]/65"
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>

            <div className="mt-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                  Intensidad
                </p>
                <span className="font-display text-[14px] font-bold text-[#7cc2c8]">
                  {draft.intensityInitial}%
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={100}
                value={draft.intensityInitial}
                onChange={(e) => patch({ intensityInitial: Number(e.target.value) })}
                className="mt-2 w-full accent-[#7cc2c8]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
