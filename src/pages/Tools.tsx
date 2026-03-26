import { useNavigate } from "react-router-dom";
import { Wind, HandFist, Flower, BookOpen, Star, Leaf, ArrowRight } from "@phosphor-icons/react";

const tools = [
  { path: "/herramientas/respiracion", label: "Respiración Guiada", desc: "Patrones para regular tu cuerpo", icon: Wind, color: "bg-success/10 text-foreground" },
  { path: "/herramientas/grounding", label: "Grounding 5-4-3-2-1", desc: "Anclaje con los 5 sentidos", icon: HandFist, color: "bg-destructive/10 text-foreground" },
  { path: "/herramientas/mindfulness", label: "Mindfulness", desc: "Timer de meditación", icon: Flower, color: "bg-accent/10 text-foreground" },
  { path: "/herramientas/contenido", label: "Psicoeducación", desc: "Videos, audios, lecturas y Psico-Factos", icon: BookOpen, color: "bg-primary/5 text-foreground" },
  { path: "/herramientas/autocuidado", label: "Autocuidado Offline", desc: "Tareas para el mundo real", icon: Leaf, color: "bg-mood-5/15 text-foreground" },
  { path: "/herramientas/favoritos", label: "Mi Botiquín", desc: "Tus contenidos favoritos", icon: Star, color: "bg-accent/15 text-foreground" },
];

export default function Tools() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <h1 className="mb-2 font-display text-xl font-semibold">Herramientas</h1>
      <p className="mb-6 text-sm text-muted-foreground">Técnicas para tu bienestar.</p>

      <div className="space-y-3">
        {tools.map((tool) => {
          const Icon = tool.icon;
          return (
            <button
              key={tool.path}
              onClick={() => navigate(tool.path)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${tool.color}`}>
                <Icon size={22} weight="duotone" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-medium">{tool.label}</p>
                <p className="text-xs text-muted-foreground">{tool.desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
