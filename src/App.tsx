import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { AppLayout } from "@/components/layout/AppLayout";
import Dashboard from "@/pages/Dashboard";
import CalendarMonth from "@/pages/CalendarMonth";
import CalendarDay from "@/pages/CalendarDay";

import Resmita from "@/pages/Resmita";
import Profile from "@/pages/Profile";
import Onboarding from "@/pages/Onboarding";
import Tools from "@/pages/Tools";
import Diario from "@/pages/Diario";
import MiProceso from "@/pages/MiProceso";
import DiarioHistory from "@/pages/DiarioHistory";
import ResumenPsico from "@/pages/ResumenPsico";
import AllTests from "@/pages/AllTests";
import JournalCheckin from "@/components/journal/JournalCheckin";
import CheckinHistory from "@/pages/CheckinHistory";
import JournalEntry from "@/components/journal/JournalEntry";
import DayTimeline from "@/components/journal/DayTimeline";
import RelationshipLog from "@/components/journal/RelationshipLog";
import UnsentLetters from "@/components/journal/UnsentLetters";
import TherapyNotes from "@/components/journal/TherapyNotes";
import MicroAchievements from "@/components/journal/MicroAchievements";
import InternalDialogue from "@/components/journal/InternalDialogue";
import JournalTimeline from "@/components/journal/JournalTimeline";
import DiarioHuellas from "@/pages/DiarioHuellas";
import ThoughtRecord from "@/pages/ThoughtRecord";
import DreamLog from "@/pages/DreamLog";
import DiarioTools from "@/pages/DiarioTools";
import Grounding from "@/pages/Grounding";
import MindfulnessHub from "@/pages/mindfulness/MindfulnessHub";
import BreathingHome from "@/pages/mindfulness/BreathingHome";
import ObservarHome from "@/pages/mindfulness/ObservarHome";
import DescribirHome from "@/pages/mindfulness/DescribirHome";
import ContentLibrary from "@/pages/ContentLibrary";
import PsicoFactos from "@/pages/PsicoFactos";
import Tests from "@/pages/Tests";
import Progress from "@/pages/Progress";
import SessionNotes from "@/pages/SessionNotes";
import Auth from "@/pages/Auth";
import ResetPassword from "@/pages/ResetPassword";
import TreatmentRequest from "@/pages/TreatmentRequest";
import LinkProfessional from "@/pages/LinkProfessional";
import Favorites from "@/pages/Favorites";
import SelfCare from "@/pages/SelfCare";
import Sleep from "@/pages/Sleep";
import Rumination from "@/pages/Rumination";
import Recovery from "@/pages/Recovery";
import EmotionalRegulation from "@/pages/EmotionalRegulation";
import MindfulEating from "@/pages/MindfulEating";
import MyValues from "@/pages/MyValues";
import MedicationTracker from "@/pages/MedicationTracker";
import MedLibrary from "@/pages/MedLibrary";
import MedCategoryList from "@/pages/MedCategoryList";
import MedDrugDetail from "@/pages/MedDrugDetail";
import WeeklyReflection from "@/pages/WeeklyReflection";
import WeeklyGoalsPage from "@/pages/WeeklyGoalsPage";
import InternalDialogueHistory from "@/pages/InternalDialogueHistory";
import RelationshipLogHistory from "@/pages/RelationshipLogHistory";
import UnsentLettersHistory from "@/pages/UnsentLettersHistory";
import MicroAchievementsHistory from "@/pages/MicroAchievementsHistory";
import WeeklyGoalsHistory from "@/pages/WeeklyGoalsHistory";
import NotFound from "@/pages/NotFound";
import { AdminRoute } from "@/components/admin/AdminRoute";
import { AdminLayout } from "@/components/admin/AdminLayout";
import AdminDashboard from "@/pages/admin/AdminDashboard";
import ContentManager from "@/pages/admin/ContentManager";
import TreatmentRequests from "@/pages/admin/TreatmentRequests";
import PatientList from "@/pages/admin/PatientList";
import PatientDetail from "@/pages/admin/PatientDetail";
import ResourcesManager from "@/pages/admin/ResourcesManager";
import ResourceDetail from "@/pages/admin/ResourceDetail";
import QuestionnaireManager from "@/pages/admin/QuestionnaireManager";
import ResourceTools from "@/pages/ResourceTools";
import ResourceIntro from "@/pages/ResourceIntro";
import SafetyPlan from "@/pages/SafetyPlan";
import Questionnaire from "@/pages/Questionnaire";
import Settings from "@/pages/Settings";
import SettingsHistory from "@/pages/SettingsHistory";
import DiarioInteligente from "@/pages/DiarioInteligente";
import Psicoeducacion from "@/pages/Psicoeducacion";
import SystemSettings from "@/pages/admin/SystemSettings";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }
  if (!user) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/auth" element={<Auth />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/calendario" element={<ProtectedRoute><CalendarMonth /></ProtectedRoute>} />
            <Route path="/calendario/:date" element={<ProtectedRoute><CalendarDay /></ProtectedRoute>} />
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/cuestionario" element={<Questionnaire />} />
              <Route path="/configuracion" element={<Settings />} />
              <Route path="/configuracion/historial" element={<SettingsHistory />} />
              <Route path="/diario-inteligente/:slug" element={<DiarioInteligente />} />
              <Route path="/psicoeducacion" element={<Psicoeducacion />} />

              {/* Diario (tab 2) */}
              <Route path="/diario" element={<Diario />} />
              <Route path="/diario/historial" element={<DiarioHistory />} />
              <Route path="/diario/checkin" element={<JournalCheckin />} />
              <Route path="/diario/checkin/historial" element={<CheckinHistory />} />
              <Route path="/diario/escribir" element={<JournalEntry />} />
              <Route path="/diario/dia" element={<DayTimeline />} />
              <Route path="/diario/vinculos" element={<RelationshipLog />} />
              <Route path="/diario/objetivos" element={<WeeklyGoalsPage />} />
              <Route path="/diario/cartas" element={<UnsentLetters />} />
              <Route path="/diario/logros" element={<MicroAchievements />} />
              <Route path="/diario/dialogo" element={<InternalDialogue />} />
              <Route path="/diario/dialogo/historial" element={<InternalDialogueHistory />} />
              <Route path="/diario/vinculos/historial" element={<RelationshipLogHistory />} />
              <Route path="/diario/cartas/historial" element={<UnsentLettersHistory />} />
              <Route path="/diario/logros/historial" element={<MicroAchievementsHistory />} />
              <Route path="/diario/objetivos/historial" element={<WeeklyGoalsHistory />} />
              <Route path="/diario/pensamientos" element={<ThoughtRecord />} />
              <Route path="/diario/suenos" element={<DreamLog />} />
              <Route path="/diario/herramientas" element={<DiarioTools />} />
              <Route path="/diario/huellas" element={<DiarioHuellas />} />
              <Route path="/diario/sesiones" element={<SessionNotes />} />

              {/* Herramientas (tab 4) — only techniques */}
              <Route path="/herramientas" element={<Tools />} />
              <Route path="/herramientas/intro/:slug" element={<ResourceIntro />} />
              
              <Route path="/herramientas/grounding" element={<Grounding />} />
              <Route path="/herramientas/mindfulness" element={<MindfulnessHub />} />
              <Route path="/herramientas/mindfulness/respiracion" element={<BreathingHome />} />
              <Route path="/herramientas/mindfulness/observar" element={<ObservarHome />} />
              <Route path="/herramientas/mindfulness/describir" element={<DescribirHome />} />
              <Route path="/herramientas/contenido" element={<ContentLibrary />} />
              <Route path="/herramientas/contenido/psico-factos" element={<PsicoFactos />} />
              <Route path="/herramientas/favoritos" element={<Favorites />} />
              <Route path="/herramientas/autocuidado" element={<SelfCare />} />
              <Route path="/herramientas/sueno" element={<Sleep />} />
              <Route path="/herramientas/rumiacion" element={<Rumination />} />
              <Route path="/herramientas/recuperacion" element={<Recovery />} />
              <Route path="/herramientas/regulacion-emocional" element={<EmotionalRegulation />} />
              <Route path="/herramientas/alimentacion-consciente" element={<MindfulEating />} />
              <Route path="/herramientas/mis-valores" element={<MyValues />} />
              <Route path="/herramientas/plan-seguridad" element={<SafetyPlan />} />
              <Route path="/recursos/:slug" element={<ResourceTools />} />

              {/* Mi Proceso (tab 5) */}
              <Route path="/mi-proceso" element={<MiProceso />} />
              <Route path="/mi-proceso/tests" element={<Tests />} />
              <Route path="/mi-proceso/todos-tests" element={<AllTests />} />
              <Route path="/mi-proceso/terapia" element={<TherapyNotes />} />
              <Route path="/mi-proceso/linea-temporal" element={<JournalTimeline />} />
              <Route path="/mi-proceso/progreso" element={<Progress />} />
              <Route path="/mi-proceso/medicacion" element={<MedicationTracker />} />
              <Route path="/mi-proceso/medicacion/biblioteca" element={<MedLibrary />} />
              <Route path="/mi-proceso/medicacion/biblioteca/:categoryId" element={<MedCategoryList />} />
              <Route path="/mi-proceso/medicacion/biblioteca/:categoryId/:drugId" element={<MedDrugDetail />} />
              <Route path="/mi-proceso/espejo" element={<WeeklyReflection />} />
              <Route path="/mi-proceso/resumen" element={<ResumenPsico />} />

              {/* Resmita (center tab) */}
              <Route path="/resmita" element={<Resmita />} />

              {/* Profile (header icon, no tab) */}
              <Route path="/perfil" element={<Profile />} />
              <Route path="/tratamiento" element={<TreatmentRequest />} />
              <Route path="/vincular" element={<LinkProfessional />} />
            </Route>
            <Route element={<AdminRoute><AdminLayout /></AdminRoute>}>
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/contenido" element={<ContentManager />} />
              <Route path="/admin/recursos" element={<ResourcesManager />} />
              <Route path="/admin/recursos/:slug" element={<ResourceDetail />} />
              <Route path="/admin/solicitudes" element={<TreatmentRequests />} />
              <Route path="/admin/pacientes" element={<PatientList />} />
              <Route path="/admin/pacientes/:userId" element={<PatientDetail />} />
              <Route path="/admin/cuestionario" element={<QuestionnaireManager />} />
              <Route path="/admin/configuracion" element={<SystemSettings />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
