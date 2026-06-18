import { motion } from "framer-motion";

type Props = {
  favor: number;
  contra: number;
};

export default function TermometroEvidencia({ favor, contra }: Props) {
  const total = favor + contra;
  const score = total === 0 ? 50 : Math.round((contra / total) * 100);

  let label = "Sin evidencias todavía";
  let tone = "text-[#101927]/55";
  if (total > 0) {
    if (score >= 70) { label = "Pensamiento poco sostenido por hechos"; tone = "text-[#065f46]"; }
    else if (score >= 50) { label = "Sostenido parcialmente"; tone = "text-[#92561a]"; }
    else if (score >= 30) { label = "Bastante sostenido por hechos"; tone = "text-[#92561a]"; }
    else { label = "Muy sostenido por hechos"; tone = "text-[#9b1c1c]"; }
  }

  return (
    <div className="w-full">
      <div className="flex items-baseline justify-between">
        <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/55">
          Medidor factual
        </span>
        <span className="font-display text-2xl font-bold text-[#101927]">
          {total === 0 ? "—" : `${score}%`}
        </span>
      </div>

      <div className="relative mt-2 h-3.5 w-full overflow-hidden rounded-full bg-gradient-to-r from-[#FCA5A5]/40 via-[#facb60]/40 to-[#A7F3D0]/50">
        <motion.div
          initial={false}
          animate={{ left: `${score}%` }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="absolute top-1/2 h-5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#101927] shadow-[0_2px_8px_rgba(16,25,39,0.35)]"
        />
      </div>

      <div className="mt-1.5 flex justify-between text-[10px] font-semibold text-[#101927]/55">
        <span>Sostenido</span>
        <span>No sostenido</span>
      </div>

      <p className={`mt-3 text-center text-[13px] font-semibold ${tone}`}>
        {label}
      </p>

      {total > 0 && (
        <p className="mt-1 text-center text-[11px] text-[#101927]/55">
          {favor} a favor · {contra} en contra
        </p>
      )}
    </div>
  );
}
