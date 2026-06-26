import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Maximize2, Minimize2, Settings, Check } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";

export type WidgetId =
  | "morning"
  | "recommended"
  | "night"
  | "sleep_zone"
  | "pending"
  | "mini_habits"
  | "gratitude"
  | "contention_notes";

export type WidgetState = {
  id: WidgetId;
  enabled: boolean;
  hidden: boolean;
  size: "full" | "half";
};

const DEFAULT_WIDGETS: WidgetState[] = [
  { id: "morning", enabled: true, hidden: false, size: "full" },
  { id: "recommended", enabled: true, hidden: false, size: "full" },
  { id: "night", enabled: true, hidden: false, size: "full" },
  { id: "sleep_zone", enabled: true, hidden: false, size: "full" },
  { id: "pending", enabled: true, hidden: false, size: "full" },
  { id: "mini_habits", enabled: true, hidden: false, size: "full" },
  { id: "gratitude", enabled: false, hidden: false, size: "half" },
  { id: "contention_notes", enabled: false, hidden: false, size: "full" },
];

const LABELS: Record<WidgetId, string> = {
  morning: "Valoración de la mañana",
  recommended: "Recurso recomendado",
  night: "Valoración de la noche",
  sleep_zone: "Zona de descanso",
  pending: "Pendientes para vos",
  mini_habits: "Mini Hábitos",
  gratitude: "Agradecimiento",
  contention_notes: "Notas de contención",
};

const STORAGE_KEY = "home_widgets_v1";

export function loadWidgets(): WidgetState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw) as WidgetState[];
    return DEFAULT_WIDGETS.map((d) => parsed.find((p) => p.id === d.id) ?? d);
  } catch {
    return DEFAULT_WIDGETS;
  }
}

export function saveWidgets(w: WidgetState[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
  } catch {}
}

export function useHomeWidgets() {
  const [widgets, setWidgets] = useState<WidgetState[]>(() => loadWidgets());
  const [editMode, setEditMode] = useState(false);

  useEffect(() => saveWidgets(widgets), [widgets]);

  useEffect(() => {
    if (editMode) document.body.classList.add("home-edit");
    else document.body.classList.remove("home-edit");
    return () => document.body.classList.remove("home-edit");
  }, [editMode]);

  const isVisible = (id: WidgetId) => {
    const w = widgets.find((x) => x.id === id);
    return w ? w.enabled && !w.hidden : false;
  };
  const getSize = (id: WidgetId) => widgets.find((x) => x.id === id)?.size ?? "full";
  const setSize = (id: WidgetId, size: "full" | "half") =>
    setWidgets((p) => p.map((w) => (w.id === id ? { ...w, size } : w)));
  const toggleEnabled = (id: WidgetId) =>
    setWidgets((p) => p.map((w) => (w.id === id ? { ...w, enabled: !w.enabled, hidden: false } : w)));
  const hide = (id: WidgetId) => setWidgets((p) => p.map((w) => (w.id === id ? { ...w, hidden: true } : w)));
  const reset = () => {
    setWidgets(DEFAULT_WIDGETS);
    toast.success("Widgets restablecidos ✨");
  };
  const activateEdit = () => {
    setEditMode(true);
    toast("¡Personalización activada! Cambia de tamaños o quita elementos ✨", { duration: 2400 });
  };

  return { widgets, setWidgets, editMode, setEditMode, isVisible, getSize, setSize, toggleEnabled, hide, reset, activateEdit };
}

export function WidgetCell({
  id,
  editMode,
  size,
  onHide,
  onToggleSize,
  onLongPress,
  children,
}: {
  id: WidgetId;
  editMode: boolean;
  size: "full" | "half";
  onHide: () => void;
  onToggleSize: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
}) {
  const lp = useLongPress(onLongPress, 800);
  const jiggleClass = (id.charCodeAt(0) + id.length) % 2 === 0 ? "animate-jiggle" : "animate-jiggle-alt";

  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 280, damping: 30 }}
      className={cn(
        "relative",
        size === "half" ? "col-span-1" : "col-span-2",
        editMode && jiggleClass
      )}
      {...(!editMode ? lp : {})}
    >
      {editMode && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); onHide(); }}
            aria-label="Ocultar widget"
            className="absolute -left-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-rose-500 text-white shadow-lg active:scale-95"
          >
            <X size={14} strokeWidth={3} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggleSize(); }}
            aria-label="Cambiar tamaño"
            className="absolute -right-2 -top-2 z-20 flex h-7 w-7 items-center justify-center rounded-full bg-resma-navy text-white shadow-lg active:scale-95"
          >
            {size === "full" ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
          </button>
        </>
      )}
      {children}
    </motion.div>
  );
}

export function EditTopBar({ visible, onDone, onReset }: { visible: boolean; onDone: () => void; onReset: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -60, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -60, opacity: 0 }}
          className="absolute left-0 right-0 top-0 z-50 mx-auto flex max-w-md items-center justify-between gap-2 px-4 pt-3"
        >
          <button
            onClick={onReset}
            className="rounded-full border border-foreground/10 bg-white/80 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground shadow backdrop-blur-xl"
          >
            Restablecer todo
          </button>
          <button
            onClick={onDone}
            className="flex items-center gap-1.5 rounded-full bg-resma-navy px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white shadow-lg"
          >
            <Check size={12} strokeWidth={3} /> Listo
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ManageWidgetsButton({
  widgets,
  onToggle,
}: {
  widgets: WidgetState[];
  onToggle: (id: WidgetId) => void;
}) {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button
          aria-label="Gestionar widgets"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/10 bg-white/70 text-resma-navy shadow-sm transition active:scale-90"
        >
          <Plus size={14} strokeWidth={2.6} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[80vh] rounded-t-[28px] border-0 bg-white/95 backdrop-blur-2xl">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serifElegant text-xl text-resma-navy">
            <Settings size={16} /> Gestionar widgets
          </SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-2">
          {widgets.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-2xl border border-foreground/5 bg-white px-4 py-3">
              <div>
                <p className="text-sm font-semibold text-resma-navy">{LABELS[w.id]}</p>
                <p className="text-[11px] text-muted-foreground">{w.enabled ? (w.hidden ? "Oculto" : "Visible") : "Desactivado"}</p>
              </div>
              <Switch checked={w.enabled && !w.hidden} onCheckedChange={() => onToggle(w.id)} />
            </div>
          ))}
        </div>
      </SheetContent>
    </Sheet>
  );
}
