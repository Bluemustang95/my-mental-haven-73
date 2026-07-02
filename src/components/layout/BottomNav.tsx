import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, BookOpen, Lifebuoy } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUiChrome } from "@/hooks/useUiChrome";

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
  const { bottomNavHidden } = useUiChrome();
  if (bottomNavHidden) return null;

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
          active
            ? "bg-white text-primary shadow-sm"
            : "text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        )}
      >
        <motion.div
          animate={active ? { scale: 1.1 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon size={22} weight={active ? "fill" : "bold"} />
        </motion.div>
      </motion.button>
    );
  };

  const psicoActive = location.pathname.startsWith("/psicoeducacion");
  const sosActive = location.pathname.startsWith("/herramientas/plan-seguridad");

  return (
    <>
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
          className="pointer-events-auto mx-4 flex items-center justify-center gap-1 rounded-[32px] border border-white/20 bg-primary/85 supports-[backdrop-filter]:bg-primary/70 px-3 py-2.5 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.35)] backdrop-blur-2xl"
          style={{ maxWidth: "calc(100vw - 5rem)" }}
        >
          {leftTabs.map(renderTab)}

          <motion.button
            onClick={() => navigate("/psicoeducacion")}
            whileTap={{ scale: 0.85, opacity: 0.7 }}
            aria-label="Psicoeducación"
            className={cn(
              "flex h-10 w-10 items-center justify-center rounded-full transition-colors",
              psicoActive
                ? "bg-white text-primary shadow-sm"
                : "text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
            )}
          >
            <motion.div
              animate={psicoActive ? { scale: 1.1 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 20 }}
            >
              <BookOpen size={22} weight={psicoActive ? "fill" : "bold"} />
            </motion.div>
          </motion.button>

          {rightTabs.map(renderTab)}
        </div>
      </nav>

      {/* Floating SOS button — own fixed layer so it never shifts */}
      <motion.button
        onClick={() => navigate("/herramientas/plan-seguridad")}
        whileTap={{ scale: 0.85 }}
        aria-label="Plan de seguridad"
        className={cn(
          "flex h-12 w-12 items-center justify-center rounded-full border border-white/30 backdrop-blur-xl shadow-[0_10px_24px_-8px_rgba(220,38,38,0.55)] transition-colors",
          sosActive ? "bg-red-600 text-white" : "bg-red-500/95 text-white"
        )}
        style={{
          position: "fixed",
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: "max(1.35rem, calc(env(safe-area-inset-bottom) + 0.35rem))",
          zIndex: 51,
        }}
      >
        <Lifebuoy size={22} weight={sosActive ? "fill" : "bold"} />
      </motion.button>
    </>
  );
}

