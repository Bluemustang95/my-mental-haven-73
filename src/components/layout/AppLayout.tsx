import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AmbientGlows } from "./AmbientGlows";

export function AppLayout() {
  return (
    <div className="relative min-h-screen bg-background">
      <AmbientGlows />
      <div className="relative">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
}
