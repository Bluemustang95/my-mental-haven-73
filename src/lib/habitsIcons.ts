import {
  Droplet, BookOpen, Dumbbell, Heart, Sun, Moon, Brain, Coffee,
  Apple, Bed, Sparkles, Pen, Music, Leaf, Footprints, Smile,
  type LucideIcon,
} from "lucide-react";

export const EMOJI_ICONS = [
  "🥛", "🧘‍♂️", "📖", "🏃‍♂️", "🥗", "💧", "☀️", "🌙",
  "✍️", "📵", "🍎", "🛌", "💊", "🧠", "🌱", "🎨",
] as const;

export const LINE_ICONS: { id: string; Icon: LucideIcon }[] = [
  { id: "droplet", Icon: Droplet },
  { id: "book", Icon: BookOpen },
  { id: "dumbbell", Icon: Dumbbell },
  { id: "heart", Icon: Heart },
  { id: "sun", Icon: Sun },
  { id: "moon", Icon: Moon },
  { id: "brain", Icon: Brain },
  { id: "coffee", Icon: Coffee },
  { id: "apple", Icon: Apple },
  { id: "bed", Icon: Bed },
  { id: "sparkles", Icon: Sparkles },
  { id: "pen", Icon: Pen },
  { id: "music", Icon: Music },
  { id: "leaf", Icon: Leaf },
  { id: "foot", Icon: Footprints },
  { id: "smile", Icon: Smile },
];

export const STREAK_COLORS = [
  { color: "#7cc2c8", textColor: "#3d8a90", label: "Teal" },
  { color: "#facb60", textColor: "#92561a", label: "Gold" },
  { color: "#f47b6f", textColor: "#a8392f", label: "Rose" },
  { color: "#7c83f4", textColor: "#3b41a8", label: "Indigo" },
  { color: "#5bcf9e", textColor: "#1f7c52", label: "Emerald" },
  { color: "#94a3b8", textColor: "#475569", label: "Slate" },
];

export const DBT_CATEGORIES = [
  { key: "arte", label: "Arte" },
  { key: "estudio", label: "Estudio" },
  { key: "finanzas", label: "Finanzas" },
  { key: "fit", label: "Fit" },
  { key: "nutricion", label: "Nutrición" },
  { key: "salud", label: "Salud" },
  { key: "social", label: "Social" },
  { key: "trabajo", label: "Trabajo" },
  { key: "manana", label: "Mañana" },
  { key: "dia", label: "Día" },
  { key: "tarde", label: "Tarde" },
  { key: "otros", label: "Otros" },
];

export const TIME_SLOTS = [
  { key: "morning", label: "Mañana" },
  { key: "afternoon", label: "Tarde" },
  { key: "night", label: "Noche" },
  { key: "all", label: "Día completo" },
];

export const FREQUENCY_OPTIONS = [
  { key: "daily", label: "Diario" },
  { key: "weekly", label: "Semanal" },
  { key: "monthly", label: "Mensual" },
];

export const CADENCE_OPTIONS = [
  { key: "every_day", label: "Día a día" },
  { key: "every_2", label: "Cada 2 días" },
  { key: "custom", label: "Personalizado" },
];

export function renderIcon(habit: { icon: string; icon_type?: string }, sizeClass = "text-2xl") {
  if (habit.icon_type === "line") {
    const found = LINE_ICONS.find(i => i.id === habit.icon);
    if (found) return found;
  }
  return null;
}
