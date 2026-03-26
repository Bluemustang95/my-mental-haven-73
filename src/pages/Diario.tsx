import { useNavigate } from "react-router-dom";
import {
  Heart, PencilSimple, Clock, UsersThree, EnvelopeSimple,
  Notepad, Trophy, ChatCircleDots, Brain, Moon, Flag,
} from "@phosphor-icons/react";
import { motion } from "framer-motion";
import TusHuellas from "@/components/journal/TusHuellas";

const quickAccess = [
  { path: "/diario/checkin", label: "Check-in rápido", icon: Heart, color: "bg-[hsl(0,60%,94%)] text-destructive" },
  { path: "/diario/dia", label: "Línea del día", icon: Clock, color: "bg-secondary text-secondary-foreground" },
  { path: "/diario/vinculos", label: "Vínculos", icon: UsersThree, color: "bg-primary/10 text-foreground" },
  { path: "/diario/objetivos", label: "Mis objetivos", icon: Flag, color: "bg-accent/15 text-accent-foreground" },
];

const explorationTools = [
  { path: "/diario/cartas", label: "Cartas que no voy a enviar", icon: EnvelopeSimple, color: "text-destructive" },
  { path: "/diario/terapia", label: "Notas para terapia", icon: Notepad, color: "text-accent-foreground" },
  { path: "/diario/logros", label: "Micro-logros", icon: Trophy, color: "text-accent-foreground" },
  { path: "/diario/dialogo", label: "Diálogo interno", icon: ChatCircleDots, color: "text-secondary-foreground" },
  { path: "/diario/suenos", label: "Registro de sueños", icon: Moon, color: "text-primary" },
  { path: "/diario/pensamientos", label: "Registro de pensamientos", icon: Brain, color: "text-foreground" },
];

export default function Diario() {
  const navigate = useNavigate();

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      {/* ── Header ── */}
      <h1 className="mb-1 font-display text-xl font-semibold">Diario</h1>
      <p className="mb-6 text-sm text-muted-foreground">Tu espacio seguro de introspección.</p>

      {/* ── Primary: Escritura Libre ── */}
      <motion.button
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => navigate("/diario/escribir")}
        className="mb-6 flex w-full flex-col items-start rounded-3xl bg-accent/10 p-5 text-left shadow-[0_2px_12px_-4px_hsl(var(--accent)/0.15)] transition-shadow active:shadow-none"
      >
        <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-accent/20">
          <PencilSimple size={22} weight="duotone" className="text-accent-foreground" />
        </div>
        <p className="font-display text-base font-semibold">Escritura libre</p>
        <p className="mt-1 text-sm text-muted-foreground">Escribí lo que necesites soltar...</p>
      </motion.button>

      {/* ── Tus Huellas ── */}
      <TusHuellas />

      {/* ── Quick Access 2×2 Grid ── */}
      <div className="mb-6 grid grid-cols-2 gap-3">
        {quickAccess.map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.button
              key={item.path}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 + i * 0.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(item.path)}
              className="flex flex-col items-start rounded-3xl bg-card p-4 text-left shadow-[0_1px_8px_-3px_hsl(var(--foreground)/0.06)] transition-shadow active:shadow-none"
            >
              <div className={`mb-2.5 flex h-9 w-9 items-center justify-center rounded-xl ${item.color}`}>
                <Icon size={20} weight="duotone" />
              </div>
              <p className="font-display text-[13px] font-medium leading-tight">{item.label}</p>
            </motion.button>
          );
        })}
      </div>

      {/* ── Exploration Tools ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
      >
        <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Herramientas de Exploración
        </h2>
        <div className="grid grid-cols-2 gap-2.5">
          {explorationTools.map((item, i) => {
            const Icon = item.icon;
            return (
              <motion.button
                key={item.path}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.035 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => navigate(item.path)}
                className="flex items-center gap-2.5 rounded-2xl bg-card p-3 text-left shadow-[0_1px_6px_-2px_hsl(var(--foreground)/0.05)] transition-shadow active:shadow-none"
              >
                <Icon size={18} weight="duotone" className={item.color} />
                <p className="font-display text-[12px] font-medium leading-tight">{item.label}</p>
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
