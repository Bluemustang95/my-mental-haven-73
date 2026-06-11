import { X, Square, Moon, Heart, Wind } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { BREATHING_PATTERNS } from "@/lib/breathingPatterns";

interface Props {
  visual: "orb" | "bodyscan";
  onVisualChange: (v: "orb" | "bodyscan") => void;
  onPick: (patternId: string) => void;
  onClose: () => void;
  accent: string;
}

const STYLES: Record<string, { anim: string; bg: string; Icon: typeof Square }> = {
  box: { anim: "animate-[spin_8s_linear_infinite]", bg: "bg-indigo-500/30", Icon: Square },
  "478": { anim: "animate-ping", bg: "bg-blue-500/20", Icon: Moon },
  coherence: { anim: "animate-pulse", bg: "bg-teal-400/30", Icon: Heart },
  sigh: { anim: "animate-bounce", bg: "bg-rose-500/30", Icon: Wind },
};

export function PatternSetupScreen({ visual, onVisualChange, onPick, onClose, accent }: Props) {
  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A] text-white overflow-y-auto">
      <div className="min-h-full flex flex-col px-5 pt-12 pb-10">
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
          <h1 className="font-serif text-[30px] leading-tight font-bold">Elegí tu ritmo</h1>
          <p className="mx-auto mt-2 max-w-[280px] text-[12px] leading-relaxed text-white/55">
            Cada patrón regula tu sistema nervioso de una forma distinta.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-3">
          {BREATHING_PATTERNS.map((p) => {
            const s = STYLES[p.id];
            const Icon = s?.Icon ?? Square;
            return (
              <motion.button
                key={p.id}
                whileTap={{ scale: 0.96 }}
                onClick={() => onPick(p.id)}
                className="relative aspect-square overflow-hidden rounded-3xl border border-white/[0.06] bg-white/[0.04] p-4 text-left"
              >
                <div
                  className={cn(
                    "absolute -inset-6 rounded-full blur-2xl opacity-70",
                    s?.anim,
                    s?.bg
                  )}
                />
                <div className="relative z-10 flex h-full flex-col justify-between">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 backdrop-blur">
                    <Icon size={16} />
                  </div>
                  <div>
                    <div className="font-display text-[15px] font-semibold leading-tight">
                      {p.name}
                    </div>
                    <div className="mt-1 text-[10px] text-white/65 line-clamp-2">{p.short}</div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
