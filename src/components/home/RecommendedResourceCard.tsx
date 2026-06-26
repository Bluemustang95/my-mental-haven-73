import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, BookOpen, Wind, Sparkles, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

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

const POOL: Resource[] = [
  {
    tag: "LECTURA · TCC",
    duration: "5 min",
    title: "Manejo de Distorsiones Cognitivas",
    subtitle: "Identificá pensamientos automáticos y reformulalos paso a paso.",
    icon: BookOpen,
    route: "/diario-inteligente/gestion-pensamientos/pensamientos-automaticos",
    iconBg: "bg-sky-100",
    iconColor: "text-sky-700",
  },
  {
    tag: "PODCAST · DBT",
    duration: "7 min",
    title: "Desarmando la Rumiación Nocturna",
    subtitle: "Pautas de Linehan para evitar la rumiación de pensamientos.",
    icon: Headphones,
    route: "/herramientas/sueno",
    iconBg: "bg-violet-100",
    iconColor: "text-violet-700",
  },
  {
    tag: "PRÁCTICA · DBT",
    duration: "3 min",
    title: "Práctica del Botón de Pánico",
    subtitle: "Activá la respuesta de calma con la habilidad TIP.",
    icon: Wind,
    route: "/diario-inteligente/mindfulness",
    iconBg: "bg-amber-100",
    iconColor: "text-amber-700",
  },
  {
    tag: "MICRO · GRATITUD",
    duration: "2 min",
    title: "Tres Anclas de Gratitud",
    subtitle: "Una micro-práctica para reorientar la atención hacia lo amable.",
    icon: Sparkles,
    route: "/diario-inteligente/mindfulness",
    iconBg: "bg-emerald-100",
    iconColor: "text-emerald-700",
  },
];

export function RecommendedResourceCard() {
  const navigate = useNavigate();
  const resource = useMemo(() => {
    const seed = Math.floor(Date.now() / (1000 * 60 * 60));
    return POOL[seed % POOL.length];
  }, []);
  const Icon = resource.icon;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={() => navigate(resource.route)}
      className="glass-premium relative flex w-full items-center gap-2.5 rounded-[18px] p-2.5 text-left"
    >
      <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${resource.iconBg}`}>
        <Icon size={15} className={resource.iconColor} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-display text-[12px] font-semibold leading-tight text-resma-navy line-clamp-1">
          {resource.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[10.5px] leading-snug text-muted-foreground">
          {resource.subtitle}
        </p>
      </div>
      <ChevronRight size={13} className="text-muted-foreground/50" />
    </motion.button>
  );
}
