import { Check, type LucideIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export type AtomicWidgetProps = {
  label: string;
  Icon: LucideIcon;
  color: string;         // color clínico del recurso
  to: string;            // ruta al recurso
  completed?: boolean;
  ariaLabel?: string;
  onBeforeNav?: () => void;
};

/**
 * Widget atómico universal:
 *   ┌───────────┐   ← Cápsula cuadrada glass tinted al 8% del color clínico.
 *   │   icon    │     Al completarse hoy → fondo sólido vibrante + ícono blanco + check overlay.
 *   └───────────┘
 *      label       ← Fuera de la caja, mt-2, slate-600.
 *
 * Interacción: un solo tap navega SIEMPRE al recurso. El "completado" es
 * reflejo visual (lectura de la DB), no un toggle manual.
 */
export function AtomicWidget({
  label,
  Icon,
  color,
  to,
  completed = false,
  ariaLabel,
  onBeforeNav,
}: AtomicWidgetProps) {
  const navigate = useNavigate();
  const handle = () => {
    onBeforeNav?.();
    navigate(to);
  };

  const tint = `${color}26`; // ~15% alpha — asegura que la caja se lea como contenedor

  return (
    <button
      type="button"
      onClick={handle}
      aria-label={ariaLabel ?? label}
      className="group flex select-none flex-col items-center outline-none"
    >
      {/* Cápsula cuadrada glass */}
      <div
        className="relative flex w-full items-center justify-center overflow-hidden rounded-2xl transition-transform duration-300 group-active:scale-[0.92]"
        style={{
          aspectRatio: "1 / 1",
          background: completed ? color : tint,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: `1px solid ${completed ? color : "rgba(255,255,255,0.75)"}`,
          boxShadow: completed
            ? `0 12px 28px -12px ${color}80, inset 0 1px 0 rgba(255,255,255,0.35)`
            : `inset 0 0 0 1px ${color}22, 0 6px 18px -12px rgba(16,25,39,0.15), inset 0 1px 0 rgba(255,255,255,0.55)`,
          transitionTimingFunction: "cubic-bezier(0.175, 0.885, 0.32, 1.275)",
        }}
      >
        <Icon
          size={30}
          strokeWidth={1.5}
          color={completed ? "#ffffff" : color}
        />
        {completed && (
          <span
            className="absolute right-2 top-2 flex h-4 w-4 items-center justify-center rounded-full bg-white shadow-sm"
            aria-hidden
          >
            <Check size={10} strokeWidth={3} color={color} />
          </span>
        )}
      </div>

      {/* Etiqueta fuera de la caja */}
      <span
        className={`mt-2 text-[11px] tracking-tight ${
          completed ? "font-semibold text-slate-900" : "font-medium text-slate-600"
        }`}
      >
        {label}
      </span>
    </button>
  );
}
