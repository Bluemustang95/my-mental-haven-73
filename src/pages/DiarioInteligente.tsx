import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Plus, Heart, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { WeekStrip } from "@/components/home/WeekStrip";
import { OpenSessionsList } from "@/components/dbt/OpenSessionsList";
import { BienestarProcessCard } from "@/components/bienestar/BienestarProcessCard";
import { readDraft as readBienestarDraft, todayStatus } from "@/components/bienestar/useBienestarDraft";

type Sub = {
  id: string;
  name: string;
  slug: string;
  resource_category_id: string | null;
  route: string | null;
};

const CATEGORY_LABELS: Record<string, { label: string; subtitle: string }> = {
  "regulacion-emocional": {
    label: "Regulación Emocional",
    subtitle: "Equilibrá tus emociones con DBT.",
  },
  "tolerancia-malestar": {
    label: "Tolerancia al Malestar",
    subtitle: "Atravesá los momentos difíciles.",
  },
  "efectividad-personal": {
    label: "Efectividad Personal",
    subtitle: "Mejorá tus vínculos y decisiones.",
  },
  "gestion-pensamientos": {
    label: "Gestión de Pensamientos",
    subtitle: "Trabajá con tus pensamientos.",
  },
  "pack-actividades": {
    label: "Pack de Actividades",
    subtitle: "Recuperá la motivación, día a día.",
  },
};

export default function DiarioInteligente() {
  const { slug = "" } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    if (slug === "mindfulness") navigate("/herramientas/mindfulness", { replace: true });
  }, [slug, navigate]);

  const { user } = useAuth();
  const [subs, setSubs] = useState<Sub[]>([]);
  const [hasAnySession, setHasAnySession] = useState(false);
  const [openSessionsTick, setOpenSessionsTick] = useState(0);
  

  // Soft FAB badge: pending today blocks after 20:00
  const [fabPending, setFabPending] = useState(0);
  useEffect(() => {
    const d = readBienestarDraft();
    const st = todayStatus(d);
    const hh = new Date().getHours();
    if (hh >= 20 && st.pending > 0) setFabPending(st.pending);
    else setFabPending(0);
  }, []);

  const meta = CATEGORY_LABELS[slug] ?? { label: slug, subtitle: "" };
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

  useEffect(() => {
    if (!user || !isRegulacion) return;
    (async () => {
      const { count } = await supabase
        .from("dbt_emotion_sessions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);
      if ((count ?? 0) > 0) setHasAnySession(true);
    })();
  }, [user, isRegulacion, openSessionsTick]);

  const modules = useMemo(
    () =>
      isRegulacion
        ? [
            {
              to: "/herramientas/cambiar-respuestas",
              icon: Heart,
              title: "Cambiar respuestas emocionales",
              desc: "IA guiada · Verificá los hechos, decidí y actuá.",
              from: "#7cc2c8",
              to2: "#facb60",
            },
            {
              to: "/herramientas/construir-bienestar",
              icon: Sparkles,
              title: "Construir Bienestar",
              desc: "Valores → metas → actividades en tu semana.",
              from: "#7cc2c8",
              to2: "#34D399",
            },
          ]
        : subs.map((s, i) => ({
            to: s.route || `/diario-inteligente/${slug}/${s.slug}`,
            icon: Heart,
            title: s.name,
            desc: "Ejercicio guiado.",
            from: ["#FB923C", "#60A5FA", "#A78BFA", "#34D399", "#F472B6"][i % 5],
            to2: ["#FCD34D", "#A78BFA", "#F472B6", "#7cc2c8", "#facb60"][i % 5],
          })),
    [isRegulacion, subs, slug]
  );

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="px-5 pt-12">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-serif text-3xl font-bold text-[#101927]">{meta.label}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{meta.subtitle}</p>

        <div className="mt-4">
          <WeekStrip />
        </div>
      </div>

      <div className="mt-5 space-y-2 px-5">
        {modules.map((m) => (
          <motion.button
            key={m.to + m.title}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(m.to)}
            className="w-full rounded-2xl bg-white p-3 text-left shadow-sm flex items-center gap-3"
          >
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to2})` }}
            >
              <m.icon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base font-semibold text-[#101927]">
                {m.title}
              </div>
              <div className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                {m.desc}
              </div>
            </div>
          </motion.button>
        ))}
      </div>

      {isRegulacion && (
        <div className="mt-5 px-5">
          <OpenSessionsList
            key={openSessionsTick}
            onChanged={() => setOpenSessionsTick((t) => t + 1)}
          />
        </div>
      )}

      {isRegulacion && (
        <div className="mt-5 px-5">
          <div className="mb-2 flex items-center gap-2">
            <Sparkles size={14} className="text-[#facb60]" />
            <span className="text-[11px] font-semibold uppercase tracking-widest text-[#101927]/55">
              Mis procesos
            </span>
          </div>
          <BienestarProcessCard />
        </div>
      )}

      {isRegulacion && hasAnySession && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() =>
            fabPending > 0
              ? navigate("/herramientas/construir-bienestar?tab=seguimiento&day=hoy")
              : navigate("/herramientas/cambiar-respuestas")
          }
          aria-label="Sumar otra sesión"
          className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full bg-[#101927] text-white shadow-lg flex items-center justify-center"
        >
          <Plus size={24} />
          {fabPending > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-[#facb60] px-1 text-[10px] font-bold text-[#101927] ring-2 ring-[#FDFCFB]">
              {fabPending}
            </span>
          )}
        </motion.button>
      )}
    </div>
  );
}
