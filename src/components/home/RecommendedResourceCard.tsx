import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Headphones, BookOpen, Wind, Sparkles, ChevronRight } from "lucide-react";

type Resource = {
  tag: string;
  duration: string;
  title: string;
  subtitle: string;
  icon: typeof BookOpen;
  route: string;
  accent: string;
};

const POOL: Resource[] = [
  {
    tag: "LECTURA · TCC",
    duration: "5 min",
    title: "Manejo de Distorsiones Cognitivas",
    subtitle: "Identificá pensamientos automáticos y reformulalos paso a paso.",
    icon: BookOpen,
    route: "/diario-inteligente/gestion-pensamientos/pensamientos-automaticos",
    accent: "from-sky-200/70 to-teal-200/40",
  },
  {
    tag: "PODCAST · DBT",
    duration: "7 min",
    title: "Desarmando la Rumiación Nocturna",
    subtitle: "Pautas de Linehan para evitar la rumiación de pensamientos.",
    icon: Headphones,
    route: "/herramientas/sueno",
    accent: "from-violet-200/60 to-indigo-200/40",
  },
  {
    tag: "PRÁCTICA · DBT",
    duration: "3 min",
    title: "Práctica del Botón de Pánico",
    subtitle: "Activá la respuesta de calma con la habilidad TIP.",
    icon: Wind,
    route: "/diario-inteligente/mindfulness",
    accent: "from-amber-200/70 to-rose-200/40",
  },
  {
    tag: "MICRO · GRATITUD",
    duration: "2 min",
    title: "Tres Anclas de Gratitud",
    subtitle: "Una micro-práctica para reorientar la atención hacia lo amable.",
    icon: Sparkles,
    route: "/diario-inteligente/mindfulness",
    accent: "from-emerald-200/60 to-teal-200/40",
  },
];

export function RecommendedResourceCard() {
  const navigate = useNavigate();
  const resource = useMemo(() => {
    // Stable per session/hour to avoid jumpiness
    const seed = Math.floor(Date.now() / (1000 * 60 * 60));
    return POOL[seed % POOL.length];
  }, []);
  const Icon = resource.icon;

  return (
    <div className="glass-premium relative overflow-hidden rounded-[26px] p-4">
      <div className={`pointer-events-none absolute -right-10 -top-10 h-36 w-36 rounded-full bg-gradient-to-br ${resource.accent} blur-2xl opacity-70`} />
      <div className="relative">
        <div className="flex items-start justify-between gap-3">
          <span className="rounded-full bg-resma-navy/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white">
            {resource.tag}
          </span>
          <span className="text-[11px] font-medium text-muted-foreground">{resource.duration}</span>
        </div>
        <h3 className="mt-3 font-serifElegant text-[19px] font-semibold leading-tight text-resma-navy">
          {resource.title}
        </h3>
        <p className="mt-1 text-[12.5px] leading-snug text-muted-foreground">{resource.subtitle}</p>
        <button
          onClick={() => navigate(resource.route)}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-resma-navy/10 bg-white/80 px-4 py-3 text-[11.5px] font-bold uppercase tracking-[0.18em] text-resma-navy shadow-sm transition active:scale-[0.98]"
        >
          <Icon size={14} /> Comenzar recurso recomendado <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
