import { useNavigate } from "react-router-dom";
import { WidgetShell } from "@/components/home/WidgetVisual";
import type { WidgetId } from "@/components/home/WidgetsBoard";

export function QuickToolWidget({
  id,
  route,
}: {
  id: WidgetId;
  title?: string;
  subtitle?: string;
  route: string;
}) {
  const navigate = useNavigate();
  return <WidgetShell id={id} tile onClick={() => navigate(route)} />;
}

