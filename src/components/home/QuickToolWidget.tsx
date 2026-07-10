import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { WidgetShell } from "@/components/home/WidgetVisual";
import type { WidgetId } from "@/components/home/WidgetsBoard";

/**
 * Small "quick launcher" widget. Uses the widget's identity gradient/glyph
 * and links to a real route in the app. Powers the onboarding-seeded tools
 * (mindfulness, pensamientos, pack, diario, psicoeducación).
 */
export function QuickToolWidget({
  id,
  title,
  subtitle,
  route,
}: {
  id: WidgetId;
  title: string;
  subtitle: string;
  route: string;
}) {
  const navigate = useNavigate();
  return (
    <button onClick={() => navigate(route)} className="block w-full text-left">
      <WidgetShell id={id}>
        <p className="mt-1 font-display text-[15px] font-bold leading-tight">{title}</p>
        <p className="mt-0.5 line-clamp-2 text-[11.5px] leading-snug opacity-80">
          {subtitle}
        </p>
        <div className="mt-2 flex items-center gap-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] opacity-80">
          Abrir <ChevronRight size={11} />
        </div>
      </WidgetShell>
    </button>
  );
}
