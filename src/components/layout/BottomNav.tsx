import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, BookOpen, Lifebuoy, Sparkle, X } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { useUiChrome } from "@/hooks/useUiChrome";
import { useState } from "react";
import { AnimatePresence } from "framer-motion";
import resmitaAssetJson from "@/assets/resmita-bot.png.asset.json";

const resmitaAvatar = resmitaAssetJson.url;

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
  const [dialOpen, setDialOpen] = useState(false);
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
        layout
        className={cn(
          "flex min-w-10 flex-col items-center justify-center gap-0.5 rounded-2xl px-2 transition-colors",
          active
            ? "bg-white py-1.5 text-primary shadow-sm"
            : "h-10 w-10 text-white/90 drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]"
        )}
      >
        <motion.div
          animate={active ? { scale: 1.05 } : { scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
        >
          <Icon size={22} weight={active ? "fill" : "bold"} />
        </motion.div>
        {active && (
          <motion.span
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display text-[9px] font-bold leading-none tracking-wide"
          >
            {tab.label}
          </motion.span>
        )}
      </motion.button>
    );
  };


  const psicoActive = location.pathname.startsWith("/psicoeducacion");
  const sosActive = location.pathname.startsWith("/herramientas/plan-seguridad");
  // Ocultar botón rojo SOS en mindfulness (pedido del usuario)
  const hideSos =
    location.pathname.startsWith("/mindfulness") ||
    location.pathname.startsWith("/herramientas/mindfulness");

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

      {/* Speed dial: Resmita + Plan de seguridad juntos */}
      {!hideSos && (
        <>
          <AnimatePresence>
            {dialOpen && (
              <motion.button
                aria-label="Cerrar accesos"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setDialOpen(false)}
                className="fixed inset-0 z-[49] bg-black/20 backdrop-blur-[2px]"
              />
            )}
          </AnimatePresence>

          <div
            className="flex flex-col items-end gap-2.5"
            style={{
              position: "fixed",
              right: "max(1rem, env(safe-area-inset-right))",
              // Alineado con el centro vertical de la barra de navegación.
              bottom: "calc(max(1rem, env(safe-area-inset-bottom)) + 0.375rem)",
              zIndex: 51,
            }}
          >
            <AnimatePresence>
              {dialOpen && (
                <>
                  <motion.button
                    key="resmita"
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.04 } }}
                    exit={{ opacity: 0, y: 8, scale: 0.85 }}
                    onClick={() => {
                      setDialOpen(false);
                      window.dispatchEvent(new CustomEvent("open-resmita"));
                    }}
                    aria-label="Hablar con Resmita"
                    className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border border-white/30 bg-[#facb60] shadow-[0_10px_24px_-8px_rgba(250,203,96,0.6)] active:scale-95"
                  >
                    <img src={resmitaAvatar} alt="Resmita" className="h-11 w-11 object-contain" />
                  </motion.button>

                  <motion.button
                    key="sos"
                    initial={{ opacity: 0, y: 10, scale: 0.85 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.85 }}
                    onClick={() => {
                      setDialOpen(false);
                      navigate("/herramientas/plan-seguridad");
                    }}
                    aria-label="Plan de seguridad"
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-full border border-white/30 text-white shadow-[0_10px_24px_-8px_rgba(220,38,38,0.55)]",
                      sosActive ? "bg-red-600" : "bg-red-500/95"
                    )}
                  >
                    <Lifebuoy size={22} weight={sosActive ? "fill" : "bold"} />
                  </motion.button>
                </>
              )}
            </AnimatePresence>

            <motion.button
              onClick={() => setDialOpen((v) => !v)}
              whileTap={{ scale: 0.85 }}
              aria-label={dialOpen ? "Cerrar accesos rápidos" : "Abrir accesos rápidos"}
              className="flex h-12 w-12 items-center justify-center rounded-full border border-white/50 text-white shadow-[0_14px_30px_-14px_rgba(124,194,200,0.8)]"
              style={{ background: "linear-gradient(155deg, #7cc2c8 0%, #5aa7ae 100%)" }}
            >
              <motion.span animate={{ rotate: dialOpen ? 90 : 0 }} transition={{ duration: 0.2 }}>
                {dialOpen ? <X size={20} weight="bold" /> : <Sparkle size={20} weight="fill" />}
              </motion.span>
            </motion.button>
          </div>
        </>
      )}

    </>
  );
}

