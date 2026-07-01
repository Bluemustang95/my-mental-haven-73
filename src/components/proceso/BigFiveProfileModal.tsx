import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHideBottomNav } from "@/hooks/useUiChrome";
import { TestRunner } from "@/components/tests/TestRunner";

type Trait = { key: string; label: string; short: string; color: string };

const TRAITS: Trait[] = [
  { key: "openness", label: "Apertura Mental", short: "Apertura", color: "#7c3aed" },
  { key: "conscientiousness", label: "Responsabilidad", short: "Responsab.", color: "#10b981" },
  { key: "extraversion", label: "Extraversión", short: "Extraversión", color: "#3b82f6" },
  { key: "agreeableness", label: "Amabilidad", short: "Amabilidad", color: "#f59e0b" },
  { key: "neuroticism", label: "Estabilidad Emocional", short: "Estabilidad", color: "#ef4444" },
];

const DEFAULTS: Record<string, number> = {
  openness: 75,
  conscientiousness: 85,
  extraversion: 45,
  agreeableness: 70,
  neuroticism: 45,
};

export function BigFiveProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { user } = useAuth();
  const [values, setValues] = useState<Record<string, number>>(DEFAULTS);
  const [running, setRunning] = useState(false);
  useHideBottomNav(open);

  // Map OCEAN letters (from test_results.answers.subscales) to trait keys
  const OCEAN_TO_KEY: Record<string, string> = {
    O: "openness",
    C: "conscientiousness",
    E: "extraversion",
    A: "agreeableness",
    N: "neuroticism",
  };

  const loadLatest = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("test_results")
      .select("answers, created_at")
      .eq("user_id", user.id)
      .eq("test_type", "BIGFIVE")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const subs = (data as any)?.answers?.subscales as Record<string, number> | undefined;
    if (!subs) return;
    const next: Record<string, number> = { ...DEFAULTS };
    Object.entries(subs).forEach(([k, v]) => {
      const key = OCEAN_TO_KEY[k];
      if (key) next[key] = Math.round((v as number) * 100);
    });
    setValues(next);
  };

  useEffect(() => {
    if (open) loadLatest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, user]);


  const points = useMemo(() => {
    const cx = 160, cy = 160, R = 110;
    return TRAITS.map((t, i) => {
      const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / TRAITS.length;
      const r = (values[t.key] / 100) * R;
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
            <div className="flex items-center justify-between">
              <button
                onClick={onClose}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                aria-label="Volver"
              >
                <ChevronLeft size={20} className="text-[#0f172a]" />
              </button>
              <p className="font-[Montserrat] text-[12px] font-semibold uppercase tracking-[0.2em] text-[#0f172a]">
                Tu perfil Big Five
              </p>
            </div>

            {/* Radar */}
            <div className="mt-6 rounded-[28px] bg-white p-5 shadow-sm">
              <svg viewBox="0 0 320 320" className="mx-auto block h-auto w-full max-w-[320px]">
                {/* concentric grid */}
                {[0.25, 0.5, 0.75, 1].map((scale, i) => {
                  const grid = TRAITS.map((_, j) => {
                    const angle = (-Math.PI / 2) + (j * 2 * Math.PI) / TRAITS.length;
                    return `${160 + 110 * scale * Math.cos(angle)},${160 + 110 * scale * Math.sin(angle)}`;
                  }).join(" ");
                  return <polygon key={i} points={grid} fill="none" stroke="#e2e8f0" strokeWidth={1} strokeDasharray="2 3" />;
                })}
                {/* axes */}
                {TRAITS.map((_, i) => {
                  const angle = (-Math.PI / 2) + (i * 2 * Math.PI) / TRAITS.length;
                  return (
                    <line
                      key={i}
                      x1={160}
                      y1={160}
                      x2={160 + 110 * Math.cos(angle)}
                      y2={160 + 110 * Math.sin(angle)}
                      stroke="#e2e8f0"
                      strokeWidth={1}
                    />
                  );
                })}
                {/* polygon */}
                <motion.polygon
                  points={polygon}
                  fill="rgba(124,194,200,0.35)"
                  stroke="#7cc2c8"
                  strokeWidth={2.5}
                  strokeLinejoin="round"
                  animate={{ points: polygon }}
                  transition={{ type: "spring", stiffness: 140, damping: 18 }}
                />
                {/* labels with anchor calculated by quadrant */}
                {points.map((p, i) => {
                  const cos = Math.cos(p.angle);
                  const anchor = cos > 0.2 ? "start" : cos < -0.2 ? "end" : "middle";
                  return (
                    <text
                      key={i}
                      x={p.lx}
                      y={p.ly}
                      textAnchor={anchor}
                      dominantBaseline="middle"
                      fontSize={11}
                      fontWeight={700}
                      fill="#0f172a"
                    >
                      {p.label}
                    </text>
                  );
                })}
              </svg>

              <div className="mt-3 flex flex-wrap justify-center gap-2">
                {TRAITS.map((t) => (
                  <span
                    key={t.key}
                    className="rounded-full px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: `${t.color}1a`, color: t.color }}
                  >
                    {t.short}
                  </span>
                ))}
              </div>
            </div>

            {/* Sliders */}
            <div className="mt-5 rounded-[28px] bg-white p-5 shadow-sm">
              <p className="font-[Montserrat] text-[11px] font-medium uppercase tracking-[0.18em] text-[#7cc2c8]">
                Ajusta tus rasgos para simular
              </p>
              <div className="mt-4 space-y-4">
                {TRAITS.map((t) => (
                  <div key={t.key}>
                    <div className="flex items-center justify-between text-[13px]">
                      <span className="text-[#0f172a]">{t.label}</span>
                      <span className="font-medium text-[#64748b]">{values[t.key]}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={values[t.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [t.key]: Number(e.target.value) }))}
                      className="mt-2 w-full accent-[#7cc2c8]"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md bg-gradient-to-t from-[#f9f9fb] to-transparent px-5 pb-6 pt-4">
            <button
              onClick={onClose}
              className="w-full rounded-full bg-[#101927] py-3.5 text-[14px] font-medium text-white shadow-lg"
            >
              Cerrar Perfil
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
