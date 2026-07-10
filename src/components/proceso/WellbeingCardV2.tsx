import { TrendingDown } from "lucide-react";

type Props = {
  score: number;
  delta: number;
  message?: string;
  trend?: number[];
  onOpen: () => void;
};

export function WellbeingCardV2({ score, delta, onOpen }: Props) {
  const negative = delta < 0;
  return (
    <button
      onClick={onOpen}
      className="group relative flex w-full items-center justify-between overflow-hidden rounded-[20px] bg-[#101927] px-5 py-4 text-left shadow-[0_14px_32px_-20px_rgba(16,25,39,0.55)] transition active:scale-[0.99]"
    >
      <div>
        <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-white/45">
          Índice de bienestar
        </p>
        <div className="mt-1 flex items-baseline gap-1.5">
          <span className="font-serif text-[40px] font-bold leading-none text-white">{score}</span>
          <span className="text-[11px] text-white/40">/ 100</span>
        </div>
      </div>
      <span
        className="flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium"
        style={{
          background: negative ? "rgba(239,68,68,0.18)" : "rgba(34,197,94,0.18)",
          borderColor: negative ? "rgba(239,68,68,0.30)" : "rgba(34,197,94,0.30)",
          color: negative ? "#f87171" : "#4ade80",
        }}
      >
        <TrendingDown size={11} className={negative ? "" : "rotate-180"} />
        {delta > 0 ? "+" : ""}{delta}%
      </span>
    </button>
  );
}
