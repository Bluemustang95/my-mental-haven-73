import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, useMotionValueEvent, useScroll, AnimatePresence } from "framer-motion";
import { useState } from "react";

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
  const { scrollY } = useScroll();
  const [shrunk, setShrunk] = useState(false);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setShrunk(latest > 30);
  });

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
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors font-display text-[9px] sm:text-[10px] tracking-wide uppercase min-w-0",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <motion.div
          animate={active ? { y: -2 } : { y: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon
            size={20}
            weight={active ? "fill" : "regular"}
            className={cn(active && "text-accent")}
          />
        </motion.div>
        <AnimatePresence>
          {!shrunk && (
            <motion.span
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="truncate max-w-full"
            >
              {tab.label}
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    );
  };

  const resmitaActive = location.pathname === "/resmita";

  return (
    <motion.nav
      animate={shrunk ? { scale: 0.92, y: 4 } : { scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="fixed bottom-4 left-4 right-4 z-40 mx-auto max-w-md"
    >
      <div className="flex items-center rounded-full border border-border/40 bg-card/70 backdrop-blur-xl shadow-lg px-2">
        {/* Left side */}
        <div className="flex flex-1 justify-around">
          {leftTabs.map(renderTab)}
        </div>

        {/* Center – Resmita FAB */}
        <div className="flex w-16 shrink-0 items-center justify-center">
          <motion.button
            onClick={() => navigate("/resmita")}
            whileTap={{ scale: 0.9 }}
            className="relative -mt-5 flex flex-col items-center"
          >
            <motion.div
              animate={resmitaActive ? { scale: 1.08 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "flex h-13 w-13 items-center justify-center rounded-full shadow-md transition-colors",
                resmitaActive
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/90 text-accent-foreground"
              )}
            >
              <ChatCircle size={24} weight={resmitaActive ? "fill" : "bold"} />
            </motion.div>
            <AnimatePresence>
              {!shrunk && (
                <motion.span
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-0.5 font-display text-[9px] sm:text-[10px] tracking-wide uppercase text-muted-foreground"
                >
                  Resmita
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        {/* Right side */}
        <div className="flex flex-1 justify-around">
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </motion.nav>
  );
}
