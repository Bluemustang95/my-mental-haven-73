import { ReactNode } from "react";

/* ---------- Iconos SVG nativos ---------- */
export const Ic = {
  Sparkle: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 16} height={p.size ?? 16} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "#101927"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3l2 6 6 2-6 2-2 6-2-6-6-2 6-2z"/></svg>
  ),
  Rotate: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="#101927" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
  ),
  Check: (p: { color?: string; size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "#16a34a"} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
  ),
  X: (p: { color?: string; size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "#dc2626"} strokeWidth="2.5" strokeLinecap="round"><path d="M6 6l12 12M18 6l-12 12"/></svg>
  ),
  Bulb: (p: { size?: number; color?: string }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke={p.color ?? "#facb60"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.8.7 1.3 1.6 1.5 2.6h5c.2-1 .7-1.9 1.5-2.6A7 7 0 0 0 12 2z"/></svg>
  ),
  Heart: (p: { size?: number }) => (
    <svg width={p.size ?? 18} height={p.size ?? 18} viewBox="0 0 24 24" fill="none" stroke="#7cc2c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#7cc2c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
  ),
  Chevron: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
  ),
};

/* ---------- Header sticky ---------- */
export function WorkspaceHeader({ subtitle, onReset, onBack }: { subtitle: string; onReset: () => void; onBack: () => void }) {
  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-[24px] border-b border-[#101927]/5">
      <div className="mx-auto max-w-md px-4 py-3 flex items-center gap-3 safe-area-top">
        <button onClick={onBack} aria-label="Volver" className="h-10 w-10 rounded-full bg-[#f2f2f2] flex items-center justify-center active:scale-95">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#101927" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"/></svg>
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <Ic.Heart size={14} />
            <p className="font-display text-[15px] font-bold text-[#101927] truncate">Cambiar respuestas emocionales</p>
          </div>
          <p className="text-[11px] font-display tracking-wide uppercase text-[#7cc2c8] mt-0.5 truncate">{subtitle}</p>
        </div>
        <button onClick={onReset} aria-label="Reiniciar" className="h-10 w-10 rounded-full bg-[#f2f2f2] flex items-center justify-center active:scale-95">
          <Ic.Rotate size={16} />
        </button>
      </div>
    </header>
  );
}

/* ---------- FichaCallout ---------- */
export function FichaCallout({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="rounded-[24px] bg-[#7cc2c8]/5 border-l-[3px] border-[#7cc2c8] px-5 py-4">
      <p className="font-display text-[10px] font-bold tracking-[0.12em] uppercase text-[#7cc2c8] mb-1.5">{label}</p>
      <div className="font-body text-[15px] leading-[1.7] text-[#101927]/80">{children}</div>
    </div>
  );
}

/* ---------- Wizard Footer ---------- */
export function WizardFooter({ onPrev, onNext, nextLabel = "Siguiente", canPrev = true, canNext = true }: { onPrev?: () => void; onNext: () => void; nextLabel?: string; canPrev?: boolean; canNext?: boolean }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-4 pb-[calc(env(safe-area-inset-bottom)+12px)]">
      <div className="mx-auto max-w-md px-4 flex gap-2">
        {onPrev && (
          <button onClick={onPrev} disabled={!canPrev} className="flex-1 rounded-[24px] bg-[#f2f2f2] py-3.5 font-display text-sm font-semibold text-[#101927] active:scale-[0.97] disabled:opacity-40">
            Atrás
          </button>
        )}
        <button onClick={onNext} disabled={!canNext} className="flex-[2] rounded-[24px] bg-[#101927] py-3.5 font-display text-sm font-semibold text-white active:scale-[0.97] disabled:opacity-40">
          {nextLabel}
        </button>
      </div>
    </div>
  );
}

/* ---------- Progress pill ---------- */
export function ProgressIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex justify-center">
      <span className="inline-block rounded-full bg-[#7cc2c8]/10 px-3 py-1 font-display text-[11px] font-semibold tracking-wide text-[#7cc2c8]">
        Paso {step} de {total}
      </span>
    </div>
  );
}

/* ---------- AI Button ---------- */
export function AiAssistButton({ label, onClick, loading }: { label: string; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="w-full mt-2 rounded-[24px] bg-[#facb60]/10 border border-[#facb60]/30 px-4 py-3 flex items-center justify-center gap-2 font-display text-[13px] font-semibold text-[#101927] active:scale-[0.98] disabled:opacity-60">
      {loading ? (
        <span className="h-4 w-4 rounded-full border-2 border-[#101927] border-t-transparent animate-spin" />
      ) : (
        <Ic.Sparkle size={14} color="#101927" />
      )}
      <span>{label}</span>
    </button>
  );
}

/* ---------- Wise Mind Card ---------- */
export function WiseMindCard({ title, children, tone = "gold" }: { title: string; children: ReactNode; tone?: "gold" | "teal" }) {
  const ring = tone === "gold" ? "border-[#facb60]/40 bg-[#facb60]/5" : "border-[#7cc2c8]/40 bg-[#7cc2c8]/5";
  return (
    <div className={`rounded-[24px] border ${ring} p-5`}>
      <div className="flex items-center gap-2 mb-2">
        {tone === "gold" ? <Ic.Bulb size={18} /> : <Ic.Heart size={18} />}
        <p className="font-display text-sm font-bold text-[#101927]">{title}</p>
      </div>
      <div className="font-body text-[14px] leading-[1.7] text-[#101927]/80">{children}</div>
    </div>
  );
}

/* ---------- DBT Textarea ---------- */
export function DbtTextarea({ value, onChange, placeholder, minHeight = 140 }: { value: string; onChange: (v: string) => void; placeholder?: string; minHeight?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      style={{ minHeight }}
      className="w-full rounded-[24px] border border-[#d8d9db] bg-white px-5 py-4 font-body text-[15px] leading-[1.7] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:border-[#7cc2c8] focus:ring-4 focus:ring-[#7cc2c8]/15 transition resize-none"
    />
  );
}

/* ---------- Confirm modal ---------- */
export function ConfirmModal({ open, title, message, onConfirm, onCancel, confirmLabel = "Confirmar" }: { open: boolean; title: string; message: string; onConfirm: () => void; onCancel: () => void; confirmLabel?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-[#101927]/40 backdrop-blur-sm px-4">
      <div className="w-full max-w-sm rounded-[32px] bg-white shadow-2xl p-6">
        <p className="font-display text-base font-bold text-[#101927] mb-2">{title}</p>
        <p className="font-body text-sm leading-6 text-[#101927]/70 mb-5">{message}</p>
        <div className="flex gap-2">
          <button onClick={onCancel} className="flex-1 rounded-[24px] bg-[#f2f2f2] py-3 font-display text-sm font-semibold text-[#101927] active:scale-[0.97]">Cancelar</button>
          <button onClick={onConfirm} className="flex-1 rounded-[24px] bg-[#101927] py-3 font-display text-sm font-semibold text-white active:scale-[0.97]">{confirmLabel}</button>
        </div>
      </div>
    </div>
  );
}
