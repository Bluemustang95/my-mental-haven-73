import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

export type PriorityCard = {
  id: string;
  chip: string;
  chipTone: "gold" | "teal" | "navy";
  title: string;
  description?: string;
  actionLabel: string;
  actionTone: "gold" | "teal" | "navy";
  onAction: () => void;
  done?: boolean;
  doneSummary?: string;
};

type PhaseKey = "morning" | "midday" | "night";

const PHASES: Record<
  PhaseKey,
  {
    tag: string;
    chipClass: string;
    dotColor: string;
    auraA: string;
    auraB: string;
    innerTint: string;
    ink: string;
  }
> = {
  morning: {
    tag: "Prioridad Mañana",
    chipClass: "bg-amber-100/80 text-amber-800 border border-amber-200/60",
    dotColor: "#f59e0b",
    auraA: "#facb60",
    auraB: "#fbbf24",
    innerTint:
      "linear-gradient(160deg, rgba(250,203,96,0.22) 0%, rgba(255,255,255,0) 60%)",
    ink: "#78350f",
  },
  midday: {
    tag: "Práctica Recomendada",
    chipClass: "bg-teal-100/80 text-teal-800 border border-teal-200/60",
    dotColor: "#14b8a6",
    auraA: "#7cc2c8",
    auraB: "#a7f3d0",
    innerTint:
      "linear-gradient(160deg, rgba(124,194,200,0.22) 0%, rgba(255,255,255,0) 60%)",
    ink: "#134e4a",
  },
  night: {
    tag: "Prioridad Noche",
    chipClass: "bg-indigo-100/80 text-indigo-900 border border-indigo-200/60",
    dotColor: "#6366f1",
    auraA: "#818cf8",
    auraB: "#4c1d95",
    innerTint:
      "linear-gradient(160deg, rgba(129,140,248,0.22) 0%, rgba(255,255,255,0) 60%)",
    ink: "#1e1b4b",
  },
};

const PHASE_ORDER: PhaseKey[] = ["morning", "midday", "night"];

function SunSvg() {
  return (
    <svg
      viewBox="0 0 120 120"
      className="h-full w-full motion-safe:animate-[spin_25s_linear_infinite]"
      fill="none"
      stroke="#d97706"
      strokeWidth="1.5"
      strokeLinecap="round"
    >
      <circle cx="60" cy="60" r="20" />
      {Array.from({ length: 12 }).map((_, i) => {
        const a = (i * Math.PI * 2) / 12;
        const x1 = 60 + Math.cos(a) * 30;
        const y1 = 60 + Math.sin(a) * 30;
        const x2 = 60 + Math.cos(a) * 44;
        const y2 = 60 + Math.sin(a) * 44;
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
      })}
    </svg>
  );
}

function SpiralSvg() {
  return (
    <div className="h-full w-full motion-safe:animate-float-slow">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full"
        fill="none"
        stroke="#0d9488"
        strokeWidth="1.6"
      >
        {[8, 16, 24, 32, 40].map((r) => (
          <circle key={r} cx="60" cy="60" r={r} opacity={0.65} />
        ))}
      </svg>
    </div>
  );
}

function MoonSvg() {
  const stars = [
    { x: 20, y: 22, r: 1.4, d: 0 },
    { x: 96, y: 30, r: 1, d: 0.4 },
    { x: 30, y: 90, r: 1.2, d: 0.9 },
    { x: 100, y: 96, r: 1.6, d: 1.3 },
    { x: 70, y: 18, r: 0.9, d: 1.7 },
  ];
  return (
    <div className="relative h-full w-full">
      <svg
        viewBox="0 0 120 120"
        className="h-full w-full motion-safe:animate-float-slow"
        fill="none"
        stroke="#4338ca"
        strokeWidth="1.6"
      >
        <path
          d="M78 32a30 30 0 1 0 10 46 24 24 0 0 1-10-46z"
          fill="rgba(129,140,248,0.15)"
        />
      </svg>
      <svg
        viewBox="0 0 120 120"
        className="pointer-events-none absolute inset-0 h-full w-full"
      >
        {stars.map((s, i) => (
          <circle
            key={i}
            cx={s.x}
            cy={s.y}
            r={s.r}
            fill="#4338ca"
            className="motion-safe:animate-twinkle"
            style={{ animationDelay: `${s.d}s` }}
          />
        ))}
      </svg>
    </div>
  );
}

const GRAPHIC: Record<PhaseKey, () => JSX.Element> = {
  morning: SunSvg,
  midday: SpiralSvg,
  night: MoonSvg,
};

