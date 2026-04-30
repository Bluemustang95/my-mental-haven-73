import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Calendar, MessageCircle, Brain, Mail, Moon } from "lucide-react";

const tools = [
  { id: "vinculos",     label: "Vínculos",                 desc: "Personas importantes", icon: Users,          path: "/diario/vinculos", theme: "border-resource-mindfulness-accent/15 bg-resource-mindfulness-bg text-resource-mindfulness-accent" },
  { id: "timeline",     label: "Línea del día",            desc: "Momentos y escenas",   icon: Calendar,       path: "/diario/dia", theme: "border-resource-sleep-accent/15 bg-resource-sleep-bg text-resource-sleep-accent" },
  { id: "dialogo",      label: "Diálogo interno",          desc: "Voz crítica y compasiva", icon: MessageCircle,  path: "/diario/dialogo", theme: "border-resource-selfcare-accent/15 bg-resource-selfcare-bg text-resource-selfcare-accent" },
  { id: "pensamientos", label: "Pensamientos",             desc: "Patrones y perspectiva", icon: Brain,          path: "/diario/pensamientos", theme: "border-resource-psycho-accent/15 bg-resource-psycho-bg text-resource-psycho-accent" },
  { id: "cartas",       label: "Cartas sin enviar",        desc: "Lo que necesitás decir", icon: Mail,           path: "/diario/cartas", theme: "border-resource-eating-accent/15 bg-resource-eating-bg text-resource-eating-accent" },
  { id: "suenos",       label: "Registro de sueños",       desc: "Anotá y explorá", icon: Moon,           path: "/diario/suenos", theme: "border-resource-regulation-accent/15 bg-resource-regulation-bg text-resource-regulation-accent" },
];

export default function DiarioTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background px-5 pt-14 pb-24 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Herramientas</h1>
          <p className="text-xs text-muted-foreground">Explorá todas las herramientas de introspección.</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {tools.map((tool, i) => {
          const Icon = tool.icon;
          return (
            <motion.button
              key={tool.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate(tool.path)}
              className={`flex min-h-[148px] w-full flex-col items-start rounded-[2.5rem] border p-4 text-left shadow-sm transition-colors ${tool.theme}`}
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-card/70">
                <Icon size={20} />
              </div>
              <div className="mt-auto pt-5">
                <p className="font-display text-sm font-semibold leading-tight">{tool.label}</p>
                <p className="mt-1 text-[11px] leading-snug opacity-75">{tool.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
