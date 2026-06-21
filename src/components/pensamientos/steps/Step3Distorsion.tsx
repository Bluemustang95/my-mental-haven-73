import { useEffect, useMemo, useState } from "react";
import { Brain, Info, Eye, Repeat, Compass } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "../pieces/GlassCard";
import DistortionPicker from "../pieces/DistortionPicker";
import { detectDistortion, getDistortion } from "@/lib/pensamientos/distortionDetector";
import type { ThoughtDraft } from "@/lib/pensamientos/state";

type Props = {
  draft: ThoughtDraft;
  patch: (p: Partial<ThoughtDraft>) => void;
};

const BENEFITS = [
  {
    Icon: Eye,
    title: "Le ponés nombre al automatismo",
    desc: "Deja de ser invisible y empezás a observarlo.",
  },
  {
    Icon: Repeat,
    title: "Ves el patrón repetido",
    desc: "Tu historial muestra la raíz, no solo el síntoma.",
  },
  {
    Icon: Compass,
    title: "Habilita el contra‑argumento justo",
    desc: "Cada distorsión tiene una salida específica.",
  },
];

export default function Step3Distorsion({ draft, patch }: Props) {
  const [showPicker, setShowPicker] = useState(false);

  const auto = useMemo(
    () => detectDistortion(draft.automaticThought),
    [draft.automaticThought]
  );

  useEffect(() => {
    if (!draft.distortionKey && auto) {
      patch({ distortionKey: auto.key, distortionLabel: auto.label });
    }
  }, [auto, draft.distortionKey, patch]);

  const selected = getDistortion(draft.distortionKey);

  return (
    <div className="space-y-3">
      <div className="text-center px-2">
        <h2 className="font-display text-[18px] font-semibold text-[#101927] leading-tight">
          Distorsión cognitiva
        </h2>
        <p className="mt-0.5 text-[11.5px] text-[#101927]/65 leading-relaxed">
          Identificar el patrón te quita poder al automatismo.
        </p>
      </div>

      {/* Why register — bigger bullets up top */}
      <GlassCard tone="gold" className="p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#92561a]">
          Por qué registrarlo
        </p>
        <ul className="mt-2.5 space-y-2.5">
          {BENEFITS.map(({ Icon, title, desc }) => (
            <li key={title} className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white shadow-glass">
                <Icon size={16} className="text-[#92561a]" />
              </div>
              <div className="flex-1">
                <p className="font-display text-[13px] font-semibold text-[#101927] leading-snug">
                  {title}
                </p>
                <p className="mt-0.5 text-[11.5px] text-[#101927]/75 leading-snug">
                  {desc}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </GlassCard>

      {selected ? (
        <GlassCard className="p-3.5">
          <div className="flex items-start gap-2.5">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#facb60]/30 border border-[#facb60]/40">
              <Brain size={14} className="text-[#92561a]" />
            </div>
            <div className="flex-1">
              <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#92561a]">
                {auto?.key === selected.key ? "Detectada automáticamente" : "Elegida"}
              </p>
              <p className="mt-0.5 font-display text-[14px] font-semibold text-[#101927] leading-tight">
                {selected.label}
              </p>
            </div>
          </div>

          <p className="mt-2.5 text-[12px] text-[#101927]/80 leading-relaxed">
            {selected.description}
          </p>

          <div className="mt-2 rounded-xl bg-white/70 border border-white/80 px-2.5 py-1.5">
            <p className="text-[9.5px] font-bold uppercase tracking-widest text-[#101927]/45">
              Ejemplo típico
            </p>
            <p className="mt-0.5 text-[11.5px] italic text-[#101927]/80 leading-snug">
              "{selected.example}"
            </p>
          </div>
        </GlassCard>
      ) : (
        <GlassCard className="p-3.5">
          <div className="flex items-start gap-2.5">
            <Info size={14} className="mt-0.5 text-[#101927]/50 shrink-0" />
            <div>
              <p className="font-display text-[13px] font-semibold text-[#101927]">
                No detectamos un patrón evidente
              </p>
              <p className="mt-0.5 text-[11.5px] text-[#101927]/70 leading-relaxed">
                Igual podés marcar la distorsión que más te resuene. O seguir sin etiquetar.
              </p>
            </div>
          </div>
        </GlassCard>
      )}

      <button
        onClick={() => setShowPicker((v) => !v)}
        className="w-full rounded-2xl border border-dashed border-[#101927]/20 bg-white/40 py-2 text-[11.5px] font-semibold text-[#101927]/70"
      >
        {showPicker ? "Cerrar" : selected ? "Cambiar distorsión" : "Elegir una distorsión"}
      </button>

      <AnimatePresence>
        {showPicker && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <GlassCard className="p-3">
              <DistortionPicker
                selected={draft.distortionKey}
                onSelect={(key, label) => patch({ distortionKey: key, distortionLabel: label })}
              />
            </GlassCard>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