export function PriorityStack({ cards }: { cards: PriorityCard[] }) {
  const [phaseIdx, setPhaseIdx] = useState(0);

  const trio = useMemo(() => cards.slice(0, 3), [cards]);
  if (trio.length === 0) return null;

  const idx = phaseIdx % Math.max(trio.length, 1);
  const card = trio[idx];
  const phaseKey = PHASE_ORDER[idx] ?? "morning";
  const phase = PHASES[phaseKey];
  const Graphic = GRAPHIC[phaseKey];

  const advance = () => setPhaseIdx((i) => (i + 1) % trio.length);

  const handleTap = () => {
    if (card.done) {
      advance();
    } else {
      card.onAction();
    }
  };

  return (
    <section className="relative mt-4">
      {/* Dynamic aura bleeding */}
      <div className="pointer-events-none absolute inset-0 -z-10 overflow-visible">
        <motion.div
          key={`auraA-${phaseKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.35 }}
          transition={{ duration: 0.7 }}
          className="absolute -left-16 -top-10 h-72 w-72 rounded-full"
          style={{ background: phase.auraA, filter: "blur(70px)" }}
        />
        <motion.div
          key={`auraB-${phaseKey}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.28 }}
          transition={{ duration: 0.7 }}
          className="absolute -right-16 -bottom-10 h-80 w-80 rounded-full"
          style={{ background: phase.auraB, filter: "blur(80px)" }}
        />
      </div>

      <button
        onClick={handleTap}
        aria-label={`${phase.tag}: ${card.title}. Tocá para ${card.done ? "cambiar de fase" : "abrir"}`}
        className="group relative block aspect-square w-full overflow-hidden rounded-[32px] text-left"
        style={{
          background: "rgba(255,255,255,0.45)",
          backdropFilter: "blur(25px)",
          WebkitBackdropFilter: "blur(25px)",
          border: "1px solid rgba(255,255,255,0.6)",
          boxShadow: "0 20px 60px -24px rgba(16,25,39,0.25)",
          transition:
            "transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), box-shadow 0.4s ease",
        }}
        onMouseDown={(e) =>
          (e.currentTarget.style.transform = "scale(0.96)")
        }
        onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
        onTouchStart={(e) =>
          (e.currentTarget.style.transform = "scale(0.96)")
        }
        onTouchEnd={(e) => (e.currentTarget.style.transform = "scale(1)")}
      >
        {/* Inner tinted overlay per phase */}
        <AnimatePresence mode="wait">
          <motion.div
            key={`tint-${phaseKey}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="pointer-events-none absolute inset-0"
            style={{ background: phase.innerTint }}
          />
        </AnimatePresence>

        {/* Floating graphic */}
        <div className="pointer-events-none absolute right-4 top-4 h-40 w-40 opacity-90 sm:h-44 sm:w-44">
          <AnimatePresence mode="wait">
            <motion.div
              key={`gfx-${phaseKey}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.5 }}
              className="h-full w-full"
            >
              <Graphic />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Content */}
        <div className="relative flex h-full flex-col justify-between p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={`chip-${phaseKey}`}
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <span
                className={`inline-flex items-center rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.14em] ${phase.chipClass}`}
              >
                {phase.tag}
              </span>
            </motion.div>
          </AnimatePresence>

          <AnimatePresence mode="wait">
            <motion.div
              key={`title-${phaseKey}-${card.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.5 }}
              className="pr-2"
            >
              <h3
                className="font-serifElegant text-[26px] font-medium leading-[1.1]"
                style={{ color: phase.ink }}
              >
                {card.title}
                {card.done && (
                  <Check
                    size={18}
                    strokeWidth={3}
                    className="ml-2 inline-block align-middle"
                    style={{ color: phase.dotColor }}
                  />
                )}
              </h3>
              {card.done && card.doneSummary && (
                <p
                  className="mt-1.5 text-[12px] font-medium opacity-70"
                  style={{ color: phase.ink }}
                >
                  {card.doneSummary}
                </p>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Pagination dots */}
          <div className="flex items-center gap-1.5">
            {trio.map((_, i) => {
              const active = i === idx;
              const pk = PHASE_ORDER[i] ?? "morning";
              return (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setPhaseIdx(i);
                  }}
                  aria-label={`Ir a fase ${i + 1}`}
                  className="h-1.5 rounded-full transition-all duration-500"
                  style={{
                    width: active ? 24 : 6,
                    background: active
                      ? PHASES[pk].dotColor
                      : "rgba(16,25,39,0.15)",
                    boxShadow: active
                      ? `0 0 12px ${PHASES[pk].dotColor}80`
                      : "none",
                  }}
                />
              );
            })}
          </div>
        </div>
      </button>
    </section>
  );
}
