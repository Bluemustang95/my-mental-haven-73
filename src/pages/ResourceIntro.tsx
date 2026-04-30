import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Apple, ArrowLeft, ArrowRight, BookOpen, Compass, Leaf } from "lucide-react";
import resmitaAvatar from "@/assets/resmita-mindfulness.png";

const introScreens = {
  "alimentacion-consciente": {
    title: "Alimentación Consciente",
    category: "Alimentación",
    text: "Comer con consciencia es aprender a escuchar lo que tu cuerpo necesita. No se trata de seguir una dieta, sino de estar presente en cada bocado, reconociendo tus señales de hambre y saciedad para construir un vínculo más sano con la comida.",
    button: "¿Empezamos?",
    path: "/herramientas/alimentacion-consciente",
    Icon: Apple,
    bg: "bg-resource-eating-bg",
    accent: "text-resource-eating-accent",
    accentBg: "bg-resource-eating-accent",
    shadow: "shadow-resource-eating-accent/20",
    border: "border-resource-eating-accent/15",
  },
  "mis-valores": {
    title: "Mis Valores",
    category: "Valores",
    text: "Tus valores son como una brújula: te marcan el camino, pero no son un destino. Identificarlos te va a ayudar a tomar decisiones que tengan sentido para vos y a caminar hacia la vida que realmente querés construir.",
    button: "Ver mis valores",
    path: "/herramientas/mis-valores",
    Icon: Compass,
    bg: "bg-resource-values-bg",
    accent: "text-resource-values-accent",
    accentBg: "bg-resource-values-accent",
    shadow: "shadow-resource-values-accent/20",
    border: "border-resource-values-accent/15",
  },
  psicoeducacion: {
    title: "Psicoeducación",
    category: "Aprendizaje",
    text: "Entender lo que te pasa es el primer paso para sentirte mejor. En esta sección vas a encontrar información clara y herramientas basadas en evidencia para conocer cómo funciona tu mente y tus emociones.",
    button: "Quiero aprender",
    path: "/herramientas/contenido",
    Icon: BookOpen,
    bg: "bg-resource-psycho-bg",
    accent: "text-resource-psycho-accent",
    accentBg: "bg-resource-psycho-accent",
    shadow: "shadow-resource-psycho-accent/20",
    border: "border-resource-psycho-accent/15",
  },
  autocuidado: {
    title: "Autocuidado",
    category: "Hábitos",
    text: "Cuidar de vos no es un lujo, es una necesidad. Aquí vas a encontrar pequeñas acciones y hábitos diarios que podés sumar para proteger tu energía, bajar el estrés y mejorar tu bienestar general.",
    button: "Ver mis hábitos",
    path: "/herramientas/autocuidado",
    Icon: Leaf,
    bg: "bg-resource-selfcare-bg",
    accent: "text-resource-selfcare-accent",
    accentBg: "bg-resource-selfcare-accent",
    shadow: "shadow-resource-selfcare-accent/20",
    border: "border-resource-selfcare-accent/15",
  },
} as const;

type IntroSlug = keyof typeof introScreens;

export default function ResourceIntro() {
  const navigate = useNavigate();
  const { slug } = useParams();
  const screen = useMemo(() => introScreens[(slug ?? "") as IntroSlug] ?? introScreens.psicoeducacion, [slug]);
  const Icon = screen.Icon;

  return (
    <main className={`flex min-h-screen flex-col px-5 pb-6 pt-12 safe-area-top ${screen.bg} ${screen.accent}`}>
      <header className="mb-6 flex items-center justify-between gap-3">
        <button
          onClick={() => navigate("/herramientas")}
          className={`flex h-11 w-11 items-center justify-center rounded-full border bg-card/75 shadow-sm transition-transform active:scale-95 ${screen.border}`}
          aria-label="Volver a Recursos"
        >
          <ArrowLeft size={20} />
        </button>
        <span className="rounded-full bg-card/75 px-4 py-2 font-sans text-xs font-semibold shadow-sm">
          {screen.category}
        </span>
      </header>

      <motion.section
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
        className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center pb-8 text-center"
      >
        <motion.div
          animate={{ y: [-6, 7, -6], rotate: [-1.5, 1.5, -1.5] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-8 flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44"
        >
          <div className="absolute inset-4 rounded-full bg-card/65 blur-xl" />
          <img src={resmitaAvatar} alt="Resmita" className="relative h-full w-full object-contain drop-shadow-2xl" />
          <div className={`absolute -bottom-1 -right-1 flex h-16 w-16 items-center justify-center rounded-[1.75rem] border bg-card/90 shadow-lg ${screen.border}`}>
            <Icon size={30} strokeWidth={1.9} />
          </div>
        </motion.div>

        <div className="px-2 py-4">
          <h1 className="mb-4 font-mindful text-3xl leading-tight sm:text-4xl">{screen.title}</h1>
          <p className="font-sans text-xs font-normal leading-6 opacity-75 sm:text-sm sm:leading-7">
            {screen.text}
          </p>
        </div>
      </motion.section>

      <button
        onClick={() => navigate(screen.path)}
        className={`flex w-full items-center justify-center gap-3 rounded-[3rem] px-8 py-4 font-sans text-base font-bold text-primary-foreground shadow-lg transition-transform active:scale-[0.98] sm:py-5 ${screen.accentBg} ${screen.shadow}`}
      >
        {screen.button} <ArrowRight size={20} strokeWidth={2.4} />
      </button>
    </main>
  );
}