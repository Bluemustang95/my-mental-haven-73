import { HTMLAttributes, ReactNode } from "react";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/** Vidrio denso congelado de la estética Deep Night Obsidian. */
export const OBSIDIAN_GLASS =
  "rounded-[26px] border border-white/[0.12] bg-slate-950/65 backdrop-blur-[30px] shadow-[0_18px_50px_-30px_rgba(0,0,0,0.9)]";

export function GlassPanel({ className, children, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={cn(OBSIDIAN_GLASS, className)} {...rest}>
      {children}
    </div>
  );
}

/** Auras de neón desenfocadas (azul abisal, índigo, amatista). */
export function NightAuras() {
  return (
    <>
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.28),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute right-[-20%] top-1/3 h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(147,51,234,0.22),transparent_70%)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-[-15%] left-1/4 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(30,64,175,0.25),transparent_70%)] blur-3xl" />
    </>
  );
}

export function BackHeader({
  title,
  onBack,
  right,
}: {
  title?: string;
  onBack: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="mb-6 flex items-center gap-3">
      <motion.button
        whileTap={{ scale: 0.92 }}
        onClick={onBack}
        aria-label="Volver"
        className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[0.06] text-slate-200"
      >
        <ArrowLeft size={18} />
      </motion.button>
      {title && <h1 className="font-mindful text-2xl tracking-tight text-slate-50">{title}</h1>}
      {right && <div className="ml-auto">{right}</div>}
    </div>
  );
}

/** Medidor circular SVG animado (0-100%). */
export function ProgressRing({
  value,
  size = 96,
  stroke = 8,
  color = "#7cc2c8",
  label,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          initial={false}
          animate={{ strokeDashoffset: c - (c * pct) / 100 }}
          transition={{ type: "spring", stiffness: 90, damping: 18 }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="text-center leading-none">
        <span className="font-display text-lg font-bold text-slate-50 tabular-nums">{Math.round(pct)}%</span>
        {label && <p className="mt-1 text-[9px] uppercase tracking-[0.18em] text-slate-500">{label}</p>}
      </div>
    </div>
  );
}
