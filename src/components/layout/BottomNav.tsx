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
          "flex h-9 w-9 items-center justify-center rounded-full transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <motion.div
          animate={active ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon
            size={20}
            weight={active ? "fill" : "regular"}
            className={cn(active && "text-accent")}
          />
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
        className="pointer-events-auto flex items-center justify-center gap-0.5 rounded-full border border-border/40 bg-card/75 px-2 py-1 shadow-lg backdrop-blur-xl"
        style={{ maxWidth: "calc(100vw - 2rem)" }}
      >
        {leftTabs.map(renderTab)}

        {/* Center: Psicoeducación */}
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
              "flex h-11 w-11 items-center justify-center rounded-full border-2 shadow-md transition-colors",
              "bg-[hsl(48_100%_85%)] border-[hsl(38_85%_55%)] text-[hsl(28_70%_30%)]",
              psicoActive && "ring-2 ring-[hsl(38_85%_55%)]/40"
            )}
          >
            <BookOpen size={22} weight={psicoActive ? "fill" : "bold"} />
          </motion.div>
        </motion.button>

        {rightTabs.map(renderTab)}
      </div>
    </nav>
  );
}
