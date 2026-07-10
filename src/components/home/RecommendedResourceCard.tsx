import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, BookOpen, Wind, Sparkles, ChevronRight, Compass } from "lucide-react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { TOOL_META, type ToolModule } from "@/lib/onboardingAlgorithm";

type Resource = {
  tag: string;
  duration: string;
  title: string;
  subtitle: string;
  icon: typeof BookOpen;
  route: string;
  iconBg: string;
  iconColor: string;
};

const FALLBACK_POOL: Resource[] = [
  {
    tag: "LECTURA · TCC", duration: "5 min",
    title: "Manejo de Distorsiones Cognitivas",
    subtitle: "Identificá pensamientos automáticos y reformulalos paso a paso.",
    icon: BookOpen, route: "/diario-inteligente/gestion-pensamientos/pensamientos-automaticos",
    iconBg: "bg-sky-100", iconColor: "text-sky-700",
  },
  {
    tag: "PODCAST · DBT", duration: "7 min",
    title: "Desarmando la Rumiación Nocturna",
    subtitle: "Pautas de Linehan para evitar la rumiación de pensamientos.",
    icon: Headphones, route: "/herramientas/sueno",
    iconBg: "bg-violet-100", iconColor: "text-violet-700",
  },
  {
    tag: "PRÁCTICA · DBT", duration: "3 min",
    title: "Práctica del Botón de Pánico",
    subtitle: "Activá la respuesta de calma con la habilidad TIP.",
    icon: Wind, route: "/diario-inteligente/mindfulness",
    iconBg: "bg-amber-100", iconColor: "text-amber-700",
  },
  {
    tag: "MICRO · GRATITUD", duration: "2 min",
    title: "Tres Anclas de Gratitud",
    subtitle: "Una micro-práctica para reorientar la atención hacia lo amable.",
    icon: Sparkles, route: "/diario-inteligente/mindfulness",
    iconBg: "bg-emerald-100", iconColor: "text-emerald-700",
  },
];

export function RecommendedResourceCard() {
  const navigate = useNavigate();
  const [personalized, setPersonalized] = useState<Resource | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Try personalized daily recommendation from the algo tables.
      const { data, error } = await supabase.rpc("get_daily_recommendations", { _user_id: user.id, _limit: 1 });
      if (!error && data?.length) {
        const top: any = data[0];
        setPersonalized({
          tag: "PARA VOS HOY",
          duration: "· personalizado",
          title: top.sub_resource_name ?? "Recurso recomendado",
          subtitle: "Sugerencia calculada según tus últimas respuestas.",
          icon: Compass,
          route: top.sub_resource_route ?? "/psicoeducacion",
          iconBg: "bg-teal-100",
          iconColor: "text-teal-700",
        });
        return;
      }

      // 2. Fallback: use the onboarding priority_module.
      const { data: profile } = await supabase
        .from("patient_app_profiles")
        .select("priority_module")
        .eq("user_id", user.id)
        .maybeSingle();
      const pm = (profile as any)?.priority_module as string | null;
      if (pm && pm in TOOL_META) {
        const meta = TOOL_META[pm as ToolModule];
        setPersonalized({
          tag: "TU PRIORIDAD",
          duration: "· personalizado",
          title: meta.label,
          subtitle: "Basado en tus respuestas del onboarding.",
          icon: Compass,
          route: meta.route,
          iconBg: "bg-teal-100",
          iconColor: "text-teal-700",
        });
      }
    })();
  }, []);


  const resource = useMemo(() => {
    if (personalized) return personalized;
    const seed = Math.floor(Date.now() / (1000 * 60 * 60));
    return FALLBACK_POOL[seed % FALLBACK_POOL.length];
  }, [personalized]);
  const Icon = resource.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(resource.route)}
      className="glass-premium relative flex w-full items-center gap-3 rounded-[20px] p-3 text-left"
    >
      <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${resource.iconBg}`}>
        <Icon size={16} className={resource.iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[14px] font-semibold leading-tight text-resma-navy line-clamp-1">
          {resource.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[11.5px] leading-snug text-muted-foreground">
          {resource.subtitle}
        </p>
      </div>
      <ChevronRight size={14} className="text-muted-foreground/50" />
    </motion.button>
  );
}

