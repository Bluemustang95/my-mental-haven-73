import { X, Moon, Wind, Target, Scale, Star, ChevronDown } from "lucide-react";
import { motion } from "framer-motion";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { BREATHING_PATTERNS } from "@/lib/breathingPatterns";
import { useMindfulnessFavorites } from "@/hooks/useMindfulnessFavorites";

export type IntentionId = "dormir" | "ansiedad" | "concentrarme" | "equilibrar";

interface Intention {
  id: IntentionId;
  title: string;
  short: string;
  patternId: string;
  Icon: typeof Moon;
  from: string;
  to: string;
}

export const INTENTIONS: Intention[] = [
  {
    id: "dormir",
    title: "Dormir mejor",
    short: "Exhalación larga para soltar el día.",
    patternId: "478",
    Icon: Moon,
    from: "#6366F1",
    to: "#A78BFA",
  },
  {
    id: "ansiedad",
    title: "Bajar ansiedad",
    short: "Suspiro fisiológico, rápido y eficaz.",
    patternId: "sigh",
    Icon: Wind,
    from: "#60A5FA",
    to: "#22D3EE",
  },
  {
    id: "concentrarme",
    title: "Concentrarme",
    short: "Cuatro tiempos iguales para enfocar.",
    patternId: "box",
    Icon: Target,
    from: "#FB923C",
    to: "#FCD34D",
  },
  {
    id: "equilibrar",
    title: "Equilibrar",
    short: "Coherencia cardíaca, el más validado.",
    patternId: "coherence",
    Icon: Scale,
    from: "#34D399",
    to: "#10B981",
  },
];

export function intentionToPattern(id: string): string {
  return INTENTIONS.find((i) => i.id === id)?.patternId ?? "box";
}

interface Props {
  visual: "orb" | "bodyscan";
  onVisualChange: (v: "orb" | "bodyscan") => void;
  onPickIntention: (intentionId: IntentionId, patternId: string) => void;
  onPickAdvanced: (patternId: string) => void;
  onClose: () => void;
  accent: string;
  defaultAdvanced?: boolean;
}

export function IntentionSetupScreen({
  visual,
  onVisualChange,
  onPickIntention,
  onPickAdvanced,
  onClose,
  accent,
  defaultAdvanced,
}: Props) {
  const [advanced, setAdvanced] = useState(!!defaultAdvanced);
  const { has, toggle } = useMindfulnessFavorites();

  return (
    <div className="fixed inset-0 z-[100] overflow-y-auto bg-[#0F172A] text-white">
      <div className="mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-stretch px-5 pt-12 pb-32">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10"
          >
            <X size={18} />
          </button>
          <div className="flex rounded-full bg-white/[0.06] p-1">
            {[
              { id: "orb", label: "Orbe" },
              { id: "bodyscan", label: "Body Scan" },
            ].map((t) => {
              const active = visual === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => onVisualChange(t.id as "orb" | "bodyscan")}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-xs font-semibold transition",
                    active ? "text-white" : "text-white/55"
                  )}
                  style={active ? { background: accent } : undefined}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
          <div className="h-10 w-10 shrink-0" />
        </div>

        <div className="mt-8 text-center">
          <h1 className="font-serif text-[28px] font-bold leading-tight">¿Qué necesitás ahora?</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[12px] leading-relaxed text-white/55">
            Elegí una intención y te sugerimos el patrón adecuado.
          </p>
        </div>

        {!advanced && (
          <div className="mt-7 grid grid-cols-2 gap-3">
            {INTENTIONS.map((it) => {
              const Icon = it.Icon;
              const favId = `breathing-intention:${it.id}`;
              const isFav = has(favId);
              return (
                <motion.button
                  key={it.id}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onPickIntention(it.id, it.patternId)}
                  className="relative aspect-square overflow-hidden rounded-3xl border border-white/10 bg-white/[0.04] p-4 text-left"
                >
                  <div
                    className="absolute -inset-6 rounded-full opacity-50 blur-3xl"
                    style={{ background: `linear-gradient(135deg, ${it.from}, ${it.to})` }}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggle({
                        id: favId,
                        kind: "breathing-intention",
                        label: it.title,
                        payload: { intentionId: it.id, patternId: it.patternId },
                      });
                    }}
                    aria-label={isFav ? "Quitar favorito" : "Marcar favorito"}
                    className="absolute right-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-white/10 backdrop-blur"
                  >
                    <Star
                      size={13}
                      className={isFav ? "fill-yellow-300 text-yellow-300" : "text-white/70"}
                    />
                  </button>
                  <div className="relative z-[1] flex h-full flex-col justify-between">
                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
                      <Icon size={16} />
                    </div>
                    <div>
                      <div className="font-display text-[15px] font-semibold leading-tight">
                        {it.title}
                      </div>
                      <div className="mt-1 text-[10px] text-white/70 line-clamp-2">{it.short}</div>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        {advanced && (
          <div className="mt-7 space-y-2">
            <p className="px-1 text-[10px] uppercase tracking-[0.18em] text-white/40">
              Patrones (modo avanzado)
            </p>
            {BREATHING_PATTERNS.map((p) => (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.98 }}
                onClick={() => onPickAdvanced(p.id)}
                className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-left"
              >
                <div>
                  <div className="font-display text-sm font-semibold">{p.name}</div>
                  <div className="text-[11px] text-white/55">{p.short}</div>
                </div>
                <div className="text-white/30">›</div>
              </motion.button>
            ))}
          </div>
        )}

        <button
          onClick={() => setAdvanced((a) => !a)}
          className="mt-6 flex items-center justify-center gap-1.5 text-[12px] text-white/55"
        >
          <ChevronDown
            size={14}
            className={cn("transition-transform", advanced && "rotate-180")}
          />
          {advanced ? "Volver a intenciones" : "Modo avanzado · ver patrones"}
        </button>
      </div>
    </div>
  );
}
