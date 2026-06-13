import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, BookOpen } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

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
          "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
          active ? "text-foreground" : "text-white/70"
        )}
      >
        <motion.div
          animate={active ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon size={22} weight={active ? "fill" : "regular"} />
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
        className="pointer-events-auto mx-4 flex items-center justify-center gap-1 rounded-[32px] border border-white/20 bg-primary/95 px-3 py-2 shadow-primary-glow backdrop-blur-3xl"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        {leftTabs.map(renderTab)}

        <motion.button
          onClick={() => navigate("/psicoeducacion")}
          whileTap={{ scale: 0.9 }}
          aria-label="Psicoeducación"
          className="relative -mt-5 mx-1 flex items-center justify-center"
        >
          <motion.div
            animate={psicoActive ? { scale: 1.08 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-lg transition-colors",
              psicoActive
                ? "bg-gradient-to-br from-[hsl(28_95%_60%)] to-[hsl(40_100%_85%)] border-white text-white ring-2 ring-white/40"
                : "bg-gradient-to-br from-[hsl(38_90%_70%)] to-[hsl(40_100%_90%)] border-white text-[hsl(28_70%_25%)]"
            )}
          >
            <BookOpen size={24} weight={psicoActive ? "fill" : "bold"} />
          </motion.div>
        </motion.button>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
