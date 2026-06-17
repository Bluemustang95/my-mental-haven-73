import { useEffect } from "react";

interface Props {
  open: boolean;
  title: string;
  loading?: boolean;
  content?: string;
  error?: string;
  onClose: () => void;
  onApply?: (text: string) => void;
  applyLabel?: string;
}

export function AiResponseModal({ open, title, loading, content, error, onClose, onApply, applyLabel = "Aplicar al campo" }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-[#101927]/40 backdrop-blur-sm sm:items-center">
      <div className="relative w-full max-w-md max-h-[85vh] overflow-hidden rounded-t-[32px] sm:rounded-[32px] bg-white shadow-2xl border border-[#7cc2c8]/20 flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#101927]/5">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#facb60]/20">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#101927" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>
            </span>
            <p className="font-display text-sm font-bold text-[#101927]">{title}</p>
          </div>
          <button onClick={onClose} aria-label="Cerrar" className="h-8 w-8 rounded-full bg-[#f2f2f2] flex items-center justify-center active:scale-95">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#101927" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading && (
            <div className="flex flex-col items-center gap-3 py-10">
              <span className="h-8 w-8 rounded-full border-2 border-[#7cc2c8] border-t-transparent animate-spin" />
              <p className="text-xs text-[#101927]/60 font-display">Pensando con IA clínica…</p>
            </div>
          )}
          {error && !loading && (
            <div className="rounded-[20px] bg-red-50 border border-red-200 p-4 text-sm text-red-800">{error}</div>
          )}
          {!loading && !error && content && (
            <article className="whitespace-pre-wrap font-body text-[15px] leading-7 text-[#101927]">{content}</article>
          )}
        </div>
        {!loading && !error && content && (
          <div className="px-5 py-4 border-t border-[#101927]/5 flex gap-2">
            {onApply && (
              <button onClick={() => { onApply(content); onClose(); }} className="flex-1 rounded-[24px] bg-[#101927] py-3 font-display text-sm font-semibold text-white active:scale-[0.98]">
                {applyLabel}
              </button>
            )}
            <button onClick={onClose} className="flex-1 rounded-[24px] bg-[#f2f2f2] py-3 font-display text-sm font-semibold text-[#101927] active:scale-[0.98]">
              Cerrar
            </button>
          </div>
        )}
        <div className="pb-[env(safe-area-inset-bottom)]" />
      </div>
    </div>
  );
}
