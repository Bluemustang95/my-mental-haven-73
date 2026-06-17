import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WeekStrip } from "@/components/home/WeekStrip";
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
  const [hasAnySession, setHasAnySession] = useState(false);
  const cardsRef = useRef<HTMLDivElement>(null);

  const meta = CATEGORY_LABELS[slug] ?? { label: slug, emoji: "✨", bg: "from-white/10 to-white/5" };
  const isRegulacion = slug === "regulacion-emocional";

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

  // Detect if the user has ever completed at least one session here.
  useEffect(() => {
    if (!user || !isRegulacion) return;
    (async () => {
      const { count } = await supabase
        .from("dbt_emotion_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) > 0) setHasAnySession(true);
    })();
  }, [user, isRegulacion]);

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

  const scrollToCards = () => {
    cardsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="min-h-screen bg-resource-mindfulness-bg text-foreground">
      <div className="relative mx-auto max-w-md px-5 pt-12 pb-32">
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-resource-mindfulness-accent/15 bg-card/75 text-resource-mindfulness-accent shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-resource-mindfulness-accent/55">
              Diario Inteligente
            </p>
            <h1 className="font-display text-xl font-bold text-resource-mindfulness-accent">{meta.label}</h1>
          </div>
        </div>

        <div className="mb-8 rounded-3xl border border-resource-mindfulness-accent/15 bg-card/80 p-3 shadow-sm">
          <WeekStrip />
        </div>

        <AnimatePresence mode="wait">
          {!saved ? (
            <motion.div
              key="grid"
              ref={cardsRef}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="space-y-5"
            >
              {isRegulacion ? (
                <div className="space-y-3">
                  <PatternInsights />

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/herramientas/cambiar-respuestas")}
                    className="relative w-full overflow-hidden rounded-3xl border border-[#7cc2c8]/40 bg-gradient-to-br from-[#7cc2c8]/20 via-[#7cc2c8]/8 to-[#facb60]/15 p-5 text-left shadow-sm"
                  >
                    <span className="absolute right-3 top-3 rounded-full bg-[#facb60]/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#a07a1a]">
                      Premium
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#7cc2c8]">
                      Workspace clínico DBT
                    </span>
                    <p className="mt-2 font-display text-lg font-bold leading-tight text-foreground">
                      Cambiar respuestas emocionales
                    </p>
                    <p className="mt-1 text-xs leading-5 text-foreground/65">
                      IA guiada · Verificá los hechos, decidí y actuá
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#7cc2c8]">
                      Empezar sesión →
                    </span>
                  </motion.button>

                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => navigate("/herramientas/regulacion-emocional")}
                    className="relative w-full overflow-hidden rounded-3xl border border-resource-mindfulness-accent/15 bg-card/80 p-4 text-left shadow-sm"
                  >
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-resource-mindfulness-accent/55">
                      Habilidades rápidas
                    </span>
                    <p className="mt-1 font-display text-base font-bold leading-tight text-foreground">
                      STOP & TIPP
                    </p>
                    <p className="mt-1 text-xs text-foreground/60">
                      Frená el impulso · Cambio químico en minutos
                    </p>
                  </motion.button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {items.map((s, i) => (
                    <motion.button
                      key={s.id}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => pick(s)}
                      className={`relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br ${SUB_COLORS[i % SUB_COLORS.length]} p-4 text-left`}
                    >
                      <span className="absolute -bottom-4 -right-4 select-none text-[7rem] opacity-15">
                        {meta.emoji}
                      </span>
                      <span className="text-xs font-semibold uppercase tracking-widest text-foreground/60">
                        Ejercicio
                      </span>
                      <p className="relative font-display text-base font-bold leading-tight text-foreground">
                        {s.name}
                      </p>
                    </motion.button>
                  ))}
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="saved"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-emerald-400/30 bg-gradient-to-br from-emerald-500/15 to-emerald-600/5 p-6"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500 text-white">
                  <Check size={22} />
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
                    Registro guardado
                  </p>
                  <p className="mt-1 font-display text-lg font-bold text-foreground">Completaste: {saved.name}</p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* FAB "+" : visible cuando ya hay al menos una sesión (igual que mindfulness) */}
        {(saved || (isRegulacion && hasAnySession)) && (
          <button
            onClick={() => { setSaved(null); scrollToCards(); }}
            className="fixed bottom-28 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-resource-mindfulness-accent text-primary-foreground shadow-[0_15px_40px_-10px_hsl(var(--resource-mindfulness-accent)/0.7)] transition active:scale-95"
            aria-label="Sumar otra actividad"
          >
            <Plus size={24} />
          </button>
        )}
      </div>
    </div>
  );
}
