import { Moon, Wind, Brain, Sparkles, BookOpen, GraduationCap, CheckCircle, Heart, NotebookPen } from "lucide-react";
import { AtomicWidget } from "@/components/home/AtomicWidget";
import { useTodayCompletion } from "@/hooks/useTodayCompletion";

// Colores clínicos por recurso (fuente de verdad para los widgets atómicos).
export const ATOMIC_COLORS = {
  sleep_zone: "#6366f1",
  mini_habits: "#7d9b76",
  diario_quick: "#f59e0b",
  mindfulness_quick: "#7cc2c8",
  pensamientos_quick: "#9b72cf",
  pack_quick: "#e88aab",
  psico_quick: "#3b6fa0",
  gratitude: "#f291b2",
  contention_notes: "#c47a55",
} as const;

/** Ícono lineal ultra fino por widget. */
const ICONS = {
  sleep_zone: Moon,
  mini_habits: CheckCircle,
  diario_quick: BookOpen,
  mindfulness_quick: Wind,
  pensamientos_quick: Brain,
  pack_quick: Sparkles,
  psico_quick: GraduationCap,
  gratitude: Heart,
  contention_notes: NotebookPen,
} as const;

const LABELS = {
  sleep_zone: "Sueño",
  mini_habits: "Hábitos",
  diario_quick: "Diario",
  mindfulness_quick: "Mindfulness",
  pensamientos_quick: "Pensamientos",
  pack_quick: "Pack",
  psico_quick: "Psicoeducación",
  gratitude: "Gratitud",
  contention_notes: "Contención",
} as const;

const ROUTES = {
  sleep_zone: "/herramientas/sueno",
  mini_habits: "/diario-inteligente/gestion-pensamientos/habitos",
  diario_quick: "/diario",
  mindfulness_quick: "/herramientas/mindfulness",
  pensamientos_quick: "/herramientas/pensamientos",
  pack_quick: "/herramientas/pack",
  psico_quick: "/psicoeducacion",
  gratitude: "/diario",
  contention_notes: "/diario",
} as const;

type AtomicId = keyof typeof ATOMIC_COLORS;

function useAtomic(id: AtomicId) {
  const done = useTodayCompletion();
  return (
    <AtomicWidget
      label={LABELS[id]}
      Icon={ICONS[id]}
      color={ATOMIC_COLORS[id]}
      to={ROUTES[id]}
      completed={done[id]}
    />
  );
}

// ─── Exports usados por Dashboard (mismos nombres que antes, nueva anatomía) ───
export function SleepZoneWidget()          { return useAtomic("sleep_zone"); }
export function DiarioQuickWidget()        { return useAtomic("diario_quick"); }
export function MindfulnessQuickWidget()   { return useAtomic("mindfulness_quick"); }
export function PensamientosQuickWidget()  { return useAtomic("pensamientos_quick"); }
export function PackQuickWidget()          { return useAtomic("pack_quick"); }
export function PsicoQuickWidget()         { return useAtomic("psico_quick"); }
