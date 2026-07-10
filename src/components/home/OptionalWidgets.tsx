import { useNavigate } from "react-router-dom";
import { WidgetShell } from "@/components/home/WidgetVisual";

export function MiniHabitsWidget() {
  const navigate = useNavigate();
  return <WidgetShell id="mini_habits" tile onClick={() => navigate("/diario-inteligente/gestion-pensamientos/habitos")} />;
}

export function GratitudeWidget() {
  const navigate = useNavigate();
  return <WidgetShell id="gratitude" tile onClick={() => navigate("/diario")} />;
}

export function ContentionNotesWidget() {
  const navigate = useNavigate();
  return <WidgetShell id="contention_notes" tile onClick={() => navigate("/diario")} />;
}
