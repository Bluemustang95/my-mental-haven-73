import { ReactNode, useState } from "react";
import { Lock, Sparkles } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { PaywallModal } from "@/components/modals/PaywallModal";

interface PremiumLockProps {
  children: ReactNode;
  featureName?: string;
  /** Visual variant of the lock overlay */
  variant?: "card" | "section" | "inline";
  /** Force lock even for premium users (useful for previews). Default false. */
  forceLocked?: boolean;
  className?: string;
}

/**
 * Wraps content with a blurred, non-interactive overlay and a golden
 * "Unlock with Premium" CTA. Admins and premium users see the children unmodified.
 */
export function PremiumLock({
  children,
  featureName,
  variant = "card",
  forceLocked = false,
  className = "",
}: PremiumLockProps) {
  const { isPremium } = usePlan();
  const [open, setOpen] = useState(false);

  if (isPremium && !forceLocked) return <>{children}</>;

  const blurClass =
    variant === "inline" ? "blur-[4px]" : variant === "section" ? "blur-[6px]" : "blur-[5px]";

  return (
    <>
      <div className={`relative overflow-hidden rounded-[28px] ${className}`}>
        <div
          aria-hidden
          className={`pointer-events-none select-none ${blurClass} opacity-60 saturate-75`}
        >
          {children}
        </div>

        <button
          onClick={() => setOpen(true)}
          className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-gradient-to-b from-white/30 to-white/55 backdrop-blur-[2px] transition active:scale-[0.99]"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-300 to-amber-500 shadow-[0_8px_24px_-6px_rgba(232,163,101,0.55)] ring-1 ring-white/70">
            <Lock size={20} className="text-white" />
          </div>
          <p className="font-display text-sm font-bold text-slate-800">
            {featureName ?? "Contenido Premium"}
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-900/90 px-3 py-1.5 text-[11px] font-semibold text-white shadow-md">
            <Sparkles size={12} className="text-amber-300" />
            Desbloquear con Premium
          </span>
        </button>
      </div>

      <PaywallModal open={open} onClose={() => setOpen(false)} featureName={featureName} />
    </>
  );
}
