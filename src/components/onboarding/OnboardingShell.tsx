import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, ChevronDown } from "lucide-react";

const TEAL = "#7cc2c8";
const GOLD = "#facb60";
const INK = "#101927";

/**
 * Light Glassmorphism Onboarding Shell.
 * White background with ambient teal + gold glows. Dark ink typography.
 * Pass totalSteps=0 to hide the progress indicator (for splash / value-slides).
 */
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
      className="relative min-h-[100dvh] w-full overflow-hidden"
      style={{ background: "#FFFFFF", color: INK }}
    >
      {/* Ambient glows */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full"
        style={{ background: TEAL, opacity: 0.12, filter: "blur(120px)" }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 -bottom-48 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full"
        style={{ background: GOLD, opacity: 0.14, filter: "blur(140px)" }}
      />

      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pt-6 pb-4 safe-area-top">
        {(totalSteps > 0 || onBack) && (
          <div className="mb-4 flex items-center gap-3">
            {onBack ? (
              <button
                onClick={onBack}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-[#101927]/8 bg-white/80 shadow-glass backdrop-blur-xl transition active:scale-95"
              >
                <ArrowLeft className="h-4 w-4" style={{ color: INK }} />
              </button>
            ) : (
              <div className="h-9 w-9" />
            )}
            {totalSteps > 0 && (
              <div className="flex flex-1 items-center justify-center gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[3px] flex-1 max-w-[36px] rounded-full transition-colors"
                    style={{ background: i < step ? TEAL : "rgba(16,25,39,0.08)" }}
                  />
                ))}
              </div>
            )}
            <div className="h-9 w-9" />
          </div>
        )}

        <motion.div
          key={step}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
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
    <label className="block rounded-[22px] border border-[#101927]/5 bg-white/75 px-4 py-3 shadow-glass backdrop-blur-xl transition focus-within:border-[#7cc2c8]/60">
      <span
        className="block text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: TEAL }}
      >
        {label}
      </span>
      <input
        {...rest}
        className={`mt-1 w-full bg-transparent text-[14px] font-medium text-[#101927] placeholder:font-light placeholder:text-[#101927]/35 focus:outline-none ${className ?? ""}`}
      />
    </label>
  );
}

export function GlassSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  return (
    <label className="block rounded-[22px] border border-[#101927]/5 bg-white/75 px-4 py-3 shadow-glass backdrop-blur-xl transition focus-within:border-[#7cc2c8]/60">
      <span
        className="block text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: TEAL }}
      >
        {label}
      </span>
      <div className="relative mt-1">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full appearance-none bg-transparent pr-7 text-[14px] font-medium text-[#101927] focus:outline-none"
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-0 top-1/2 h-4 w-4 -translate-y-1/2 text-[#101927]/40" />
      </div>
    </label>
  );
}

export function GlassChoice({
  label,
  selected,
  onClick,
  compact = false,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex w-full items-center justify-between rounded-full border bg-white/75 px-4 ${
        compact ? "py-2.5 text-[13px]" : "py-3 text-[13.5px]"
      } text-left font-medium shadow-glass backdrop-blur-xl transition active:scale-[0.99]`}
      style={
        selected
          ? { borderColor: TEAL, color: INK, boxShadow: "0 8px 22px -10px rgba(124,194,200,0.5)" }
          : { borderColor: "rgba(16,25,39,0.06)", color: INK }
      }
    >
      <span className="pr-3">{label}</span>
      <span
        className="flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px]"
        style={
          selected
            ? { borderColor: TEAL, background: TEAL, width: 18, height: 18 }
            : { borderColor: "rgba(16,25,39,0.2)", background: "#fff", width: 18, height: 18 }
        }
      >
        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
      </span>
    </button>
  );
}

export function GlassPrimaryButton({
  children,
  disabled,
  onClick,
  type = "button",
  variant = "teal",
}: {
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
  variant?: "teal" | "white";
}) {
  const isWhite = variant === "white";
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      style={{
        background: disabled
          ? "rgba(16,25,39,0.05)"
          : isWhite
            ? "#FFFFFF"
            : TEAL,
        color: disabled ? "rgba(16,25,39,0.3)" : INK,
        boxShadow: disabled
          ? "none"
          : isWhite
            ? "0 8px 32px rgba(16,25,39,0.06)"
            : "0 14px 30px -12px rgba(124,194,200,0.55)",
        border: isWhite ? "1px solid rgba(16,25,39,0.06)" : "none",
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-display text-[14.5px] font-bold transition hover:brightness-[1.03] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}

/**
 * Sticky bottom container for primary CTAs so users never need to scroll
 * to reach the "Next" button.
 */
export function StickyFooter({ children }: { children: ReactNode }) {
  return (
    <div className="sticky bottom-0 left-0 right-0 mt-4 -mx-5 px-5 pt-3 pb-2 bg-gradient-to-t from-white via-white/95 to-white/0">
      {children}
    </div>
  );
}
