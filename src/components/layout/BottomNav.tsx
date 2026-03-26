import { useLocation, useNavigate } from "react-router-dom";
import { House, Notebook, Toolbox, ChartLineUp, ChatCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Inicio", icon: House },
  { path: "/diario", label: "Diario", icon: Notebook },
  { path: "__resmita__", label: "", icon: ChatCircle },
  { path: "/herramientas", label: "Herramientas", icon: Toolbox },
  { path: "/mi-proceso", label: "Mi Proceso", icon: ChartLineUp },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    if (path === "__resmita__") return location.pathname === "/resmita";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-1">
        {tabs.map((tab) => {
          if (tab.path === "__resmita__") {
            const active = location.pathname === "/resmita";
            return (
              <button
                key="resmita"
                onClick={() => navigate("/resmita")}
                className="relative -mt-6 flex flex-col items-center"
              >
                <div
                  className={cn(
                    "flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95",
                    active
                      ? "bg-accent text-accent-foreground"
                      : "bg-accent/90 text-accent-foreground"
                  )}
                >
                  <ChatCircle size={26} weight={active ? "fill" : "bold"} />
                </div>
                <span className="mt-0.5 font-display text-[9px] tracking-wide uppercase text-muted-foreground">
                  Resmita
                </span>
              </button>
            );
          }

          const active = isActive(tab.path);
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 transition-colors font-display text-[9px] tracking-wide uppercase",
                active ? "text-accent-foreground" : "text-muted-foreground"
              )}
            >
              <Icon
                size={20}
                weight={active ? "fill" : "regular"}
                className={cn(active && "text-accent")}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
