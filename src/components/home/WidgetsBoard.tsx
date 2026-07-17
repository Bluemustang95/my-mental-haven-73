import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, Maximize2, Minimize2, Settings, Check } from "lucide-react";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Switch } from "@/components/ui/switch";
import { useLongPress } from "@/hooks/useLongPress";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, verticalListSortingStrategy, rectSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useHiddenCategories } from "@/hooks/useHiddenCategories";

export type WidgetId =
  | "morning"
  | "recommended"
  | "night"
  | "sleep_zone"
  | "pending"
  | "mini_habits"
  | "psy_news"
  // Onboarding-seeded quick launchers (deep-link tools):
  | "mindfulness_quick"
  | "pensamientos_quick"
  | "pack_quick"
  | "psico_quick";

// Prioridades: siempre visibles en el PriorityStack, no se gestionan como widgets.
export const PRIORITY_IDS: WidgetId[] = ["morning", "recommended", "night"];
// Herramientas: el usuario elige hasta 3 para su Home.
export const TOOL_IDS: WidgetId[] = [
  "sleep_zone",
  "pending",
  "mini_habits",
  "psy_news",
  "mindfulness_quick",
  "pensamientos_quick",
  "pack_quick",
  "psico_quick",
];
export const MAX_TOOLS = 3;

// Mapea cada widget a la categoría de recurso que lo respalda. Cuando el admin
// oculta una categoría, los widgets del mapa desaparecen de home y del picker.
export const WIDGET_TO_CATEGORY: Partial<Record<WidgetId, string>> = {
  sleep_zone: "sueno",
  mini_habits: "habitos",
  mindfulness_quick: "mindfulness",
  pensamientos_quick: "mente-emocion",
  pack_quick: "pack",
  psico_quick: "psicoeducacion",
  psy_news: "noticias",
};

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
  { id: "pending", enabled: true, hidden: false, size: "half" },
  { id: "mini_habits", enabled: true, hidden: false, size: "half" },
  { id: "psy_news", enabled: false, hidden: false, size: "half" },
  // Quick launchers — disabled by default; onboarding seeds enable them.
  { id: "mindfulness_quick", enabled: false, hidden: false, size: "half" },
  { id: "pensamientos_quick", enabled: false, hidden: false, size: "half" },
  { id: "pack_quick", enabled: false, hidden: false, size: "half" },
  { id: "psico_quick", enabled: false, hidden: false, size: "half" },
];

const LABELS: Record<WidgetId, string> = {
  morning: "Sintonía de la mañana",
  recommended: "Práctica recomendada",
  night: "Balance nocturno",
  sleep_zone: "Zona de descanso",
  pending: "Pendientes para vos",
  mini_habits: "Mini Hábitos",
  psy_news: "Noticias de psicología",
  mindfulness_quick: "Mindfulness y respiración",
  pensamientos_quick: "Gestión de pensamientos",
  pack_quick: "Pack de activación",
  
  psico_quick: "Biblioteca psicoeducativa",
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
  const cloudTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hydratedRef = useRef(false);

  // Local cache
  useEffect(() => saveWidgets(widgets), [widgets]);

  // Hydrate from cloud once on mount.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { hydratedRef.current = true; return; }
      const { data } = await supabase
        .from("home_layouts")
        .select("widgets")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      const remote = (data?.widgets as unknown as WidgetState[] | undefined) ?? null;
      if (remote && remote.length) {
        // Merge with defaults to surface new widgets added in app updates.
        const known = new Set(remote.map((p) => p.id));
        const merged: WidgetState[] = [
          ...remote
            .map((p) => {
              const d = DEFAULT_WIDGETS.find((x) => x.id === p.id);
              return d ? { ...d, ...p } : null;
            })
            .filter(Boolean) as WidgetState[],
          ...DEFAULT_WIDGETS.filter((d) => !known.has(d.id)),
        ];
        setWidgets(merged);
      }
      hydratedRef.current = true;
    })();
    return () => { cancelled = true; };
  }, []);

  // Debounced upsert to cloud after hydration.
  useEffect(() => {
    if (!hydratedRef.current) return;
    if (cloudTimer.current) clearTimeout(cloudTimer.current);
    cloudTimer.current = setTimeout(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      await supabase.from("home_layouts").upsert({
        user_id: user.id,
        widgets: widgets as unknown as never,
      }, { onConflict: "user_id" });
    }, 700);
    return () => { if (cloudTimer.current) clearTimeout(cloudTimer.current); };
  }, [widgets]);

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
    setWidgets((p) => {
      const target = p.find((w) => w.id === id);
      const enabling = target ? !target.enabled : false;
      // Cap: máximo MAX_TOOLS herramientas encendidas al mismo tiempo
      if (enabling && TOOL_IDS.includes(id)) {
        const activeTools = p.filter((w) => TOOL_IDS.includes(w.id) && w.enabled && !w.hidden).length;
        if (activeTools >= MAX_TOOLS) {
          toast(`Podés elegir hasta ${MAX_TOOLS} herramientas. Desactivá otra primero.`);
          return p;
        }
      }
      return p.map((w) => (w.id === id ? { ...w, enabled: !w.enabled, hidden: false } : w));
    });
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

