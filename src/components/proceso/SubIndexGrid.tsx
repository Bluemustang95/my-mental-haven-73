import type { WellbeingSnapshot } from "@/lib/wellbeingScore";
import { WEIGHTS } from "@/lib/wellbeingScore";
import { Smile, Moon, Scale, Sunrise } from "lucide-react";

const META = {
  mood:    { label: "Ánimo",   color: "#7cc2c8", Icon: Smile,   source: "Sintonía de la mañana" },
  sleep:   { label: "Sueño",   color: "#6366f1", Icon: Moon,    source: "Balance nocturno" },
  balance: { label: "Balance", color: "#f0928a", Icon: Scale,   source: "Emociones de la noche" },
  dawn:    { label: "Despertar", color: "#facb60", Icon: Sunrise, source: "Cómo amaneciste" },
} as const;

type Key = keyof typeof META;
const ORDER: Key[] = ["mood", "sleep", "balance", "dawn"];

function MiniRing({ value, color }: { value: number; color: string }) {
  const R = 17;
  const C = 2 * Math.PI * R;
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 44 44" className="h-full w-full -rotate-90">
        <circle cx="22" cy="22" r={R} fill="none" stroke="rgba(15,23,42,0.08)" strokeWidth="4" />
        <circle
          cx="22" cy="22" r={R} fill="none" stroke={color} strokeWidth="4" strokeLinecap="round"
          strokeDasharray={C}
          strokeDashoffset={C - (Math.max(0, Math.min(100, value)) / 100) * C}
          style={{ transition: "stroke-dashoffset 700ms cubic-bezier(0.32,1,0.28,1)" }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-[13px] font-bold tabular-nums text-[#0f172a]">{value}</span>
      </div>
    </div>
  );
}

export function SubIndexGrid({ snapshot }: { snapshot: WellbeingSnapshot | null }) {
  if (!snapshot || !snapshot.hasEnoughData) return null;

  return (
    <div className="mt-3">
      <p className="mb-2 font-[Montserrat] text-[10px] font-semibold uppercase tracking-[0.16em] text-[#0f172a]/55">
        De dónde sale tu número
      </p>
      <div className="grid grid-cols-2 gap-2.5">
        {ORDER.map((k) => {
          const m = META[k];
          const value = snapshot.components[k];
          const applied = snapshot.appliedWeights[k];
          const missing = value === null;

          return (
            <div
              key={k}
              className="rounded-[18px] border border-black/[0.05] bg-white/85 p-3 shadow-[0_10px_24px_-20px_rgba(16,25,39,0.5)] backdrop-blur"
            >
              <div className="flex items-center gap-1.5">
                <m.Icon size={13} strokeWidth={1.8} style={{ color: m.color }} />
                <span className="font-display text-[11.5px] font-semibold text-[#0f172a]">{m.label}</span>
              </div>

              {missing ? (
                <>
                  <p className="mt-2 font-display text-[12px] font-medium text-[#0f172a]/40">Sin datos</p>
                  <p className="mt-0.5 text-[9.5px] leading-snug text-[#0f172a]/40">
                    Su {WEIGHTS[k]}% se repartió entre los demás
                  </p>
                </>
              ) : (
                <>
                  <div className="mt-2 flex items-center gap-2.5">
                    <MiniRing value={value} color={m.color} />
                    <div className="min-w-0">
                      <p className="font-display text-[10px] font-semibold" style={{ color: m.color }}>
                        pesa {applied}%
                      </p>
                      <p className="mt-0.5 text-[9px] leading-snug text-[#0f172a]/45">{m.source}</p>
                    </div>
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-2 text-[9.5px] leading-snug text-[#0f172a]/40">
        Los pesos base son Ánimo {WEIGHTS.mood}% · Sueño {WEIGHTS.sleep}% · Balance {WEIGHTS.balance}% ·
        Despertar {WEIGHTS.dawn}%. Si falta un dato, su peso se reparte entre los presentes.
      </p>
    </div>
  );
}
