import { useNavigate } from "react-router-dom";
import { Zap, Wind, HeartPulse, Waves, Users, Brain, type LucideIcon } from "lucide-react";

type Tile = {
  slug: string;
  name: string;
  desc: string;
  Icon: LucideIcon;
  tint: "primary" | "accent";
};

const tiles: Tile[] = [
  {
    slug: "mindfulness",
    name: "Mindfulness",
    desc: "Respiración consciente.",
    Icon: Wind,
    tint: "primary",
  },
  {
    slug: "regulacion-emocional",
    name: "Regulación Emocional",
    desc: "Habilidades STOP y TIP.",
    Icon: HeartPulse,
    tint: "accent",
  },
  {
    slug: "tolerancia-malestar",
    name: "Tolerancia al Malestar",
    desc: "Sobrevive a crisis.",
    Icon: Waves,
    tint: "primary",
  },
  {
    slug: "efectividad-personal",
    name: "Efectividad Personal",
    desc: "Mejorá vínculos.",
    Icon: Users,
    tint: "accent",
  },
];

const tintBg: Record<Tile["tint"], string> = {
  primary: "bg-primary/15 text-primary",
  accent: "bg-accent/25 text-foreground",
};

export function BentoGrid() {
  const navigate = useNavigate();

  return (
    <div className="space-y-3">
      {/* 2x2 grid */}
      <div className="grid grid-cols-2 gap-3">
        {tiles.map((t) => (
          <button
            key={t.slug}
            onClick={() => navigate(`/diario-inteligente/${t.slug}`)}
            className="relative flex aspect-square flex-col justify-between overflow-hidden rounded-3xl border border-foreground/5 bg-card/80 p-4 text-left shadow-glass backdrop-blur-3xl transition active:scale-[0.98]"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${tintBg[t.tint]}`}>
              <t.Icon size={20} strokeWidth={2} />
            </div>
            <div>
              <h3 className="font-display text-base font-bold leading-tight text-foreground">{t.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* Gestion de Pensamientos */}
      <button
        onClick={() => navigate("/diario-inteligente/gestion-pensamientos")}
        className="relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-3xl border border-foreground/5 bg-card/80 p-4 text-left shadow-glass backdrop-blur-3xl transition active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-primary/15 text-primary">
            <Brain size={20} strokeWidth={2} />
          </div>
          <div>
            <h3 className="font-display text-base font-bold text-foreground">
              Gestión de Pensamientos
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Distorsiones, rumiación y preocupación.
            </p>
          </div>
        </div>
      </button>

      {/* Pack Actividades */}
      <button
        onClick={() => navigate("/herramientas/pack")}
        className="relative flex w-full items-center justify-between overflow-hidden rounded-3xl bg-primary p-5 text-left text-primary-foreground shadow-primary-glow"
      >
        <div>
          <h3 className="font-display text-base font-bold">Pack de Actividades</h3>
          <p className="mt-1 text-xs font-medium opacity-80">Abrí el kit con ejercicios de la app.</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent text-accent-foreground">
          <Zap size={20} fill="currentColor" />
        </div>
      </button>
    </div>
  );
}
