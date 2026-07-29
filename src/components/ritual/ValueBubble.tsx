import {
  Anchor,
  BookOpen,
  Brain,
  Feather,
  HeartHandshake,
  Heart,
  Leaf,
  Palette,
  Sparkles,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";

export type ValueDef = {
  id: string;
  label: string;
  hint?: string;
};

const VALUE_STYLE: Record<string, { Icon: LucideIcon; color: string }> = {
  presencia: { Icon: Anchor, color: "#3f9c78" },
  conexion: { Icon: HeartHandshake, color: "#c9803a" },
  creatividad: { Icon: Palette, color: "#6d4fbf" },
  salud: { Icon: Heart, color: "#d15a52" },
  aprendizaje: { Icon: BookOpen, color: "#3f7fb0" },
  autenticidad: { Icon: Feather, color: "#8a6ee0" },
  compasion: { Icon: Leaf, color: "#5dbf9a" },
  trabajo: { Icon: Brain, color: "#7a7f96" },
  libertad: { Icon: Wind, color: "#2f9db3" },
  gratitud: { Icon: Sun, color: "#d1a02f" },
};

const FALLBACK = { Icon: Sparkles, color: "#7cc2c8" };

export function ValueBubble({
  value,
  active,
  disabled,
  onToggle,
}: {
  value: ValueDef;
  active: boolean;
  disabled?: boolean;
  onToggle: () => void;
}) {
  const { Icon, color } = VALUE_STYLE[value.id] ?? FALLBACK;

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled && !active}
      aria-pressed={active}
      className={`flex w-full flex-col items-center gap-2 transition ${
        disabled && !active ? "opacity-35" : "active:scale-95"
      }`}
    >
      <span
        className="flex h-[72px] w-[72px] items-center justify-center rounded-full border transition-all duration-300"
        style={{
          background: active ? `${color}22` : "rgba(255,255,255,0.55)",
          borderColor: active ? color : "rgba(16,25,39,0.10)",
          borderWidth: active ? 1.5 : 1,
          backdropFilter: "blur(8px)",
          boxShadow: active ? `0 14px 30px -16px ${color}` : "0 6px 18px -14px rgba(16,25,39,0.5)",
        }}
      >
        <Icon
          size={26}
          strokeWidth={1.4}
          style={{ color: active ? color : "rgba(16,25,39,0.45)" }}
        />
      </span>
      <span
        className="max-w-[84px] text-center font-display text-[11.5px] font-semibold leading-tight transition-colors"
        style={{ color: active ? color : "rgba(16,25,39,0.6)" }}
      >
        {value.label}
      </span>
    </button>
  );
}
