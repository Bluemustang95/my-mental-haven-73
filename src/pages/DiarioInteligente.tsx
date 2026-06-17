import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WeekStrip } from "@/components/home/WeekStrip";
import { toast } from "sonner";
import { PatternInsights } from "@/components/dbt/PatternInsights";

type Sub = {
  id: string;
  name: string;
  slug: string;
  resource_category_id: string | null;
  route: string | null;
};

const CATEGORY_LABELS: Record<string, { label: string; emoji: string; bg: string }> = {
  mindfulness: { label: "Mindfulness", emoji: "🧘", bg: "from-rose-400/30 to-rose-500/10" },
  "regulacion-emocional": { label: "Regulación Emocional", emoji: "❤️", bg: "from-orange-400/30 to-orange-500/10" },
  "tolerancia-malestar": { label: "Tolerancia al Malestar", emoji: "🌊", bg: "from-violet-400/30 to-violet-500/10" },
  "efectividad-personal": { label: "Efectividad Personal", emoji: "🛡️", bg: "from-emerald-400/30 to-emerald-500/10" },
  "gestion-pensamientos": { label: "Gestión de Pensamientos", emoji: "🧠", bg: "from-sky-400/30 to-sky-500/10" },
  "pack-actividades": { label: "Pack de Actividades", emoji: "⚡", bg: "from-amber-400/30 to-amber-500/10" },
};

const SUB_COLORS = [
  "from-violet-600/30 to-violet-700/10",
  "from-rose-500/30 to-rose-600/10",
  "from-emerald-500/30 to-emerald-600/10",
  "from-amber-500/30 to-amber-600/10",
  "from-sky-500/30 to-sky-600/10",
  "from-fuchsia-500/30 to-fuchsia-600/10",
];

export default function DiarioInteligente() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug === "mindfulness") navigate("/herramientas/mindfulness", { replace: true });
  }, [slug, navigate]);
  const { user } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [saved, setSaved] = useState<{ name: string } | null>(null);

  const meta = CATEGORY_LABELS[slug] ?? { label: slug, emoji: "✨", bg: "from-white/10 to-white/5" };

  useEffect(() => {
    (async () => {
      const { data: cat } = await supabase
        .from("resource_categories")
        .select("id")
        .eq("slug", slug)
        .maybeSingle();
      let q = supabase
        .from("algo_sub_resources")
        .select("id, name, slug, resource_category_id, route")
        .eq("active", true)
        .order("sort");
      if (cat?.id) q = q.eq("resource_category_id", cat.id);
      const { data } = await q;
      setSubs((data ?? []) as Sub[]);
    })();
  }, [slug]);

  const fallback = useMemo<Sub[]>(
    () => [
      { id: "f1", name: "Respiración consciente", slug: "respiracion", resource_category_id: null, route: null },
      { id: "f2", name: "Mira el presente", slug: "observar", resource_category_id: null, route: null },
      { id: "f3", name: "Ver los hechos", slug: "definir", resource_category_id: null, route: null },
    ],
    []
  );

  const items = subs.length ? subs : fallback;

  const pick = async (s: Sub) => {
    if (!user) return;
    await supabase.from("exercise_sessions").insert({
      user_id: user.id,
      exercise_type: slug,
      exercise_name: s.name,
    });
    setSaved({ name: s.name });
  };

  return (
    <div className="min-h-screen bg-[#0F0F12] text-white">
      <div className="pointer-events-none absolute -top-32 -left-24 h-72 w-72 rounded-full bg-violet-500/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-72 w-72 rounded-full bg-fuchsia-500/15 blur-3xl" />

      <div className="relative mx-auto max-w-md px-5 pt-12 pb-28">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
              Diario Inteligente
            </p>
            <h1 className="font-display text-xl font-bold">{meta.label}</h1>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-3 backdrop-blur-md">
          <WeekStrip />
        </div>

        <AnimatePresence mode="wait">
          {!saved ? (
            <motion.div
              key="grid"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {slug === "regulacion-emocional" && (
                <div className="space-y-3">
                  <PatternInsights />

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/herramientas/cambiar-respuestas")}
                    className="relative w-full overflow-hidden rounded-3xl border border-[#7cc2c8]/40 bg-gradient-to-br from-[#7cc2c8]/25 via-[#7cc2c8]/10 to-[#facb60]/15 p-5 text-left backdrop-blur-md"
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-[#facb60]/25 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#facb60]">
                      Premium
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7cc2c8]">
                      Workspace clínico DBT
                    </span>
                    <p className="mt-2 font-display text-lg font-bold leading-tight">
                      Cambiar respuestas emocionales
                    </p>
                    <p className="mt-1 text-xs leading-5 text-white/65">
                      Fichas 8 a 13 · IA guiada · Verificá los hechos, decidí y actuá
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#7cc2c8]">
                      Empezar sesión →
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/herramientas/regulacion-emocional")}
                    className="relative w-full overflow-hidden rounded-3xl border border-white/15 bg-white/5 p-4 text-left backdrop-blur-md"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-white/55">
                      Habilidades rápidas
                    </span>
                    <p className="mt-1 font-display text-base font-bold leading-tight">
                      STOP & TIPP
                    </p>
                    <p className="mt-1 text-xs text-white/60">
                      Frená el impulso · Cambio químico en minutos
                    </p>
                  </motion.button>

                  <p className="pt-2 text-[11px] font-semibold uppercase tracking-widest text-white/40">
                    Otros ejercicios
                  </p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                {items.map((s, i) => (
                  <motion.button
                    key={s.id}
                    whileTap={{ scale: 0.96 }}
                    onClick={() => pick(s)}
                    className={`relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${SUB_COLORS[i % SUB_COLORS.length]} p-4 text-left backdrop-blur-md`}
                  >
                    <span className="absolute -bottom-4 -right-4 select-none text-[7rem] opacity-15">
                      {meta.emoji}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-widest text-white/60">
                      Ejercicio
                    </span>
                    <p className="relative font-display text-base font-bold leading-tight">
                      {s.name}
                    </p>
                  </motion.button>
                ))}
              </div>
            </motion.div>

          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-6 backdrop-blur-md"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500">
                  <Check size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-300">
                    Registro guardado
                  </p>
                  <p className="mt-1 font-display text-lg font-bold">Completaste: {saved.name}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {saved && (
          <button
            onClick={() => setSaved(null)}
            className="fixed bottom-28 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-violet-500 text-white shadow-[0_15px_40px_-10px_rgba(139,92,246,0.7)] transition active:scale-95"
            aria-label="Sumar otra actividad"
          >
            <Plus size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
