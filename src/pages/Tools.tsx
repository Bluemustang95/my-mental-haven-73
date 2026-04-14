import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Wind, Flower, BookOpen, Leaf, Heart, Sparkle, HandFist } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const feelingOptions = [
  { label: "Ansiedad o nervios", recommendation: { path: "/herramientas/respiracion", name: "Respiración Guiada" } },
  { label: "Tensión física", recommendation: { path: "/herramientas/grounding", name: "Grounding 5-4-3-2-1" } },
  { label: "Mente acelerada", recommendation: { path: "/herramientas/mindfulness", name: "Mindfulness" } },
  { label: "Desmotivación", recommendation: { path: "/herramientas/autocuidado", name: "Autocuidado Offline" } },
  { label: "Quiero aprender", recommendation: { path: "/herramientas/contenido", name: "Psicoeducación" } },
];

export default function Tools() {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<{ path: string; name: string } | null>(null);

  const handleFeeling = (opt: (typeof feelingOptions)[0]) => {
    setRecommendation(opt.recommendation);
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-foreground">Recursos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">Técnicas para tu bienestar.</p>
        </div>
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => navigate("/herramientas/favoritos")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-card shadow-sm"
        >
          <Heart size={18} weight="fill" className="text-destructive" />
        </motion.button>
      </div>

      {/* Hero – Te guiamos */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setRecommendation(null); setGuideOpen(true); }}
        className="mb-6 flex w-full items-center gap-4 rounded-[32px] border border-[hsl(var(--accent)/0.25)] bg-card p-5 text-left shadow-sm transition-colors"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
          <Sparkle size={22} weight="duotone" className="text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-foreground">Te guiamos</p>
          <p className="text-xs text-muted-foreground">¿No sabés por dónde empezar?</p>
        </div>
      </motion.button>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Psicoeducación – tall card spanning 2 rows */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/contenido")}
          className="row-span-2 flex flex-col items-start justify-between rounded-[32px] border border-border bg-card p-5 text-left shadow-sm"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/5">
            <BookOpen size={20} weight="duotone" className="text-foreground" />
          </div>
          <div className="mt-auto pt-6">
            <p className="font-display text-sm font-semibold text-foreground">Psicoeducación</p>
            <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">Videos, audios, lecturas y Psico-Factos</p>
          </div>
        </motion.button>

        {/* Mindfulness */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/mindfulness")}
          className="flex flex-col items-start rounded-[32px] border border-border bg-card p-5 text-left shadow-sm"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "hsl(270 60% 95%)" }}>
            <Flower size={20} weight="duotone" className="text-foreground" />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold text-foreground">Mindfulness</p>
        </motion.button>

        {/* Autocuidado */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/autocuidado")}
          className="flex flex-col items-start rounded-[32px] border border-border bg-card p-5 text-left shadow-sm"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "hsl(160 45% 92%)" }}>
            <Leaf size={20} weight="duotone" className="text-foreground" />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold text-foreground">Autocuidado</p>
        </motion.button>

        {/* Grounding */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/grounding")}
          className="flex flex-col items-start rounded-[32px] border border-border bg-card p-5 text-left shadow-sm"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-secondary/60">
            <HandFist size={20} weight="duotone" className="text-foreground" />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold text-foreground">Grounding</p>
        </motion.button>

        {/* Respiración */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/respiracion")}
          className="flex flex-col items-start rounded-[32px] border border-border bg-card p-5 text-left shadow-sm"
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: "hsl(25 80% 93%)" }}>
            <Wind size={20} weight="duotone" className="text-foreground" />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold text-foreground">Respiración</p>
        </motion.button>
      </div>

      {/* Guide Dialog */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="rounded-[28px] border-border">
          <DialogHeader>
            <DialogTitle className="font-display">¿Cómo te sentís ahora?</DialogTitle>
            <DialogDescription>Elegí lo que más resuene y te recomendamos un recurso.</DialogDescription>
          </DialogHeader>

          {!recommendation ? (
            <div className="space-y-2 pt-2">
              {feelingOptions.map((opt) => (
                <button
                  key={opt.label}
                  onClick={() => handleFeeling(opt)}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left font-display text-sm transition-colors active:bg-muted"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-4 pt-2 text-center">
              <p className="text-sm text-muted-foreground">Te recomendamos probar:</p>
              <p className="font-display text-lg font-semibold text-foreground">{recommendation.name}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setRecommendation(null)}
                  className="flex-1 rounded-2xl border border-border py-2.5 font-display text-sm text-muted-foreground transition-colors active:bg-muted"
                >
                  Volver
                </button>
                <button
                  onClick={() => { setGuideOpen(false); navigate(recommendation.path); }}
                  className="flex-1 rounded-2xl bg-primary py-2.5 font-display text-sm text-primary-foreground transition-colors active:opacity-90"
                >
                  Ir al recurso
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
