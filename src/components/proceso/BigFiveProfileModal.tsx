import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHideBottomNav } from "@/hooks/useUiChrome";
import { TestRunner } from "@/components/tests/TestRunner";

type Trait = { key: string; oceanCode: string; label: string; short: string; color: string };

const TRAITS: Trait[] = [
  { key: "openness",          oceanCode: "O", label: "Apertura Mental",     short: "Apertura",     color: "#7c3aed" },
  { key: "conscientiousness", oceanCode: "C", label: "Responsabilidad",     short: "Responsab.",   color: "#10b981" },
  { key: "extraversion",      oceanCode: "E", label: "Extraversión",        short: "Extraversión", color: "#3b82f6" },
  { key: "agreeableness",     oceanCode: "A", label: "Amabilidad",          short: "Amabilidad",   color: "#f59e0b" },
  { key: "neuroticism",       oceanCode: "N", label: "Estabilidad Emocional", short: "Estabilidad", color: "#ef4444" },
];


type TraitDesc = { label?: string; short?: string; color?: string; description?: string; low?: string; high?: string };

export function BigFiveProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, number> | null>(null); // null = never taken
  const [traitDescriptions, setTraitDescriptions] = useState<Record<string, TraitDesc>>({});
  const [lastDate, setLastDate] = useState<string | null>(null);
  const [running, setRunning] = useState(false);
  const [loading, setLoading] = useState(true);
  useHideBottomNav(open);

  const OCEAN_TO_KEY: Record<string, string> = { O: "openness", C: "conscientiousness", E: "extraversion", A: "agreeableness", N: "neuroticism" };

  const loadLatest = async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      const { data: def } = await supabase
        .from("test_definitions" as any)
        .select("trait_descriptions")
        .eq("code", "BIGFIVE")
        .maybeSingle();
      const td = ((def as any)?.trait_descriptions ?? {}) as Record<string, TraitDesc>;
      setTraitDescriptions(td);

      const { data } = await supabase
        .from("test_results")
        .select("answers, created_at")
        .eq("user_id", user.id)
        .eq("test_type", "BIGFIVE")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const subs = (data as any)?.answers?.subscales as Record<string, number> | undefined;
      if (!subs) { setValues(null); setLastDate(null); return; }
      const next: Record<string, number> = {};
      TRAITS.forEach((t) => { next[t.key] = 0; });
      Object.entries(subs).forEach(([k, v]) => {
        const key = OCEAN_TO_KEY[k];
        if (key) next[key] = Math.round((v as number) * 100);
      });
      setValues(next);
      setLastDate((data as any)?.created_at ?? null);
    } catch (e) {
      console.error("[BigFive] load failed", e);
      setValues(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return;
    if (user) loadLatest();
    else setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);

  const hasResult = values !== null;

  const points = useMemo(() => {
    const cx = 160, cy = 160, R = 110;
    return TRAITS.map((t, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / TRAITS.length;
      const r = ((values?.[t.key] ?? 0) / 100) * R;
      return {
        x: cx + r * Math.cos(angle),
        y: cy + r * Math.sin(angle),
        lx: cx + (R + 26) * Math.cos(angle),
        ly: cy + (R + 26) * Math.sin(angle),
        angle,
        label: t.short,
      };
    });
  }, [values]);

  const polygon = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-[#f9f9fb]"
        >
          <div className="mx-auto max-w-md px-5 pt-10 pb-32">
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                aria-label="Volver"
              >
                <ChevronLeft size={20} className="text-[#0f172a]" />
              </button>
              <p className="flex-1 truncate text-center font-[Montserrat] text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0f172a]">
                Tu perfil Big Five
              </p>
              {hasResult ? (
                <button
                  onClick={() => setRunning(true)}
                  className="flex h-10 items-center gap-1.5 rounded-full bg-[#7c3aed] px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white shadow-sm active:scale-95"
                >
                  <RefreshCw size={13} />
                  <span>Repetir</span>
                </button>
              ) : <div className="h-10 w-10" />}
            </div>

            {loading ? (
              <div className="mt-16 text-center text-sm text-[#94a3b8]">Cargando…</div>
            ) : !hasResult ? (
              // Empty state: gate result until first completion
              <div className="mt-10 rounded-[28px] bg-white p-8 text-center shadow-sm">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#7c3aed]/10">
                  <Sparkles size={28} className="text-[#7c3aed]" />
                </div>
                <h2 className="mt-5 font-serif text-xl font-semibold text-[#0f172a]">
                  Descubrí tu perfil de personalidad
                </h2>
                <p className="mt-2 text-[13px] leading-relaxed text-[#64748b]">
                  El inventario BFI-20 evalúa cinco rasgos estables de tu personalidad.
                  Toma unos 3 minutos. Al finalizar vas a ver tu hexágono y una explicación
                  de cada dimensión.
                </p>
                <button
                  onClick={() => setRunning(true)}
                  className="mt-6 w-full rounded-2xl bg-[#7c3aed] py-3.5 font-semibold text-white shadow-[0_10px_30px_-10px_rgba(124,58,237,0.6)] active:scale-[0.99]"
                >
                  Hacer el test por primera vez
                </button>
              </div>
            ) : (
              <>
                {/* Radar result */}
                <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
                  {lastDate && (
                    <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-widest text-[#94a3b8]">
                      Resultado del {new Date(lastDate).toLocaleDateString("es-AR", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  )}
                  <svg viewBox="0 0 320 320" className="mx-auto block h-auto w-full max-w-[320px]">
                    {[0.25, 0.5, 0.75, 1].map((scale, i) => {
                      const grid = TRAITS.map((_, j) => {
                        const angle = (-Math.PI / 2) + (j * 2 * Math.PI) / TRAITS.length;
                        return `${160 + 110 * scale * Math.cos(angle)},${160 + 110 * scale * Math.sin(angle)}`;
                      }).join(" ");
                      return <polygon key={i} points={grid} fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2 3" />;
                    })}
                    {TRAITS.map((_, i) => {
                      const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / TRAITS.length;
                      return (
                        <line key={i} x1={160} y1={160}
                          x2={160 + 110 * Math.cos(angle)} y2={160 + 110 * Math.sin(angle)}
                          stroke="#e2e8f0" strokeWidth={1} />
                      );
                    })}
                    <motion.polygon
                      points={polygon}
                      fill="rgba(124,194,200,0.35)"
                      stroke="#7cc2c8"
                      strokeWidth={2.5}
                      strokeLinejoin="round"
                      animate={{ points: polygon }}
                      transition={{ type: "spring", stiffness: 140, damping: 18 }}
                    />
                    {points.map((p, i) => {
                      const cos = Math.cos(p.angle);
                      const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
                      return (
                        <text key={i} x={p.lx} y={p.ly} textAnchor={anchor} dominantBaseline="middle"
                          fontSize={11} fontWeight={700} fill="#0f172a">
                          {p.label}
                        </text>
                      );
                    })}
                  </svg>

                  <div className="mt-3 flex flex-wrap justify-center gap-2">
                    {TRAITS.map((t) => (
                      <span key={t.key} className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                        style={{ background: `${t.color}1a`, color: t.color }}>
                        {t.short} {values?.[t.key] ?? 0}%
                      </span>
                    ))}
                  </div>
                </div>

                {/* Trait explanations — only admin-provided content */}
                {(() => {
                  const cardsData = TRAITS
                    .map((t) => ({ t, custom: traitDescriptions[t.oceanCode] }))
                    .filter(({ custom }) => !!custom?.description);

                  if (cardsData.length === 0) {
                    return (
                      <div className="mt-6 rounded-2xl border border-dashed border-[#e2e8f0] bg-white p-4 text-center">
                        <p className="text-[12px] leading-relaxed text-[#94a3b8]">
                          Las explicaciones de cada rasgo aún no fueron cargadas por el equipo.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="mt-6 space-y-3">
                      <p className="px-1 font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.16em] text-[#94a3b8]">
                        Qué significa cada rasgo
                      </p>
                      {cardsData.map(({ t, custom }) => {
                        const color = custom!.color || t.color;
                        const label = custom!.label || t.label;
                        const pct = values?.[t.key] ?? 0;
                        const isHigh = pct >= 50;
                        const sideText = isHigh ? custom!.high : custom!.low;
                        return (
                          <div key={t.key} className="rounded-2xl border border-[#e2e8f0] bg-white p-4 shadow-sm">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                                <p className="font-serif text-[15px] font-semibold text-[#0f172a]">{label}</p>
                              </div>
                              <span className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
                                style={{ background: `${color}1a`, color }}>
                                {pct}%
                              </span>
                            </div>
                            <p className="mt-2 text-[12.5px] leading-relaxed text-[#475569]">{custom!.description}</p>
                            {sideText && (
                              <div className="mt-3 rounded-xl bg-[#f8fafc] p-3">
                                <p className="text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
                                  {isHigh ? "Tu puntaje es alto" : "Tu puntaje es bajo/medio"}
                                </p>
                                <p className="mt-1 text-[12px] leading-relaxed text-[#0f172a]">
                                  {sideText}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
              </>
            )}
          </div>

          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md bg-gradient-to-t from-[#f9f9fb] to-transparent px-5 pb-6 pt-4">
            <button
              onClick={onClose}
              className="w-full rounded-full bg-[#101927] py-3.5 text-[14px] font-medium text-white shadow-lg"
            >
              Cerrar Perfil
            </button>
          </div>

          {running && (
            <TestRunner
              testCode="BIGFIVE"
              onClose={() => {
                setRunning(false);
                loadLatest();
              }}
            />
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
