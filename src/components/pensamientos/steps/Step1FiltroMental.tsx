import { AnimatePresence, motion } from "framer-motion";
import { ArrowDown } from "lucide-react";
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
    <GlassCard className="p-5">
      <p className="text-center text-[11px] font-bold uppercase tracking-[0.18em] text-[#7cc2c8]">
        Esquema de Filtro Mental (Ficha 2.2)
      </p>

      {/* A. Evento */}
      <div className="mt-5 rounded-2xl border border-white/70 bg-white/80 p-4 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/50">
          A. Evento activador
        </p>
        <p className="mt-1 font-display text-[15px] font-semibold text-[#101927]">
          Oigo que la ventana cruje por la noche 🪟
        </p>
      </div>

      <div className="my-3 flex justify-center">
        <ArrowDown size={18} className="text-[#101927]/30" />
      </div>

      {/* Caminos */}
      <div className="grid grid-cols-2 gap-3">
        {(["catastrofista", "sabia"] as const).map((c, i) => {
          const isSelected = camino === c;
          const dimmed = camino && !isSelected;
          return (
            <button
              key={c}
              onClick={() => selectCamino(c)}
              className={`rounded-2xl border p-4 text-center transition ${
                isSelected
                  ? c === "catastrofista"
                    ? "border-[#FCA5A5] bg-[#FCA5A5]/20 ring-2 ring-[#FCA5A5]/40"
                    : "border-[#A7F3D0] bg-[#A7F3D0]/25 ring-2 ring-[#A7F3D0]/40"
                  : "border-white/70 bg-white/60"
              } ${dimmed ? "opacity-50" : ""}`}
            >
              <div className="text-2xl">{c === "catastrofista" ? "🚨" : "🍃"}</div>
              <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                Camino {i + 1}
              </p>
              <p className="mt-1 font-display text-sm font-semibold text-[#101927]">
                {c === "catastrofista" ? '"¡Un ladrón quiere entrar!"' : '"Es el viento fuerte"'}
              </p>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {camino && (
          <motion.div
            initial={{ opacity: 0, y: 12, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.4 }}
            className="overflow-hidden"
          >
            <div className="my-3 flex justify-center">
              <ArrowDown size={18} className="text-[#101927]/30" />
            </div>
            <div className="rounded-2xl border border-white/70 bg-white/80 p-4 space-y-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                  C. Elegí la emoción resultante:
                </p>
                <select
                  value={emocion ?? ""}
                  onChange={(e) => patch({ emocionDidactica: e.target.value })}
                  className="mt-2 w-full rounded-xl border border-[#101927]/10 bg-white px-3 py-3 font-display text-base font-semibold text-[#101927] focus:outline-none focus:ring-2 focus:ring-[#7cc2c8]/40"
                >
                  {CAMINO_OPCIONES[camino].map((o) => (
                    <option key={o.emotionKey} value={o.emotionKey}>{o.label}</option>
                  ))}
                </select>
              </div>

              <div className="border-t border-[#101927]/5 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                  Respuesta fisiológica:
                </p>
                <p className="mt-1 font-display text-[15px] font-semibold text-[#101927]">
                  {emocion ? FISIOLOGIA_MAP[emocion] : "—"}
                </p>
              </div>

              <div className="border-t border-[#101927]/5 pt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/55">
                  D. Comportamiento resultante:
                </p>
                <p className="mt-1 text-sm text-[#101927]/80">
                  {CONDUCTA_MAP[camino]}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </GlassCard>
  );
}
