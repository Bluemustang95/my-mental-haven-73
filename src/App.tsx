import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import Breathing from "@/pages/Breathing";
import Resmita from "@/pages/Resmita";
import Profile from "@/pages/Profile";
import Onboarding from "@/pages/Onboarding";
import Tools from "@/pages/Tools";
import Journal from "@/pages/Journal";
import ThoughtRecord from "@/pages/ThoughtRecord";
import DreamLog from "@/pages/DreamLog";
import Grounding from "@/pages/Grounding";
import Mindfulness from "@/pages/Mindfulness";
import Tests from "@/pages/Tests";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/onboarding" element={<Onboarding />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/herramientas" element={<Tools />} />
            <Route path="/herramientas/respiracion" element={<Breathing />} />
            <Route path="/herramientas/journal" element={<Journal />} />
            <Route path="/herramientas/pensamientos" element={<ThoughtRecord />} />
            <Route path="/herramientas/suenos" element={<DreamLog />} />
            <Route path="/herramientas/grounding" element={<Grounding />} />
            <Route path="/herramientas/mindfulness" element={<Mindfulness />} />
            <Route path="/tests" element={<Tests />} />
            <Route path="/resmita" element={<Resmita />} />
            <Route path="/perfil" element={<Profile />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
