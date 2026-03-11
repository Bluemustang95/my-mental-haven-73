import { useLocation, useNavigate } from "react-router-dom";
import { House, Toolbox, ChartBar, ChatCircle, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Inicio", icon: House },
  { path: "/herramientas", label: "Herramientas", icon: Toolbox },
  { path: "/tests", label: "Tests", icon: ChartBar },
  { path: "/resmita", label: "Resmita", icon: ChatCircle },
  { path: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-1">
        {tabs.map((tab) => {
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
