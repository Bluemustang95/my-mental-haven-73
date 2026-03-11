import { useLocation, useNavigate } from "react-router-dom";
import { House, Wind, ChatCircle, User } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

const tabs = [
  { path: "/", label: "Inicio", icon: House },
  { path: "/respiracion", label: "Respiración", icon: Wind },
  { path: "/resmita", label: "Resmita", icon: ChatCircle },
  { path: "/perfil", label: "Perfil", icon: User },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-card/95 backdrop-blur-md safe-area-bottom">
      <div className="flex h-16 items-center justify-around px-2">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className={cn(
                "flex flex-col items-center gap-0.5 px-3 py-1 transition-colors font-display text-[10px] tracking-wide uppercase",
                isActive
                  ? "text-accent-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon
                size={22}
                weight={isActive ? "fill" : "regular"}
                className={cn(isActive && "text-accent")}
              />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
