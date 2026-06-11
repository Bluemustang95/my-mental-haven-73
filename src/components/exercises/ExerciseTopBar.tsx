import { X } from "lucide-react";

interface Props {
  title?: string;
  subtitle?: string;
  onAbort: () => void;
  /** Right slot, e.g. step counter or pause button */
  right?: React.ReactNode;
}

/**
 * Top bar for any exercise view rendered inside ExerciseShell.
 * Always provides a visible cancel (X) button on the top-left.
 */
export function ExerciseTopBar({ title, subtitle, onAbort, right }: Props) {
  return (
    <div className="flex items-start justify-between gap-3">
      <button
        onClick={onAbort}
        aria-label="Cancelar ejercicio"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/10 backdrop-blur"
      >
        <X size={18} />
      </button>
      {(title || subtitle) && (
        <div className="flex-1 text-center">
          {title && <div className="font-display text-sm font-semibold text-white">{title}</div>}
          {subtitle && <div className="text-[11px] text-white/55">{subtitle}</div>}
        </div>
      )}
      <div className="h-10 w-10 shrink-0 flex items-center justify-end">{right}</div>
    </div>
  );
}
