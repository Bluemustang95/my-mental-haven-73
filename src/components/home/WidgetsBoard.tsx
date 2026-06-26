import { useEffect, useMemo, useState } from "react";
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

const STORAGE_KEY = "home_widgets_v2";

export function loadWidgets(): WidgetState[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_WIDGETS;
    const parsed = JSON.parse(raw) as WidgetState[];
    // Preserve stored order; append any new defaults at the end.
    const known = new Set(parsed.map((p) => p.id));
    const merged = parsed
      .map((p) => {
        const d = DEFAULT_WIDGETS.find((x) => x.id === p.id);
        return d ? { ...d, ...p } : null;
      })
      .filter(Boolean) as WidgetState[];
    DEFAULT_WIDGETS.forEach((d) => {
      if (!known.has(d.id)) merged.push(d);
    });
    return merged;
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
  const reorder = (ids: WidgetId[]) => {
    setWidgets((prev) => {
      const map = new Map(prev.map((w) => [w.id, w]));
      const reordered = ids.map((id) => map.get(id)!).filter(Boolean);
      const rest = prev.filter((w) => !ids.includes(w.id));
      return [...reordered, ...rest];
    });
  };
  const reset = () => {
    setWidgets(DEFAULT_WIDGETS);
    toast.success("Widgets restablecidos");
  };
  const activateEdit = () => {
    setEditMode(true);
    toast("Mantené y arrastrá para reordenar", { duration: 2200 });
  };

  return {
    widgets,
    setWidgets,
    editMode,
    setEditMode,
    isVisible,
    getSize,
    setSize,
    toggleEnabled,
    hide,
    reorder,
    reset,
    activateEdit,
  };
}

/**
 * Wraps a widget cell when shown in normal grid mode.
 * In edit mode the parent renders a Reorder list instead and ignores this.
 */
export function WidgetCell({
  id,
  editMode,
  size,
  onLongPress,
  children,
}: {
  id: WidgetId;
  editMode: boolean;
  size: "full" | "half";
  onHide?: () => void;
  onToggleSize?: () => void;
  onLongPress: () => void;
  children: React.ReactNode;
}) {
  const lp = useLongPress(onLongPress, 800);
  return (
    <motion.div
      layout
      transition={{ type: "spring", stiffness: 260, damping: 30 }}
      className={cn("relative", size === "half" ? "col-span-1" : "col-span-2")}
      {...(!editMode ? lp : {})}
    >
      {children}
    </motion.div>
  );
}

/**
 * Edit-mode reorderable stack. Single column for clean drag UX,
 * with hide and resize chips on each card.
 */
type EditableItem = {
  id: WidgetId;
  size: "full" | "half";
  render: () => React.ReactNode;
};

export function ReorderableStack({
  items,
  onReorder,
  onHide,
  onToggleSize,
}: {
  items: EditableItem[];
  onReorder: (ids: WidgetId[]) => void;
  onHide: (id: WidgetId) => void;
  onToggleSize: (id: WidgetId) => void;
}) {
  // framer-motion's Reorder requires unique value identities
  return (
    <ReorderInner
      items={items}
      onReorder={onReorder}
      onHide={onHide}
      onToggleSize={onToggleSize}
    />
  );
}

// Lazy import wrapper kept inline to avoid an extra file
import { Reorder } from "framer-motion";

function ReorderInner({
  items,
  onReorder,
  onHide,
  onToggleSize,
}: {
  items: EditableItem[];
  onReorder: (ids: WidgetId[]) => void;
  onHide: (id: WidgetId) => void;
  onToggleSize: (id: WidgetId) => void;
}) {
  const ids = useMemo(() => items.map((i) => i.id), [items]);

  return (
    <Reorder.Group
      axis="y"
      values={ids}
      onReorder={(next) => onReorder(next as WidgetId[])}
      className="flex flex-col gap-3"
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item.id}
          className="relative animate-jiggle touch-none"
          whileDrag={{ scale: 1.03, zIndex: 50 }}
        >
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onHide(item.id); }}
            aria-label="Ocultar widget"
            className="absolute -left-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
          >
            <X size={11} strokeWidth={2.6} />
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleSize(item.id); }}
            aria-label="Cambiar tamaño"
            className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
          >
            {item.size === "full" ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
          </button>
          <div className="pointer-events-none">{item.render()}</div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

/** Group-based reorder: each Reorder.Item is a whole group (camino, pendientes, sueño, etc.). */
export type GroupItem = {
  id: string;
  size: "full" | "half";
  resizable?: boolean;
  hideable?: boolean;
  onHide?: () => void;
  onToggleSize?: () => void;
  render: () => React.ReactNode;
};

export function ReorderableGroupStack({
  items,
  onReorder,
}: {
  items: GroupItem[];
  onReorder: (ids: string[]) => void;
}) {
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  return (
    <Reorder.Group
      axis="y"
      values={ids}
      onReorder={(next) => onReorder(next as string[])}
      className="grid grid-cols-2 gap-3"
    >
      {items.map((item) => (
        <Reorder.Item
          key={item.id}
          value={item.id}
          className={cn(
            "relative animate-jiggle touch-none",
            item.size === "full" ? "col-span-2" : "col-span-1"
          )}
          whileDrag={{ scale: 1.03, zIndex: 50 }}
        >
          {item.hideable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); item.onHide?.(); }}
              aria-label="Ocultar"
              className="absolute -left-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
            >
              <X size={11} strokeWidth={2.6} />
            </button>
          )}
          {item.resizable && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); item.onToggleSize?.(); }}
              aria-label="Cambiar tamaño"
              className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
            >
              {item.size === "full" ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
            </button>
          )}
          <div className="pointer-events-none space-y-2.5">{item.render()}</div>
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

export function EditTopBar({ visible, onDone, onReset }: { visible: boolean; onDone: () => void; onReset: () => void }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="absolute left-0 right-0 top-0 z-50 mx-auto flex max-w-md items-center justify-between gap-2 px-5 pt-3"
        >
          <button
            onClick={onReset}
            className="rounded-full border border-foreground/10 bg-white/85 px-3.5 py-1.5 text-[12px] font-medium text-muted-foreground shadow-sm backdrop-blur-xl"
          >
            Restablecer
          </button>
          <button
            onClick={onDone}
            className="flex items-center gap-1.5 rounded-full bg-resma-navy px-4 py-1.5 text-[12px] font-semibold text-white shadow-sm"
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
