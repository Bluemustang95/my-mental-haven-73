import { useNavigate } from "react-router-dom";
import { ArrowLeft, Heart, PencilSimple, Clock, UsersThree, EnvelopeSimple, Notepad, Trophy, ChatCircleDots, Path } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const sections = [
  {
    group: "Registro diario",
    items: [
      { path: "/herramientas/journal/checkin", label: "Check-in rápido", desc: "¿Cómo te sentís hoy? Cuerpo y mente", icon: Heart, color: "bg-destructive/10 text-destructive" },
      { path: "/herramientas/journal/escribir", label: "Escritura libre", desc: "Escribí lo que necesites soltar", icon: PencilSimple, color: "bg-accent/15 text-accent-foreground" },
      { path: "/herramientas/journal/dia", label: "Línea del día", desc: "Mañana, tarde y noche", icon: Clock, color: "bg-secondary text-secondary-foreground" },
      { path: "/herramientas/journal/vinculos", label: "Vínculos", desc: "Registrá interacciones importantes", icon: UsersThree, color: "bg-primary/10 text-foreground" },
    ],
  },
  {
    group: "Herramientas simbólicas",
    items: [
      { path: "/herramientas/journal/cartas", label: "Cartas que no voy a enviar", desc: "Escribí, soltá o guardá", icon: EnvelopeSimple, color: "bg-accent/10 text-accent-foreground" },
      { path: "/herramientas/journal/terapia", label: "Notas para terapia", desc: "Temas para tu próxima sesión", icon: Notepad, color: "bg-success/10 text-foreground" },
      { path: "/herramientas/journal/logros", label: "Micro-logros", desc: "Pequeñas victorias del día", icon: Trophy, color: "bg-accent/15 text-accent-foreground" },
    ],
  },
  {
    group: "Análisis y perspectiva",
    items: [
      { path: "/herramientas/journal/dialogo", label: "Diálogo interno", desc: "Yo crítico vs yo compasivo", icon: ChatCircleDots, color: "bg-secondary text-secondary-foreground" },
      { path: "/herramientas/journal/linea-temporal", label: "Línea temporal", desc: "Tu proceso en perspectiva", icon: Timeline, color: "bg-primary/10 text-foreground" },
    ],
  },
];

export default function Journal() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* Header */}
      <div className="mb-2 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-xl font-semibold">Diario</h1>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">Tu espacio seguro de introspección.</p>

      {sections.map((section, si) => (
        <motion.div
          key={section.group}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: si * 0.1 }}
          className="mb-6"
        >
          <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
            {section.group}
          </h2>
          <div className="space-y-2">
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className="flex w-full items-center gap-3.5 rounded-2xl border border-border bg-card p-3.5 text-left transition-colors active:bg-muted"
                >
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${item.color}`}>
                    <Icon size={20} weight="duotone" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display text-sm font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground truncate">{item.desc}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
