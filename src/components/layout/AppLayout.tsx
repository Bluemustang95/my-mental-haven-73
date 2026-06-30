import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AmbientGlows } from "./AmbientGlows";
import { NotificationRunner } from "@/components/system/NotificationRunner";

export function AppLayout() {
  const { pathname } = useLocation();

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientGlows />
      <NotificationRunner />
      <div key={pathname} className="relative route-fade-in">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}

