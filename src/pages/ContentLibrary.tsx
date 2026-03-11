import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Video, Headphones, FileText, ArrowRight, BookOpen } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

// Sample content data (will come from DB in production)
const sampleContent = [
  { id: "1", title: "¿Qué es la ansiedad?", description: "Entendé qué pasa en tu cuerpo y mente cuando sentís ansiedad.", content_type: "video", category: "Ansiedad", duration: "5 min", tags: ["Ansiedad y estrés"] },
  { id: "2", title: "Respiración diafragmática", description: "Aprendé la técnica más efectiva para calmar el sistema nervioso.", content_type: "audio", category: "Técnicas", duration: "8 min", tags: ["Regulación emocional"] },
  { id: "3", title: "El ciclo del pensamiento negativo", description: "Cómo los pensamientos automáticos afectan tus emociones.", content_type: "video", category: "Depresión", duration: "6 min", tags: ["Estado de ánimo"] },
  { id: "4", title: "Guía de higiene del sueño", description: "10 hábitos respaldados por la ciencia para dormir mejor.", content_type: "pdf", category: "Hábitos", duration: "10 min lectura", tags: ["Hábitos y rutinas"] },
  { id: "5", title: "Meditación para principiantes", description: "Una introducción suave al mindfulness.", content_type: "audio", category: "Mindfulness", duration: "12 min", tags: ["Regulación emocional"] },
  { id: "6", title: "Autoestima: de dónde viene", description: "Explorá los factores que influyen en cómo te ves.", content_type: "video", category: "Autoestima", duration: "7 min", tags: ["Autoestima y autoconocimiento"] },
  { id: "7", title: "Técnicas de grounding explicadas", description: "Por qué funcionan los ejercicios de anclaje sensorial.", content_type: "pdf", category: "Técnicas", duration: "5 min lectura", tags: ["Ansiedad y estrés"] },
  { id: "8", title: "Comunicación asertiva", description: "Cómo expresar lo que sentís sin agresión ni pasividad.", content_type: "video", category: "Relaciones", duration: "8 min", tags: ["Relaciones interpersonales"] },
];

const categories = ["Todos", "Ansiedad", "Depresión", "Técnicas", "Hábitos", "Mindfulness", "Autoestima", "Relaciones"];

const typeIcons: Record<string, typeof Video> = {
  video: Video,
  audio: Headphones,
  pdf: FileText,
};

export default function ContentLibrary() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [filter, setFilter] = useState<"all" | "video" | "audio" | "pdf">("all");

  const filtered = sampleContent.filter((c) => {
    if (activeCategory !== "Todos" && c.category !== activeCategory) return false;
    if (filter !== "all" && c.content_type !== filter) return false;
    return true;
  });

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Psicoeducación</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Material para aprender sobre tu salud mental.</p>

      {/* Type filter */}
      <div className="mb-4 flex gap-2">
        {(["all", "video", "audio", "pdf"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setFilter(t)}
            className={cn(
              "rounded-full border px-3 py-1.5 font-display text-[10px] font-medium uppercase tracking-wider transition-all",
              filter === t ? "border-accent bg-accent/10" : "border-border text-muted-foreground"
            )}
          >
            {t === "all" ? "Todos" : t === "video" ? "Videos" : t === "audio" ? "Audios" : "Lecturas"}
          </button>
        ))}
      </div>

      {/* Category scroll */}
      <div className="mb-5 flex gap-1.5 overflow-x-auto no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={cn(
              "whitespace-nowrap rounded-full border px-3 py-1 font-display text-[10px] font-medium transition-all shrink-0",
              activeCategory === cat ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground"
            )}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content list */}
      <div className="space-y-3">
        {filtered.map((item) => {
          const Icon = typeIcons[item.content_type] || BookOpen;
          return (
            <button
              key={item.id}
              className="flex w-full items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary">
                <Icon size={18} weight="duotone" className="text-secondary-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-medium truncate">{item.title}</p>
                <p className="text-xs text-muted-foreground truncate">{item.description}</p>
                <p className="mt-1 font-display text-[10px] text-muted-foreground">{item.duration}</p>
              </div>
              <ArrowRight size={14} className="shrink-0 text-muted-foreground" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <p className="py-8 text-center text-sm text-muted-foreground">No hay contenido en esta categoría.</p>
        )}
      </div>
    </div>
  );
}
