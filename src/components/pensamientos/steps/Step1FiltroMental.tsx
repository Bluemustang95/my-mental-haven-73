import { AnimatePresence, motion } from "framer-motion";
import { GlassCard } from "../pieces/GlassCard";
import {
  CAMINO_OPCIONES, CONDUCTA_MAP, FISIOLOGIA_MAP, type Camino,
} from "@/lib/pensamientos/emotions";
import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

export default function Step1FiltroMental({ draft, patch }: Props) {
  const camino = draft.caminoElegido;
  const emocion = draft.emocionDidactica;

  const selectCamino = (c: Camino) => {
    patch({ caminoElegido: c, emocionDidactica: CAMINO_OPCIONES[c][0].emotionKey });
  };

  return (
    <GlassCard className="p-3.5">
      <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">
        Esquema de Filtro Mental
      </p>

      {/* Evento */}
      <div className="mt-3 rounded-2xl border border-white/70 bg-white/80 px-3 py-2 text-center">
        <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/45">
          A. Evento
        </p>
        <p className="mt-0.5 font-display text-[12.5px] font-semibold text-[#101927]">
          La ventana cruje por la noche 🪟
        </p>
      </div>

      <p className="my-1 text-center text-[10px] text-[#101927]/35">↓</p>

      {/* Caminos */}
      <div className="grid grid-cols-2 gap-2">
        {(["catastrofista", "sabia"] as const).map((c, i) => {
          const isSelected = camino === c;
          const dimmed = camino && !isSelected;
          return (
            <button
              key={c}
              onClick={() => selectCamino(c)}
              className={`rounded-2xl border p-2.5 text-center transition ${
                isSelected
                  ? c === "catastrofista"
                    ? "border-[#FCA5A5] bg-[#FCA5A5]/20 ring-2 ring-[#FCA5A5]/40"
                    : "border-[#A7F3D0] bg-[#A7F3D0]/25 ring-2 ring-[#A7F3D0]/40"
                  : "border-white/70 bg-white/60"
              } ${dimmed ? "opacity-50" : ""}`}
            >
              <div className="text-lg leading-none">{c === "catastrofista" ? "🚨" : "🍃"}</div>
              <p className="mt-1 text-[9px] font-bold uppercase tracking-widest text-[#101927]/55">
                Camino {i + 1}
              </p>
              <p className="mt-0.5 font-display text-[11.5px] font-semibold text-[#101927] leading-tight">
                {c === "catastrofista" ? '"¡Un ladrón!"' : '"Es el viento"'}
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {camino && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.35 }}
            className="overflow-hidden"
          >
            <p className="my-1 text-center text-[10px] text-[#101927]/35">↓</p>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/50 shrink-0">
                  C. Emoción
                </span>
                <select
                  value={emocion ?? ""}
                  onChange={(e) => patch({ emocionDidactica: e.target.value })}
                  className="flex-1 rounded-lg border border-[#101927]/10 bg-white px-2 py-1 font-display text-[12px] font-semibold text-[#101927] focus:outline-none focus:ring-1 focus:ring-[#7cc2c8]/40"
                >
                  {CAMINO_OPCIONES[camino].map((o) => (
                    <option key={o.emotionKey} value={o.emotionKey}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 text-[11.5px] leading-snug">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/50 shrink-0 w-12 pt-0.5">
                  Cuerpo
                </span>
                <span className="text-[#101927]/80">
                  {emocion ? FISIOLOGIA_MAP[emocion] : "—"}
                </span>
              </div>

              <div className="flex gap-2 text-[11.5px] leading-snug">
                <span className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/50 shrink-0 w-12 pt-0.5">
                  D. Acción
                </span>
                <span className="text-[#101927]/80">
                  {CONDUCTA_MAP[camino]}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
