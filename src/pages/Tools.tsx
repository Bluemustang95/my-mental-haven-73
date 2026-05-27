import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart, Sparkles, BookOpen, Leaf, Mountain, Moon, Wine, Waves,
  Apple, Compass, Shield, Tornado, Flower2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

type ResourceKey =
  | "psicoeducacion" | "mindfulness" | "autocuidado" | "grounding"
  | "safety" | "sueno" | "rumiacion" | "recuperacion" | "regulacion"
  | "alimentacion" | "valores" | "guia";

type CardDef = {
  key: ResourceKey;
  path: string;
  name: string;
  tagline: string;
  Icon: typeof Heart;
  bgVar: string;     // hsl(var(--...))
  accentVar: string;
  className?: string;
  large?: boolean;
};

const cards: CardDef[] = [
  { key: "mindfulness", path: "/herramientas/mindfulness", name: "Mindfulness", tagline: "Mandala y atención plena", Icon: Flower2, bgVar: "--resource-mindfulness-bg", accentVar: "--resource-mindfulness-accent", large: true },
  { key: "grounding", path: "/herramientas/grounding", name: "Grounding", tagline: "Anclate con los 5 sentidos", Icon: Mountain, bgVar: "--resource-grounding-bg", accentVar: "--resource-grounding-accent" },
  { key: "safety", path: "/herramientas/plan-seguridad", name: "Plan de Seguridad", tagline: "Tu red de contención", Icon: Shield, bgVar: "--resource-safety-bg", accentVar: "--resource-safety-accent" },
  { key: "sueno", path: "/herramientas/sueno", name: "Higiene del Sueño", tagline: "Ruido marino y bitácora", Icon: Moon, bgVar: "--resource-sleep-bg", accentVar: "--resource-sleep-accent", large: true },
  { key: "rumiacion", path: "/herramientas/rumiacion", name: "Rumiación", tagline: "Defusión cognitiva", Icon: Tornado, bgVar: "--resource-rumination-bg", accentVar: "--resource-rumination-accent" },
  { key: "recuperacion", path: "/herramientas/recuperacion", name: "Recuperación", tagline: "Tarro de ahorro y racha", Icon: Wine, bgVar: "--resource-recovery-bg", accentVar: "--resource-recovery-accent" },
  { key: "regulacion", path: "/herramientas/regulacion-emocional", name: "Regulación", tagline: "STOP · TIPP", Icon: Waves, bgVar: "--resource-regulation-bg", accentVar: "--resource-regulation-accent", large: true },
  { key: "psicoeducacion", path: "/herramientas/intro/psicoeducacion", name: "Psicoeducación", tagline: "Videos y lecturas", Icon: BookOpen, bgVar: "--resource-psycho-bg", accentVar: "--resource-psycho-accent" },
  { key: "autocuidado", path: "/herramientas/intro/autocuidado", name: "Autocuidado", tagline: "Tareas y hábitos", Icon: Leaf, bgVar: "--resource-selfcare-bg", accentVar: "--resource-selfcare-accent" },
  { key: "alimentacion", path: "/herramientas/intro/alimentacion-consciente", name: "Alimentación", tagline: "Comer con conciencia", Icon: Apple, bgVar: "--resource-eating-bg", accentVar: "--resource-eating-accent" },
  { key: "valores", path: "/herramientas/intro/mis-valores", name: "Mis Valores", tagline: "Brújula personal", Icon: Compass, bgVar: "--resource-values-bg", accentVar: "--resource-values-accent" },
];

const guideQuestions: { title: string; choices: { label: string; pick: ResourceKey }[] }[] = [
  {
    title: "¿Qué necesitás cuidar ahora?",
    choices: [
      { label: "Bajar la ansiedad", pick: "grounding" },
      { label: "Frenar un impulso", pick: "regulacion" },
      { label: "Ordenar la mente", pick: "rumiacion" },
      { label: "Estar en crisis", pick: "safety" },
    ],
  },
  {
    title: "¿Cómo te sentís ahora?",
    choices: [
      { label: "Inquieto/a", pick: "mindfulness" },
      { label: "Triste o vacío/a", pick: "valores" },
      { label: "Con ganas de consumir", pick: "recuperacion" },
      { label: "Cansado/a", pick: "sueno" },
    ],
  },
];

