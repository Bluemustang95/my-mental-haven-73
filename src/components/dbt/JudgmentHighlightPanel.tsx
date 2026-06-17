import { motion } from "framer-motion";
import { useFactJudgmentHighlight, annotateJudgments } from "@/hooks/useFactJudgmentHighlight";
import { Ic } from "./shared";

interface Props {
  text: string;
  enabled: boolean;
  onApplyReformulation: (next: string) => void;
}

/**
 * Panel que aparece debajo del textarea en el paso 2 (Hechos).
 * Resalta juicios y ofrece un botón "Reformular como hecho" con IA.
 */
export function JudgmentHighlightPanel({ text, enabled, onApplyReformulation }: Props) {
  const { data, loading } = useFactJudgmentHighlight(text, enabled);
  if (!enabled) return null;
  if (loading) {
    return (
      <div className="rounded-[20px] border border-[#facb60]/30 bg-[#facb60]/5 p-3 flex items-center gap-2">
        <motion.span
          animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-3 w-3 rounded-full border-2 border-[#facb60] border-t-transparent"
        />
        <span className="font-body text-[12px] text-[#101927]/60">Analizando juicios…</span>
      </div>
    );
  }
  if (!data || (!data.judgments?.length && !data.reformulated)) return null;

  const parts = annotateJudgments(text, data.judgments || []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-[20px] border border-[#facb60]/40 bg-gradient-to-br from-[#facb60]/10 to-white p-3.5 space-y-3"
    >
      <div className="flex items-center gap-1.5">
        <Ic.Sparkle size={12} color="#facb60" />
        <p className="font-display text-[10px] tracking-[0.12em] uppercase font-bold text-[#101927]">
          Juicios detectados
        </p>
      </div>
      {data.judgments?.length > 0 && (
        <p className="font-body text-[12.5px] leading-6 text-[#101927]/80">
          {parts.map((p, i) =>
            p.type === "mark" ? (
              <mark key={i} className="bg-[#facb60]/35 rounded px-0.5 text-[#101927]">{p.value}</mark>
            ) : (
              <span key={i}>{p.value}</span>
            )
          )}
        </p>
      )}
      {data.reformulated && (
        <button
          onClick={() => onApplyReformulation(data.reformulated)}
          className="w-full rounded-[16px] bg-[#101927] text-white py-2.5 font-display text-[12px] font-semibold active:scale-[0.97] flex items-center justify-center gap-1.5"
        >
          <Ic.Sparkle size={12} color="#facb60" />
          Reformular como hecho
        </button>
      )}
    </motion.div>
  );
}
