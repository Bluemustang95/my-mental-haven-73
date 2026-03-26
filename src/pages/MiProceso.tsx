import { useNavigate } from "react-router-dom";
import { ChartLineUp, ListChecks, Path, Pill, MagicWand, ArrowRight } from "@phosphor-icons/react";
import { motion } from "framer-motion";

const items = [
  {
    path: "/mi-proceso/tests",
    label: "Tests clínicos",
    desc: "PHQ-9, GAD-7, PSS-10, ISI, Rosenberg",
    icon: ListChecks,
    color: "bg-accent/15 text-accent-foreground",
  },
  {
    path: "/mi-proceso/linea-temporal",
    label: "Línea temporal",
    desc: "Tu proceso en perspectiva",
    icon: Path,
    color: "bg-secondary text-secondary-foreground",
  },
  {
    path: "/mi-proceso/progreso",
    label: "Mi progreso",
    desc: "Estadísticas y evolución",
    icon: ChartLineUp,
    color: "bg-primary/10 text-foreground",
  },
  {
    path: "/mi-proceso/medicacion",
    label: "Medicación",
    desc: "Registro de tomas y efectos",
    icon: Pill,
    color: "bg-mood-3/20 text-foreground",
  },
  {
    path: "/mi-proceso/espejo",
    label: "El Espejo",
    desc: "Reflexión semanal con IA",
    icon: MagicWand,
    color: "bg-accent/10 text-foreground",
  },
];

export default function MiProceso() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <h1 className="mb-2 font-display text-xl font-semibold">Mi Proceso</h1>
      <p className="mb-6 text-sm text-muted-foreground">Tu evolución y herramientas de evaluación.</p>

      <div className="space-y-3">
        {items.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => navigate(item.path)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition-colors active:bg-muted"
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${item.color}`}>
                <Icon size={22} weight="duotone" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-medium">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
