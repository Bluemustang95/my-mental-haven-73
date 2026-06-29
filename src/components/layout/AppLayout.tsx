import { Outlet, useLocation } from "react-router-dom";
import { BottomNav } from "./BottomNav";
import { AmbientGlows } from "./AmbientGlows";
import { CrisisButton } from "@/components/CrisisButton";
import { NotificationRunner } from "@/components/system/NotificationRunner";

// Routes where the global CrisisButton should appear.
// Sensitive modules: tests, journal, regulation, thoughts, sleep, safety plan, my-process.
const CRISIS_ROUTES = [
  "/tests",
  "/diario",
  "/diario-inteligente",
  "/herramientas/pensamientos",
  "/herramientas/sueno",
  "/herramientas/plan-seguridad",
  "/mi-proceso",
];

export function AppLayout() {
  const { pathname } = useLocation();
  const showCrisis = CRISIS_ROUTES.some((p) => pathname.startsWith(p));

  return (
    <div className="relative min-h-screen bg-background">
      <AmbientGlows />
      <NotificationRunner />
      <div className="relative">
        <Outlet />
      </div>
      {showCrisis && <CrisisButton />}
      <BottomNav />
    </div>
  );
}