// dnd-kit sensors with long-press activation for mobile touch + small drag on desktop
function useDnDSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );
}

function SortableRow({
  id, size, onHide, onToggleSize, children,
}: {
  id: WidgetId; size: "full" | "half";
  onHide: (id: WidgetId) => void;
  onToggleSize: (id: WidgetId) => void;
  children: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    touchAction: "none",
  };
  return (
    <div ref={setNodeRef} style={style} className={cn("relative animate-jiggle", isDragging && "scale-[1.03]")}>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onHide(id); }}
        aria-label="Ocultar widget"
        className="absolute -left-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
      >
        <X size={11} strokeWidth={2.6} />
      </button>
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => { e.stopPropagation(); onToggleSize(id); }}
        aria-label="Cambiar tamaño"
        className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
      >
        {size === "full" ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
      </button>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="pointer-events-none">{children}</div>
      </div>
    </div>
  );
}

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
  const sensors = useDnDSensors();

  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as WidgetId);
    const newIndex = ids.indexOf(over.id as WidgetId);
    if (oldIndex < 0 || newIndex < 0) return;
    try { navigator.vibrate?.(20); } catch {}
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-3">
          {items.map((item) => (
            <SortableRow
              key={item.id}
              id={item.id}
              size={item.size}
              onHide={onHide}
              onToggleSize={onToggleSize}
            >
              {item.render()}
            </SortableRow>
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

/** Group-based reorder: each item is a whole group (camino, pendientes, sueño, etc.). */
export type GroupItem = {
  id: string;
  size: "full" | "half";
  resizable?: boolean;
  hideable?: boolean;
  onHide?: () => void;
  onToggleSize?: () => void;
  render: () => React.ReactNode;
};

function SortableGroupCell({ item }: { item: GroupItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    touchAction: "none",
  };
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative animate-jiggle",
        item.size === "full" ? "col-span-2" : "col-span-1",
        isDragging && "scale-[1.03]"
      )}
    >
      {item.hideable && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
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
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); item.onToggleSize?.(); }}
          aria-label="Cambiar tamaño"
          className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
        >
          {item.size === "full" ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
        </button>
      )}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="pointer-events-none space-y-2.5">{item.render()}</div>
      </div>
    </div>
  );
}

export function ReorderableGroupStack({
  items,
  onReorder,
}: {
  items: GroupItem[];
  onReorder: (ids: string[]) => void;
}) {
  const ids = useMemo(() => items.map((i) => i.id), [items]);
  const sensors = useDnDSensors();

  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = ids.indexOf(active.id as string);
    const newIndex = ids.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    try { navigator.vibrate?.(20); } catch {}
    onReorder(arrayMove(ids, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
      <SortableContext items={ids} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => (
            <SortableGroupCell key={item.id} item={item} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
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
  const [open, setOpen] = useState(false);
  const hiddenCats = useHiddenCategories();
  useEffect(() => {
    const listener = () => setOpen(true);
    window.addEventListener("resma:open-manage-widgets", listener);
    return () => window.removeEventListener("resma:open-manage-widgets", listener);
  }, []);
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          aria-label="Gestionar widgets"
          className="flex h-7 w-7 items-center justify-center rounded-full border border-foreground/10 bg-white/70 text-resma-navy shadow-sm transition active:scale-90"
        >
          <Plus size={14} strokeWidth={2.6} />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto rounded-t-[28px] border-0 bg-white/95 backdrop-blur-2xl">

        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-serifElegant text-xl text-resma-navy">
            <Settings size={16} /> Tus herramientas
          </SheetTitle>
          <p className="text-[12px] text-muted-foreground">
            Elegí hasta {MAX_TOOLS}. Se muestran debajo de tus prioridades del día.
          </p>
        </SheetHeader>
        <div className="mt-4 space-y-2 pb-6">
          {widgets
            .filter((w) => TOOL_IDS.includes(w.id))
            .filter((w) => {
              const cat = WIDGET_TO_CATEGORY[w.id];
              return !cat || !hiddenCats.has(cat);
            })
            .map((w) => {
              const activeCount = widgets.filter(
                (x) => TOOL_IDS.includes(x.id) && x.enabled && !x.hidden
              ).length;
              const disabled = !w.enabled && activeCount >= MAX_TOOLS;
              return (
                <div
                  key={w.id}
                  className={`flex items-center justify-between rounded-2xl border border-foreground/5 bg-white px-4 py-3 ${disabled ? "opacity-50" : ""}`}
                >
                  <div>
                    <p className="text-sm font-semibold text-resma-navy">{LABELS[w.id]}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {w.enabled ? (w.hidden ? "Oculto" : "Visible") : disabled ? "Cupo lleno" : "Desactivado"}
                    </p>
                  </div>
                  <Switch
                    checked={w.enabled && !w.hidden}
                    disabled={disabled}
                    onCheckedChange={() => onToggle(w.id)}
                  />
                </div>
              );
            })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
