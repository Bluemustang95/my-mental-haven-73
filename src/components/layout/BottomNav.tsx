import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
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
        aria-label={tab.label}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-full transition-colors",
          active ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <motion.div
          animate={active ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon
            size={22}
            weight={active ? "fill" : "regular"}
            className={cn(active && "text-accent")}
          />
        </motion.div>
      </motion.button>
    );
  };

  const resmitaActive = location.pathname === "/resmita";

  return (
    <motion.nav
      animate={shrunk ? { scale: 0.94, y: 4 } : { scale: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      style={{
        position: "fixed",
        bottom: "2rem",
        left: "50%",
        transform: "translateX(-50%)",
        zIndex: 50,
        width: "fit-content",
      }}
    >
      <div className="mx-auto flex w-fit items-center justify-center gap-1 rounded-full border border-border/40 bg-card/70 px-3 py-1.5 shadow-lg backdrop-blur-xl">
        {/* Left side */}
        <div className="flex flex-1 items-center justify-around gap-1">
          {leftTabs.map(renderTab)}
        </div>

        {/* Center – Resmita FAB */}
        <div className="flex w-14 shrink-0 items-center justify-center">
          <motion.button
            onClick={() => navigate("/resmita")}
            whileTap={{ scale: 0.9 }}
            aria-label="Resmita"
            className="relative -mt-5 flex items-center justify-center"
          >
            <motion.div
              animate={resmitaActive ? { scale: 1.08 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
              className={cn(
                "flex h-12 w-12 items-center justify-center rounded-full border-2 shadow-md transition-colors",
                "bg-[hsl(48_100%_85%)] border-[hsl(38_85%_55%)] text-[hsl(28_70%_30%)]",
                resmitaActive && "ring-2 ring-[hsl(38_85%_55%)]/40"
              )}
            >
              <ChatCircle size={24} weight={resmitaActive ? "fill" : "bold"} />
            </motion.div>
          </motion.button>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-around gap-1">
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </motion.nav>
  );
}
