import { ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

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
      className="relative min-h-screen w-full overflow-hidden"
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

      <div className="relative mx-auto flex min-h-screen max-w-md flex-col px-6 pt-10 pb-8 safe-area-top">
        {(totalSteps > 0 || onBack) && (
          <div className="mb-8 flex items-center gap-3">
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
                    className="h-[3px] flex-1 max-w-[40px] rounded-full transition-colors"
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
    <label
      className="block rounded-[24px] border border-[#101927]/5 bg-white/80 px-5 py-4 shadow-glass backdrop-blur-xl transition focus-within:border-[#7cc2c8]/60"
    >
      <span
        className="block text-[10px] font-bold uppercase tracking-[0.18em]"
        style={{ color: TEAL }}
      >
        {label}
      </span>
      <input
        {...rest}
        className={`mt-1 w-full bg-transparent text-[15px] font-medium text-[#101927] placeholder:font-light placeholder:text-[#101927]/35 focus:outline-none ${className ?? ""}`}
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
      className="flex w-full items-center justify-between rounded-full border bg-white/80 px-5 py-3.5 text-left text-[14px] font-medium shadow-glass backdrop-blur-xl transition active:scale-[0.99]"
      style={
        selected
          ? { borderColor: TEAL, color: INK }
          : { borderColor: "rgba(16,25,39,0.06)", color: INK }
      }
    >
      <span className="pr-3">{label}</span>
      <span
        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-[1.5px]"
        style={
          selected
            ? { borderColor: TEAL, background: TEAL }
            : { borderColor: "rgba(16,25,39,0.18)", background: "#fff" }
        }
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
      className="flex w-full items-center justify-center gap-2 rounded-full py-4 font-display text-[15px] font-bold transition hover:brightness-[1.03] active:scale-[0.98]"
    >
      {children}
    </button>
  );
}
