import { AtomicWidget } from "@/components/home/AtomicWidget";
import { useTodayCompletion } from "@/hooks/useTodayCompletion";
import { CheckCircle, Heart, NotebookPen } from "lucide-react";
import { ATOMIC_COLORS } from "@/components/home/QuickToolWidget";

export function MiniHabitsWidget() {
  const done = useTodayCompletion();
  return (
    <AtomicWidget
      label="Hábitos"
      Icon={CheckCircle}
      color={ATOMIC_COLORS.mini_habits}
      to="/diario-inteligente/gestion-pensamientos/habitos"
      completed={done.mini_habits}
    />
  );
}

export function GratitudeWidget() {
  const done = useTodayCompletion();
  return (
    <AtomicWidget
      label="Gratitud"
      Icon={Heart}
      color={ATOMIC_COLORS.gratitude}
      to="/diario"
      completed={done.gratitude}
    />
  );
}

export function ContentionNotesWidget() {
  const done = useTodayCompletion();
  return (
    <AtomicWidget
      label="Contención"
      Icon={NotebookPen}
      color={ATOMIC_COLORS.contention_notes}
      to="/diario"
      completed={done.contention_notes}
    />
  );
}
