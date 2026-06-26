import { Sun, ChevronRight, Sparkles } from "lucide-react";

export function MorningCallback({ text, onOpen }: { text: string; onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      className="relative w-full overflow-hidden rounded-[26px] border border-resma-gold/40 bg-gradient-to-br from-amber-50 to-amber-100/40 p-4 text-left shadow-[0_12px_36px_-18px_rgba(250,203,96,0.7)] transition active:scale-[0.98]"
    >
      <div className="pointer-events-none absolute -right-8 -top-10 h-32 w-32 rounded-full bg-resma-gold/30 blur-2xl" />
      <div className="relative flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-resma-gold/30">
          <Sun size={18} className="text-amber-700" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-amber-700">
            Ayer querías mejorar <Sparkles size={10} />
          </p>
          <p className="mt-1 font-serifElegant text-[15px] italic leading-snug text-resma-navy">
            "{text}"
          </p>
          <p className="mt-1 text-[12px] font-medium text-resma-navy/70">
            Hoy lo vamos a encarar juntos →
          </p>
        </div>
        <ChevronRight size={18} className="mt-1 text-resma-navy/40" />
      </div>
    </button>
  );
}
