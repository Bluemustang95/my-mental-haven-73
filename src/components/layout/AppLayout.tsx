import { Outlet } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { CrisisButton } from "../CrisisButton";

export function AppLayout() {
  return (
    <div className="min-h-screen bg-background pb-20">
      <Outlet />
      <CrisisButton />
      <BottomNav />
    </div>
  );
}
