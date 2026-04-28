import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  Heart,
  Sparkles,
  BookOpen,
  Flower2,
  Leaf,
  Hand,
  Wind,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import CrisisPlan from "@/components/CrisisPlan";
import { supabase } from "@/integrations/supabase/client";

const resourceThemes = {
  psicoeducacion: "border-resource-psycho-accent/15 bg-resource-psycho-bg text-resource-psycho-accent",
  mindfulness: "border-resource-mindfulness-accent/15 bg-resource-mindfulness-bg text-resource-mindfulness-accent",
  autocuidado: "border-resource-selfcare-accent/15 bg-resource-selfcare-bg text-resource-selfcare-accent",
  grounding: "border-resource-grounding-accent/15 bg-resource-grounding-bg text-resource-grounding-accent",
  respiracion: "border-resource-breathing-accent/15 bg-resource-breathing-bg text-resource-breathing-accent",
};

const FALLBACK_FEELINGS = [
  { label: "Ansiedad o nervios", path: "/herramientas/respiracion", name: "Respiración Guiada" },
  { label: "Tensión física", path: "/herramientas/grounding", name: "Grounding 5-4-3-2-1" },
  { label: "Mente acelerada", path: "/herramientas/mindfulness", name: "Mindfulness" },
  { label: "Desmotivación", path: "/herramientas/autocuidado", name: "Autocuidado Offline" },
  { label: "Quiero aprender", path: "/herramientas/contenido", name: "Psicoeducación" },
];

export default function Tools() {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const [recommendation, setRecommendation] = useState<{ path: string; name: string } | null>(null);

  const { data: feelingOptions = FALLBACK_FEELINGS } = useQuery({
    queryKey: ["te-guiamos-options"],
    queryFn: async () => {
      const { data } = await supabase
        .from("resource_tools")
        .select("config, resource_categories!inner(slug)")
        .eq("resource_categories.slug", "te-guiamos")
        .eq("is_published", true)
        .maybeSingle();
      const opts = (data?.config as any)?.options;
      return Array.isArray(opts) && opts.length ? opts : FALLBACK_FEELINGS;
    },
  });

  const handleFeeling = (opt: { path: string; name: string }) => {
    setRecommendation({ path: opt.path, name: opt.name });
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
          className="flex h-10 w-10 items-center justify-center rounded-full border border-destructive/15 bg-destructive/5 shadow-sm"
        >
          <Heart size={18} className="fill-destructive text-destructive" />
        </motion.button>
      </div>

      {/* Hero – Te guiamos */}
      <motion.button
        whileTap={{ scale: 0.97 }}
        onClick={() => { setRecommendation(null); setGuideOpen(true); }}
        className="mb-6 flex w-full items-center gap-4 rounded-[2.5rem] border border-border/50 bg-card p-5 text-left shadow-sm"
      >
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-accent/15">
          <Sparkles size={22} className="text-accent-foreground" />
        </div>
        <div className="flex-1">
          <p className="font-display text-sm font-semibold text-foreground">Te guiamos</p>
          <p className="text-xs text-muted-foreground">¿No sabés por dónde empezar?</p>
        </div>
      </motion.button>

      {/* Bento Grid */}
      <div className="grid grid-cols-2 gap-3">
        {/* Psicoeducación – tall */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/contenido")}
          className={`row-span-2 flex flex-col items-start justify-between rounded-[2.5rem] border p-5 text-left shadow-sm ${resourceThemes.psicoeducacion}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card/70">
            <BookOpen size={20} />
          </div>
          <div className="mt-auto pt-6">
            <p className="font-display text-sm font-semibold">Psicoeducación</p>
            <p className="mt-0.5 text-[11px] leading-snug opacity-75">Videos, audios, lecturas y Psico-Factos</p>
          </div>
        </motion.button>

        {/* Mindfulness */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/mindfulness")}
          className={`flex flex-col items-start rounded-[2.5rem] border p-5 text-left shadow-sm ${resourceThemes.mindfulness}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card/70">
            <Flower2 size={20} />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold">Mindfulness</p>
        </motion.button>

        {/* Autocuidado */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/autocuidado")}
          className={`flex flex-col items-start rounded-[2.5rem] border p-5 text-left shadow-sm ${resourceThemes.autocuidado}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card/70">
            <Leaf size={20} />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold">Autocuidado</p>
        </motion.button>

        {/* Grounding */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/grounding")}
          className={`flex flex-col items-start rounded-[2.5rem] border p-5 text-left shadow-sm ${resourceThemes.grounding}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card/70">
            <Hand size={20} />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold">Grounding</p>
        </motion.button>

        {/* Respiración */}
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/herramientas/respiracion")}
          className={`flex flex-col items-start rounded-[2.5rem] border p-5 text-left shadow-sm ${resourceThemes.respiracion}`}
        >
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-card/70">
            <Wind size={20} />
          </div>
          <p className="mt-auto pt-4 font-display text-sm font-semibold">Respiración</p>
        </motion.button>
      </div>

      {/* Plan de Crisis */}
      <CrisisPlan />

      {/* Guide Dialog */}
      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="rounded-[2rem] border-border">
          <DialogHeader>
            <DialogTitle className="font-display">¿Cómo te sentís ahora?</DialogTitle>
            <DialogDescription>Elegí lo que más resuene y te recomendamos un recurso.</DialogDescription>
          </DialogHeader>

          {!recommendation ? (
            <div className="space-y-2 pt-2">
              {feelingOptions.map((opt: any) => (
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
