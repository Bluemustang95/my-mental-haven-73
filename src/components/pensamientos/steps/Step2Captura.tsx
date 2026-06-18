import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "../pieces/GlassCard";
import { EMOTIONS } from "@/lib/pensamientos/emotions";
import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step2Captura({ draft, patch }: Props) {
  return (
    <div className="space-y-4">
      {/* 1. Emoción */}
      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          1. ¿Qué emoción sentiste?
        </p>
        <select
          value={draft.emotion}
          onChange={(e) => patch({ emotion: e.target.value })}
          className="mt-3 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3.5 font-display text-base font-semibold text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
        >
          <option value="">Seleccioná una emoción…</option>
          {EMOTIONS.map((e) => (
            <option key={e.key} value={e.key}>{e.emoji} {e.label}</option>
          ))}
        </select>

        <AnimatePresence>
          {draft.emotion === "otro" && (
            <motion.input
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              type="text"
              placeholder="Escribí la emoción con tus palabras…"
              value={draft.emotionOther}
              onChange={(e) => patch({ emotionOther: e.target.value })}
              className="mt-3 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-base text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
            />
          )}
        </AnimatePresence>

        {/* Intensity */}
        {draft.emotion && (
          <div className="mt-5">
            <div className="flex items-baseline justify-between">
              <label className="text-[11px] font-bold uppercase tracking-widest text-[#101927]/55">
                Intensidad del malestar
              </label>
              <span className="font-display text-2xl font-bold text-[#101927]">
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
              style={{
                background: `linear-gradient(to right, #7cc2c8 0%, #facb60 ${draft.intensityInitial}%, #e5e7eb ${draft.intensityInitial}%)`,
                height: 6,
                borderRadius: 999,
                WebkitAppearance: "none",
              }}
            />
          </div>
        )}
      </GlassCard>

      {/* 2. Evento */}
      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          2. ¿Qué evento objetivo la disparó?
        </p>
        <textarea
          rows={4}
          value={draft.triggerEvent}
          onChange={(e) => patch({ triggerEvent: e.target.value })}
          placeholder="Describí objetivamente la escena (ej: Mi jefa me marcó tres errores de redacción en público)"
          className="mt-3 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>

      {/* 3. Pensamiento */}
      <GlassCard className="p-5">
        <p className="font-display text-base font-bold text-[#101927]">
          3. ¿Qué pensamiento cruzó por tu mente?
        </p>
        <textarea
          rows={5}
          value={draft.automaticThought}
          onChange={(e) => patch({ automaticThought: e.target.value })}
          placeholder="La interpretación que le diste (ej: Soy un completo inútil, no sirvo para este puesto)"
          className="mt-3 w-full rounded-2xl border border-[#101927]/10 bg-white px-4 py-3 text-[15px] leading-relaxed text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40 resize-none"
        />
      </GlassCard>
    </div>
  );
}
