import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, BookOpen, Lifebuoy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useState } from "react";
import { CrisisSheet } from "@/components/CrisisButton";

const leftTabs = [
  { path: "/", label: "Inicio", icon: House },
  { path: "/mi-proceso", label: "Proceso", icon: ChartLineUp },
];

const rightTabs = [
  { path: "/diario", label: "Diario", icon: Notebook },
  { path: "/herramientas", label: "Recursos", icon: Toolbox },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [crisisOpen, setCrisisOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  const renderTab = (tab: { path: string; label: string; icon: React.ElementType }) => {
    const active = isActive(tab.path);
    const Icon = tab.icon;
    return (
      <motion.button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        whileTap={{ scale: 0.85, opacity: 0.7 }}
        aria-label={tab.label}
        className={cn(
          "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          active ? "text-foreground" : "text-white/70"
        )}
      >
        <motion.div
          animate={active ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon size={20} weight={active ? "fill" : "regular"} />
        </motion.div>
      </motion.button>
    );
  };

  const psicoActive = location.pathname.startsWith("/psicoeducacion");

  return (
    <nav
      style={{
        position: "fixed",
        bottom: "max(1rem, env(safe-area-inset-bottom))",
        left: 0,
        right: 0,
        zIndex: 50,
        display: "flex",
        justifyContent: "center",
        pointerEvents: "none",
      }}
    >
      <div
        className="pointer-events-auto mx-4 flex items-center justify-center gap-0.5 rounded-[28px] border border-white/20 bg-primary/95 px-2 py-1.5 shadow-primary-glow backdrop-blur-3xl"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        {leftTabs.map(renderTab)}

        <motion.button
          onClick={() => navigate("/psicoeducacion")}
          whileTap={{ scale: 0.9 }}
          aria-label="Psicoeducación"
          className="relative -mt-4 mx-0.5 flex items-center justify-center"
        >
          <motion.div
            animate={psicoActive ? { scale: 1.08 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full border-2 border-white shadow-primary-glow transition-colors",
              psicoActive
                ? "bg-foreground text-primary ring-2 ring-white/40"
                : "bg-primary text-foreground"
            )}
          >
            <BookOpen size={20} weight={psicoActive ? "fill" : "bold"} />
          </motion.div>
        </motion.button>

        {rightTabs.map(renderTab)}

        {/* Crisis / SOS — subtle red, expands on tap */}
        <motion.button
          onClick={() => setCrisisOpen(true)}
          whileTap={{ scale: 0.85 }}
          aria-label="Línea de crisis"
          className={cn(
            "ml-0.5 flex h-9 w-9 items-center justify-center rounded-full transition-colors",
            crisisOpen
              ? "bg-red-500 text-white"
              : "bg-red-500/15 text-red-300 hover:bg-red-500/25"
          )}
        >
          <Lifebuoy size={18} weight={crisisOpen ? "fill" : "regular"} />
        </motion.button>
      </div>
      <CrisisSheet open={crisisOpen} onClose={() => setCrisisOpen(false)} />
    </nav>
  );
}

