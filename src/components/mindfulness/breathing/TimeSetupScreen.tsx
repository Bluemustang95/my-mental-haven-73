import { X, ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Props {
  subtitle?: string;
  minutes: number;
  onMinutesChange: (m: number) => void;
  onStart: () => void;
  onClose: () => void;
  onBack?: () => void;
  accent: string;
}

const OPTIONS = [1, 5, 10, 15, 20];

export function TimeSetupScreen({
  subtitle,
  minutes,
  onMinutesChange,
  onStart,
  onClose,
  onBack,
  accent,
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

        <div className="mt-12 text-center">
          <h1 className="font-serif text-[32px] leading-tight font-bold">¿Cuánto tiempo tenés?</h1>
          {subtitle && (
            <p className="mx-auto mt-3 max-w-[280px] text-[12px] text-white/55">{subtitle}</p>
          )}
        </div>

        <div className="mt-12 grid grid-cols-3 gap-3">
          {OPTIONS.map((m) => {
            const active = minutes === m;
            return (
              <motion.button
                key={m}
                whileTap={{ scale: 0.96 }}
                onClick={() => onMinutesChange(m)}
                className={cn(
                  "h-[110px] rounded-3xl font-display font-bold transition flex flex-col items-center justify-center gap-1",
                  active ? "text-white" : "bg-white/[0.06] text-white/55"
                )}
                style={
                  active
                    ? { background: accent, boxShadow: `0 14px 36px ${accent}55` }
                    : undefined
                }
              >
                <span className="text-3xl tabular-nums">{m}</span>
                <span className="text-[11px] uppercase tracking-[0.2em] opacity-75">min</span>
              </motion.button>
            );
          })}
        </div>

        <div className="mt-auto pt-10">
          <motion.button
            whileTap={{ scale: 0.97 }}
            onClick={onStart}
            className="w-full rounded-2xl py-[18px] font-display text-base font-bold text-white"
            style={{ background: accent, boxShadow: `0 14px 36px ${accent}55` }}
          >
            Comenzar
          </motion.button>
        </div>
      </div>
    </div>
  );
}
