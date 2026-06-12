import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-[#0B0B10]">
      <Outlet />
      <BottomNav />
    </div>
  );
}
