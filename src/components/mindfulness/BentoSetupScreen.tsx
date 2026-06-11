import { X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BentoOption {
  id: string;
  title: string;
  short: string;
  Icon: React.ComponentType<{ size?: number; className?: string }>;
  anim: string; // tailwind animate-* class
  bg: string;   // tailwind bg-color/opacity class
}

interface Props {
  title: string;
  subtitle?: string;
  options: BentoOption[];
  onPick: (id: string) => void;
  onClose: () => void;
  onBack?: () => void;
  accent: string;
  /** "2x2" for 4 items, "3" for 3 stacked, defaults to grid-cols-2 */
  layout?: "grid2" | "stack";
}

export function BentoSetupScreen({
  title,
  subtitle,
  options,
  onPick,
  onClose,
  onBack,
  layout = "grid2",
}: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A] text-white overflow-y-auto">
      <div className="min-h-full flex flex-col px-5 pt-12 pb-10">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onBack ?? onClose}
            aria-label={onBack ? "Volver" : "Cerrar"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
          >
            {onBack ? <ArrowLeft size={18} /> : <X size={18} />}
          </button>
          {onBack && (
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
            >
              <X size={18} />
            </button>
          )}
          {!onBack && <div className="h-10 w-10" />}
        </div>

        <div className="mt-8 text-center">
          <h1 className="font-serif text-[30px] leading-tight font-bold">{title}</h1>
          {subtitle && (
            <p className="mx-auto mt-2 max-w-[280px] text-[12px] leading-relaxed text-white/55">
              {subtitle}
            </p>
          )}
        </div>

        <div
          className={cn(
            "mt-8 gap-3",
            layout === "grid2" ? "grid grid-cols-2" : "flex flex-col"
          )}
        >
          {options.map((o) => (
            <motion.button
              key={o.id}
              whileTap={{ scale: 0.96 }}
              onClick={() => onPick(o.id)}
              className={cn(
                "relative overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.04] p-4 text-left",
                layout === "grid2" ? "aspect-square" : "h-[120px]"
              )}
            >
              <div
                className={cn(
                  "absolute -inset-6 rounded-full blur-2xl opacity-70",
                  o.anim,
                  o.bg
                )}
              />
              <div className="relative z-10 flex h-full flex-col justify-between">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                  <o.Icon size={16} />
                </div>
                <div>
                  <div className="font-display text-[15px] font-semibold leading-tight">
                    {o.title}
                  </div>
                  <div className="mt-1 text-[10px] text-white/65 line-clamp-2">{o.short}</div>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
