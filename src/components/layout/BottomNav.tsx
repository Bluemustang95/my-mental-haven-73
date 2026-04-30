import { useLocation, useNavigate } from "react-router-dom";
import { Home, BookOpen, Sparkles, LineChart, MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useState } from "react";

const leftTabs = [
  { path: "/", label: "Inicio", icon: Home },
  { path: "/mi-proceso", label: "Proceso", icon: LineChart },
];

const rightTabs = [
  { path: "/diario", label: "Diario", icon: BookOpen },
  { path: "/herramientas", label: "Recursos", icon: Sparkles },
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
          "relative flex flex-1 items-center justify-center transition-colors",
          shrunk ? "h-10" : "h-12",
          active ? "text-foreground" : "text-muted-foreground/80"
        )}
      >
        <motion.div
          animate={active ? { y: -1, scale: 1.05 } : { y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 22 }}
          className="flex items-center justify-center"
        >
          <Icon
            size={shrunk ? 20 : 22}
            strokeWidth={active ? 2.25 : 1.75}
            className={cn(active && "text-accent-foreground")}
          />
        </motion.div>
        {active && (
          <motion.span
            layoutId="nav-active-dot"
            className="absolute bottom-1 h-1 w-1 rounded-full bg-accent"
            transition={{ type: "spring", stiffness: 400, damping: 28 }}
          />
        )}
      </motion.button>
    );
  };

  const resmitaActive = location.pathname === "/resmita";

  return (
    <motion.nav
      animate={
        shrunk
          ? { scale: 0.85, y: 6, width: "70%" }
          : { scale: 1, y: 0, width: "100%" }
      }
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      style={{ originY: 1 }}
      className="fixed bottom-4 left-1/2 z-40 mx-auto max-w-md -translate-x-1/2 px-4"
    >
      <div
        className={cn(
          "flex items-center rounded-full border border-black/5 bg-white/10 px-2 shadow-[0_8px_32px_-8px_rgba(15,23,42,0.18)] backdrop-blur-2xl transition-all dark:border-white/10 dark:bg-white/5",
          shrunk ? "py-1" : "py-1.5"
        )}
      >
        {/* Left side */}
        <div className="flex flex-1 items-center justify-around">
          {leftTabs.map(renderTab)}
        </div>

        {/* Center – Resmita FAB */}
        <div className="flex shrink-0 items-center justify-center px-1">
          <motion.button
            onClick={() => navigate("/resmita")}
            whileTap={{ scale: 0.9 }}
            aria-label="Resmita"
            animate={resmitaActive ? { scale: 1.06 } : { scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 20 }}
            className={cn(
              "relative -mt-5 flex items-center justify-center rounded-full border-2 shadow-[0_6px_20px_-4px_hsl(42_94%_55%/0.45)] transition-all",
              shrunk ? "h-11 w-11" : "h-13 w-13",
              "border-[hsl(38_85%_48%)] bg-[hsl(48_100%_78%)] text-[hsl(28_60%_22%)]"
            )}
            style={{
              width: shrunk ? 44 : 52,
              height: shrunk ? 44 : 52,
            }}
          >
            <MessageCircle
              size={shrunk ? 20 : 24}
              strokeWidth={2.25}
              fill={resmitaActive ? "currentColor" : "none"}
            />
          </motion.button>
        </div>

        {/* Right side */}
        <div className="flex flex-1 items-center justify-around">
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </motion.nav>
  );
}
