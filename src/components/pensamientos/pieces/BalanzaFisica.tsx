type Props = { favor: number; contra: number };

export default function BalanzaFisica({ favor, contra }: Props) {
  const diff = contra - favor;
  const angle = Math.max(-22, Math.min(22, diff * 6));

  return (
    <div className="relative w-full h-[200px] flex items-end justify-center pb-4">
      {/* Soporte */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center">
        <div className="w-1.5 h-[120px] bg-gradient-to-b from-[#101927]/30 to-[#101927]/15 rounded-full" />
        <div className="w-20 h-2 bg-[#101927]/20 rounded-full" />
      </div>

      {/* Viga con platillos */}
      <div
        className="absolute top-4 left-1/2 -translate-x-1/2 w-[280px] h-1.5 bg-[#101927]/40 rounded-full transition-transform duration-700"
        style={{
          transform: `translateX(-50%) rotate(${angle}deg)`,
          transformOrigin: "center",
        }}
      >
        {/* Platillo izquierdo - A favor (rojo) */}
        <div className="absolute left-0 -top-7 -translate-x-1/2 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#FCA5A5]/40 border-2 border-[#FCA5A5]/60 flex flex-col items-center justify-center shadow-[0_6px_16px_-8px_rgba(252,165,165,0.6)]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#9b1c1c]">A Favor</p>
            <p className="font-display text-lg font-bold text-[#9b1c1c] leading-none">{favor}</p>
          </div>
        </div>

        {/* Platillo derecho - En contra (verde) */}
        <div className="absolute right-0 -top-7 translate-x-1/2 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#A7F3D0]/40 border-2 border-[#A7F3D0]/60 flex flex-col items-center justify-center shadow-[0_6px_16px_-8px_rgba(167,243,208,0.6)]">
            <p className="text-[9px] font-bold uppercase tracking-wider text-[#065f46]">En Contra</p>
            <p className="font-display text-lg font-bold text-[#065f46] leading-none">{contra}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
