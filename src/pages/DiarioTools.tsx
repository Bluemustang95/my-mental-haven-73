import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Users, Calendar, MessageCircle, Brain, Mail, Trophy, Moon } from "lucide-react";

const tools = [
  { id: "vinculos",     label: "Vínculos",                 desc: "Registrá dinámicas con personas importantes", icon: Users,          path: "/diario/vinculos" },
  { id: "timeline",     label: "Línea del día",            desc: "Mapeá tu día por momentos",                  icon: Calendar,       path: "/diario/dia" },
  { id: "dialogo",      label: "Diálogo interno",          desc: "Observá tu voz crítica y compasiva",         icon: MessageCircle,  path: "/diario/dialogo" },
  { id: "pensamientos", label: "Registro de pensamientos", desc: "Identificá patrones de pensamiento",         icon: Brain,          path: "/diario/pensamientos" },
  { id: "cartas",       label: "Cartas sin enviar",        desc: "Escribí lo que no pudiste decir",            icon: Mail,           path: "/diario/cartas" },
  { id: "suenos",       label: "Registro de sueños",       desc: "Anotá y explorá lo que soñás",               icon: Moon,           path: "/diario/suenos" },
  { id: "logros",       label: "Micro-logros",             desc: "Celebrá tus avances del día",                icon: Trophy,         path: "/diario/logros" },
];

export default function DiarioTools() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-background px-5 pt-14 pb-24 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground active:scale-95 transition-transform">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Herramientas</h1>
          <p className="text-xs text-muted-foreground">Explorá todas las herramientas de introspección.</p>
        </div>
      </div>

      <div className="space-y-3">
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
              className="flex w-full items-center gap-4 rounded-[28px] border border-border bg-card p-4 text-left shadow-sm transition-colors"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-accent/10">
                <Icon size={18} className="text-accent-foreground" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-display text-sm font-semibold text-foreground">{tool.label}</p>
                <p className="text-[11px] text-muted-foreground leading-snug">{tool.desc}</p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
