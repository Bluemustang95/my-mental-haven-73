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
      className="group relative w-full overflow-hidden rounded-[20px] bg-[#101927] p-4 text-left shadow-[0_14px_32px_-20px_rgba(16,25,39,0.55)] transition active:scale-[0.99]"
    >
      <div className="flex items-start justify-between">
        <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
          Índice de bienestar
        </p>
        <span
          className="flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium"
          style={{
            background: negative ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
            borderColor: negative ? "rgba(239,68,68,0.30)" : "rgba(34,197,94,0.30)",
            color: negative ? "#f87171" : "#4ade80",
          }}
        >
          <TrendingDown size={10} className={negative ? "" : "rotate-180"} />
          {delta > 0 ? "+" : ""}{delta}%
        </span>
      </div>

      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-serif text-[44px] font-bold leading-none text-white">{score}</span>
        <span className="text-[11px] text-white/40">de 100</span>
      </div>

      <p className="mt-2 text-[11.5px] leading-snug text-white/55">{message}</p>

      <div className="mt-3 -mx-1">
        <Sparkline values={trend} width={320} height={40} />
      </div>

      <div className="mt-1.5 flex items-center justify-center gap-1.5 text-[10.5px] text-white/30">
        <ChevronUp size={12} />
        <span>Ver mi análisis</span>
      </div>
    </button>
  );
}
