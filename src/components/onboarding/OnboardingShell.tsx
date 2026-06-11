import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

export function OnboardingShell({
  step,
  totalSteps,
  onBack,
  children,
}: {
  step: number;
  totalSteps: number;
  onBack?: () => void;
  children: ReactNode;
}) {
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(120% 80% at 20% 0%, #1e1b4b 0%, #0f172a 55%, #020617 100%)",
      }}
    >
      {/* Glass orbs */}
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-indigo-500/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-violet-500/20 blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pt-12 pb-8 safe-area-top">
        {/* Header */}
        <div className="mb-10 flex items-center gap-4">
          {onBack ? (
            <button
              onClick={onBack}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md transition active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <div className="h-9 w-9" />
          )}
          <div className="flex flex-1 justify-center gap-2">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-10 rounded-full transition-colors ${
                  i < step ? "bg-indigo-400" : "bg-white/15"
                }`}
              />
            ))}
          </div>
          <div className="h-9 w-9" />
        </div>

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-1 flex-col"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export function GlassInput(props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  const { label, className, ...rest } = props;
  return (
    <label className="block rounded-2xl border border-white/15 bg-white/5 px-5 py-4 backdrop-blur-md focus-within:border-indigo-400/60 focus-within:bg-white/10 transition">
      <span className="block text-[10px] font-semibold uppercase tracking-widest text-indigo-300">
        {label}
      </span>
      <input
        {...rest}
        className={`mt-1 w-full bg-transparent text-base font-medium text-white placeholder:text-white/35 focus:outline-none ${className ?? ""}`}
      />
    </label>
  );
}

export function GlassChoice({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left text-sm font-medium backdrop-blur-md transition active:scale-[0.99] ${
        selected
          ? "border-indigo-400/70 bg-indigo-500/15 text-white"
          : "border-white/10 bg-white/5 text-white/85 hover:border-white/25"
      }`}
    >
      <span>{label}</span>
      <span
        className={`flex h-5 w-5 items-center justify-center rounded-full border ${
          selected ? "border-indigo-300 bg-indigo-400/40" : "border-white/30"
        }`}
      >
        {selected && <span className="h-2 w-2 rounded-full bg-white" />}
      </span>
    </button>
  );
}

export function GlassPrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-500 py-4 text-sm font-semibold text-white shadow-[0_15px_40px_-15px_rgba(99,102,241,0.8)] transition active:scale-[0.98] disabled:bg-white/10 disabled:text-white/40 disabled:shadow-none"
    >
      {children}
    </button>
  );
}
