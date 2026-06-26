import { ReactNode, ButtonHTMLAttributes, useEffect } from "react";
import { X } from "lucide-react";

export function AdminCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-slate-200 bg-white shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export function AdminLabel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`font-admin-label text-[10px] text-slate-500 ${className}`}>{children}</span>
  );
}

type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "purple";
};
export function AdminButton({ variant = "primary", className = "", children, ...rest }: BtnProps) {
  const base = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";
  const variants: Record<string, string> = {
    primary: "bg-resma-navy text-white hover:bg-resma-navy/90",
    secondary: "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50",
    ghost: "text-slate-600 hover:bg-slate-100",
    danger: "bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100",
    purple: "bg-resma-purple text-white hover:bg-resma-purple/90",
  };
  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

export function AdminToggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      aria-pressed={value}
      aria-label={label}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${value ? "bg-resma-teal" : "bg-slate-200"}`}
    >
      <span
        className="absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all"
        style={{ left: value ? "22px" : "2px" }}
      />
    </button>
  );
}

export function AdminModal({ open, onClose, title, subtitle, children, maxWidth = "max-w-2xl" }: {
  open: boolean; onClose: () => void; title: string; subtitle?: string; children: ReactNode; maxWidth?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-resma-navy/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()}
           className={`admin-zoom-in w-full ${maxWidth} max-h-[90vh] overflow-hidden rounded-2xl bg-white shadow-2xl border border-slate-200 flex flex-col`}>
        <div className="flex items-start justify-between gap-4 border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-resma-navy">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
          </div>
          <button onClick={onClose} aria-label="Cerrar"
                  className="h-8 w-8 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition">
            <X size={16} className="mx-auto" />
          </button>
        </div>
        <div className="admin-scroll overflow-y-auto px-6 py-5">{children}</div>
      </div>
    </div>
  );
}

export function AdminTabs<T extends string>({ tabs, value, onChange }: {
  tabs: { id: T; label: string; icon?: ReactNode }[];
  value: T;
  onChange: (id: T) => void;
}) {
  return (
    <div className="flex items-end gap-1 border-b border-slate-200 overflow-x-auto admin-scroll">
      {tabs.map((t) => {
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`relative px-5 py-3 text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-2 ${
              active ? "text-resma-navy" : "text-slate-500 hover:text-resma-navy"
            }`}
          >
            {t.icon}
            {t.label}
            {active && (
              <span className="absolute bottom-0 left-2 right-2 h-[2px] rounded-t bg-resma-teal" />
            )}
          </button>
        );
      })}
    </div>
  );
}

export function AdminPageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-8 py-6 bg-white border-b border-slate-200">
      <div>
        <h1 className="text-xl font-semibold text-resma-navy">{title}</h1>
        {subtitle && <p className="text-xs text-slate-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

export function StatCard({ label, value, hint, accent = "teal" }: {
  label: string; value: string | number; hint?: string; accent?: "teal" | "gold" | "purple" | "navy";
}) {
  const accents: Record<string, string> = {
    teal: "bg-resma-teal/10 text-resma-teal",
    gold: "bg-resma-gold/15 text-amber-700",
    purple: "bg-resma-purple/10 text-resma-purple",
    navy: "bg-resma-navy/5 text-resma-navy",
  };
  return (
    <AdminCard className="p-5">
      <div className="flex items-center justify-between">
        <span className="font-admin-label text-[10px] text-slate-500">{label}</span>
        <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold ${accents[accent]}`}>LIVE</span>
      </div>
      <div className="mt-3 text-3xl font-bold text-resma-navy tracking-tight">{value}</div>
      {hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}
    </AdminCard>
  );
}

export function ProgressBar({ value, max = 100, color = "#7cc2c8", label }: { value: number; max?: number; color?: string; label?: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div>
      {label && (
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="text-slate-600 font-medium">{label}</span>
          <span className="text-slate-400 tabular-nums">{pct}%</span>
        </div>
      )}
      <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}