export default function Tools() {
  const navigate = useNavigate();
  const [guideOpen, setGuideOpen] = useState(false);
  const [guideStep, setGuideStep] = useState(0);
  const [recommendation, setRecommendation] = useState<CardDef | null>(null);

  const resetGuide = () => { setGuideStep(0); setRecommendation(null); };

  const handleGuide = (pick: ResourceKey) => {
    if (guideStep >= guideQuestions.length - 1) {
      setRecommendation(cards.find((c) => c.key === pick) ?? null);
    } else {
      setGuideStep((s) => s + 1);
    }
  };

  const Card = ({ card }: { card: CardDef }) => (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={() => navigate(card.path)}
      className={`relative flex flex-col items-start overflow-hidden rounded-[2.75rem] border border-white/40 p-5 text-left ${card.large ? "row-span-2 min-h-[14rem]" : "min-h-[7.5rem]"}`}
      style={{
        backgroundColor: `hsl(var(${card.bgVar}))`,
        color: `hsl(var(${card.accentVar}))`,
        boxShadow: `0 20px 50px -18px hsl(var(${card.accentVar}) / 0.45), inset 0 1px 0 hsl(0 0% 100% / 0.5)`,
      }}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/65 shadow-sm" style={{ color: `hsl(var(${card.accentVar}))` }}>
        <card.Icon size={22} strokeWidth={2.1} />
      </div>
      <div className="mt-auto pt-5">
        <p className="font-mindful text-lg leading-tight">{card.name}</p>
        <p className="mt-1 font-sans text-[11px] font-medium leading-snug opacity-75">{card.tagline}</p>
      </div>
    </motion.button>
  );

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="font-mindful text-3xl leading-tight text-foreground">Recursos</h1>
          <p className="mt-0.5 font-sans text-sm text-muted-foreground">Elegí el camino de hoy.</p>
        </div>
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate("/herramientas/favoritos")}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-destructive/15 bg-destructive/5 shadow-sm">
          <Heart size={18} className="fill-destructive text-destructive" />
        </motion.button>
      </div>

      <motion.button whileTap={{ scale: 0.97 }} onClick={() => { resetGuide(); setGuideOpen(true); }}
        className="mb-6 flex w-full items-center gap-4 rounded-[2.5rem] border border-primary/15 bg-gradient-to-r from-primary/5 via-accent/15 to-primary/5 p-5 text-left shadow-[0_18px_45px_-22px_hsl(var(--primary)/0.4)]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-card/80">
          <Sparkles size={20} className="text-primary" />
        </div>
        <div>
          <p className="font-mindful text-base font-semibold text-foreground">Te guiamos</p>
          <p className="font-sans text-xs text-muted-foreground">Encontrá el recurso para este momento</p>
        </div>
      </motion.button>

      <div className="grid auto-rows-[minmax(7rem,auto)] grid-cols-2 gap-3">
        {cards.map((card) => <Card key={card.key} card={card} />)}
      </div>

      <Dialog open={guideOpen} onOpenChange={setGuideOpen}>
        <DialogContent className="rounded-[2rem] p-6">
          <DialogHeader>
            <DialogTitle className="font-mindful text-2xl">¿Cómo te sentís ahora?</DialogTitle>
            <DialogDescription>
              {recommendation ? "Te recomendamos:" : "Elegí lo que más resuene."}
            </DialogDescription>
          </DialogHeader>

          {!recommendation ? (
            <motion.div key={guideStep} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-3 pt-2">
              <p className="font-mindful text-lg">{guideQuestions[guideStep].title}</p>
              {guideQuestions[guideStep].choices.map((c) => (
                <button key={c.label} onClick={() => handleGuide(c.pick)}
                  className="w-full rounded-2xl border border-border bg-card px-4 py-3 text-left font-sans text-sm font-semibold transition active:scale-[0.98]">
                  {c.label}
                </button>
              ))}
            </motion.div>
          ) : (
            <div className="space-y-4 pt-2 text-center">
              <p className="font-mindful text-3xl">{recommendation.name}</p>
              <div className="flex gap-2">
                <button onClick={resetGuide} className="flex-1 rounded-2xl border border-border bg-card py-2.5 font-sans text-sm">Otra vez</button>
                <button onClick={() => { setGuideOpen(false); navigate(recommendation.path); }}
                  className="flex-1 rounded-2xl bg-primary py-2.5 font-sans text-sm text-primary-foreground">Ir al recurso</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
