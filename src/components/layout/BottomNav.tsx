import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
      <button
        key={tab.path}
        onClick={() => navigate(tab.path)}
        className={cn(
          "flex flex-1 flex-col items-center gap-0.5 py-1 transition-colors font-display text-[9px] sm:text-[10px] tracking-wide uppercase min-w-0",
          active ? "text-accent-foreground" : "text-muted-foreground"
        )}
      >
        <Icon
          size={20}
          weight={active ? "fill" : "regular"}
          className={cn(active && "text-accent")}
        />
        <span className="truncate max-w-full">{tab.label}</span>
      </button>
    );
  };

  const resmitaActive = location.pathname === "/resmita";

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex h-16 items-center px-1">
        {/* Left side */}
        <div className="flex flex-1 justify-around">
          {leftTabs.map(renderTab)}
        </div>

        {/* Center – Resmita FAB */}
        <div className="flex w-16 shrink-0 items-center justify-center">
          <button
            onClick={() => navigate("/resmita")}
            className="relative -mt-6 flex flex-col items-center"
          >
            <div
              className={cn(
                "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                resmitaActive
                  ? "bg-accent text-accent-foreground"
                  : "bg-accent/90 text-accent-foreground"
              )}
            >
              <ChatCircle size={26} weight={resmitaActive ? "fill" : "bold"} />
            </div>
            <span className="mt-0.5 font-display text-[9px] sm:text-[10px] tracking-wide uppercase text-muted-foreground">
              Resmita
            </span>
          </button>
        </div>

        {/* Right side */}
        <div className="flex flex-1 justify-around">
          {rightTabs.map(renderTab)}
        </div>
      </div>
    </nav>
  );
}
