import { useEffect } from "react";
import { EMOTIONS, FICHA_8A } from "@/lib/dbt/data";

export function Ficha8AModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-[#101927]/40 backdrop-blur-sm">
      <div className="w-full max-w-md max-h-[85vh] bg-white rounded-t-[32px] sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col">
        <div className="px-5 py-4 border-b border-[#101927]/5 flex items-center justify-between">
          <div>
            <p className="font-display text-[10px] tracking-[0.12em] uppercase text-[#7cc2c8] font-bold">Ficha 8A · DBT</p>
            <p className="font-display text-base font-bold text-[#101927]">Emociones que se ajustan a los hechos</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-9 w-9 rounded-full bg-[#f2f2f2] flex items-center justify-center active:scale-95">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#101927" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {EMOTIONS.map((e) => (
            <div key={e} className="rounded-[24px] border border-[#7cc2c8]/20 bg-white p-4">
              <p className="font-display text-sm font-bold text-[#101927] mb-1">{e}</p>
              <p className="font-body text-[13px] leading-6 text-[#101927]/75">{FICHA_8A[e]}</p>
            </div>
          ))}
        </div>
        <div className="px-5 py-3 pb-[calc(env(safe-area-inset-bottom)+12px)] border-t border-[#101927]/5">
          <button onClick={onClose} className="w-full rounded-[24px] bg-[#101927] py-3 font-display text-sm font-semibold text-white active:scale-[0.97]">Entendido</button>
        </div>
      </div>
    </div>
  );
}
