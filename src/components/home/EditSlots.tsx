import { useMemo } from "react";
import { motion } from "framer-motion";
import { Plus, X, Maximize2, Minimize2, Lock } from "lucide-react";
import {
  DndContext, PointerSensor, TouchSensor, useSensor, useSensors, closestCenter,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, useSortable, rectSortingStrategy, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { WidgetId } from "@/components/home/WidgetsBoard";
import { cn } from "@/lib/utils";

export type SlotItem = {
  id: WidgetId;
  size: "full" | "half";
  render: () => React.ReactNode;
};

/**
 * Edit-mode layout with fixed positions:
 *  - Priority stack renders above (locked, passed as `priority`).
 *  - Then 3 tool slots: slot 0 = full width, slots 1 & 2 = half width.
 *  - Empty slots show a dashed "+ Agregar" button.
 *  - Drag & drop swaps between the 3 tool slots only.
 */
export function EditSlots({
  priority,
  items,
  onReorder,
  onHide,
  onToggleSize,
  onAdd,
}: {
  priority?: React.ReactNode;
  items: SlotItem[];
  onReorder: (ids: WidgetId[]) => void;
  onHide: (id: WidgetId) => void;
  onToggleSize: (id: WidgetId) => void;
  onAdd: () => void;
}) {
  const filledIds = useMemo(() => items.map((i) => i.id), [items]);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 8 } }),
  );

  const handleEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = filledIds.indexOf(active.id as WidgetId);
    const newIndex = filledIds.indexOf(over.id as WidgetId);
    if (oldIndex < 0 || newIndex < 0) return;
    try { navigator.vibrate?.(20); } catch {}
    onReorder(arrayMove(filledIds, oldIndex, newIndex));
  };

  // Three-slot template: [full, half, half]
  const slotTemplate: ("full" | "half")[] = ["full", "half", "half"];

  return (
    <div className="space-y-4">
      {priority && (
        <div className="relative">
          <div className="pointer-events-none opacity-90">{priority}</div>
          <div className="pointer-events-none absolute -top-2 right-2 z-30 flex items-center gap-1 rounded-full bg-resma-navy/90 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white shadow-md">
            <Lock size={9} /> Fijo
          </div>
        </div>
      )}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleEnd}>
        <SortableContext items={filledIds} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 gap-3">
            {slotTemplate.map((size, idx) => {
              const item = items[idx];
              return (
                <div key={idx} className={cn(size === "full" ? "col-span-2" : "col-span-1")}>
                  {item ? (
                    <SortableSlot
                      id={item.id}
                      onHide={() => onHide(item.id)}
                      onToggleSize={
                        idx === 0 ? () => onToggleSize(item.id) : undefined
                      }
                      currentSize={size}
                    >
                      {item.render()}
                    </SortableSlot>
                  ) : (
                    <EmptySlot size={size} onAdd={onAdd} />
                  )}
                </div>
              );
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function SortableSlot({
  id,
  children,
  onHide,
  onToggleSize,
  currentSize,
}: {
  id: WidgetId;
  children: React.ReactNode;
  onHide: () => void;
  onToggleSize?: () => void;
  currentSize: "full" | "half";
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
        onClick={(e) => { e.stopPropagation(); onHide(); }}
        aria-label="Quitar"
        className="absolute -left-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
      >
        <X size={11} strokeWidth={2.6} />
      </button>
      {onToggleSize && (
        <button
          type="button"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onToggleSize(); }}
          aria-label="Cambiar tamaño"
          className="absolute -right-1.5 -top-1.5 z-20 flex h-6 w-6 items-center justify-center rounded-full border border-foreground/10 bg-white text-foreground/60 shadow-sm active:scale-95"
        >
          {currentSize === "full" ? <Minimize2 size={10} /> : <Maximize2 size={10} />}
        </button>
      )}
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing">
        <div className="pointer-events-none">{children}</div>
      </div>
    </div>
  );
}

function EmptySlot({ size, onAdd }: { size: "full" | "half"; onAdd: () => void }) {
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      onClick={onAdd}
      className={cn(
        "flex w-full flex-col items-center justify-center gap-1.5 rounded-[24px] border-2 border-dashed border-foreground/20 bg-white/40 text-muted-foreground transition hover:border-resma-teal/60 hover:text-resma-teal",
        size === "full" ? "h-[92px]" : "h-[112px]"
      )}
      style={{
        // Sharp/pointy dashed corners feel — approximated with rounded dashed border
        // and a subtle inset shadow to hint at a receptacle.
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.02)",
      }}
    >
      <Plus size={18} strokeWidth={2.4} />
      <span className="text-[10.5px] font-bold uppercase tracking-[0.14em]">
        Agregar herramienta
      </span>
    </motion.button>
  );
}
