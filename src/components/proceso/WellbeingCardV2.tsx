import { ChevronUp, TrendingDown } from "lucide-react";
import { Sparkline } from "./Sparkline";

type Props = {
  score: number;
  delta: number;
  message: string;
  trend: number[];
  onOpen: () => void;
};

export function WellbeingCardV2({ score, delta, message, trend, onOpen }: Props) {
  const negative = delta < 0;
  return (
    <button
      onClick={onOpen}
      className="group relative w-full overflow-hidden rounded-[24px] bg-[#101927] p-5 text-left shadow-[0_18px_40px_-20px_rgba(16,25,39,0.6)] transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between">
        <p className="font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.18em] text-white/45">
          Índice de bienestar
        </p>
        <span
          className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
          style={{
            background: negative ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
            borderColor: negative ? "rgba(239,68,68,0.30)" : "rgba(34,197,94,0.30)",
            color: negative ? "#f87171" : "#4ade80",
          }}
        >
          <TrendingDown size={12} className={negative ? "" : "rotate-180"} />
          {delta > 0 ? "+" : ""}{delta}%
        </span>
      </div>

      <div className="mt-3 flex items-baseline gap-2">
        <span className="font-serif text-[72px] font-bold leading-none text-white">{score}</span>
        <span className="text-sm text-white/40">de 100</span>
      </div>

      <p className="mt-3 text-[13px] leading-snug text-white/55">{message}</p>

      <div className="mt-4 -mx-1">
        <Sparkline values={trend} width={320} height={56} />
      </div>

      <div className="mt-2 flex items-center justify-center gap-1.5 text-[12px] text-white/30">
        <ChevronUp size={14} />
        <span>Ver mi análisis</span>
      </div>
    </button>
  );
}
