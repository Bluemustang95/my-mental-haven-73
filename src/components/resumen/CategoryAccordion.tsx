import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

export interface Item {
  id: string;
  label: string;
  sub?: string;
}

export function CategoryAccordion({
  icon,
  title,
  subtitle,
  items,
  enabled,
  selectedItems,
  onToggleCategory,
  onToggleItem,
  emptyText,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  items: Item[];
  enabled: boolean;
  selectedItems: Record<string, boolean>;
  onToggleCategory: (v: boolean) => void;
  onToggleItem: (id: string, v: boolean) => void;
  emptyText?: string;
}) {
  const [open, setOpen] = useState(false);
  const selectedCount = Object.values(selectedItems).filter(Boolean).length;
  const allSelected = items.length > 0 && selectedCount === items.length;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/70 bg-white shadow-[0_2px_12px_rgba(16,25,39,0.05)]">
      <div className="flex items-center gap-3 p-4">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7cc2c8]/15 text-[#0f172a]">
          {icon}
        </div>
        <button
          onClick={() => items.length > 0 && setOpen(o => !o)}
          className="flex-1 text-left"
        >
          <p className="font-display text-[13px] font-semibold text-[#0f172a]">{title}</p>
          <p className="text-[11px] text-[#64748b]">
            {items.length > 0
              ? `${selectedCount}/${items.length} seleccionados · ${subtitle}`
              : emptyText ?? "Sin datos en los últimos 7 días"}
          </p>
        </button>
        {items.length > 0 && (
          <>
            <Checkbox
              checked={allSelected}
              onCheckedChange={(v) => {
                const nv = !!v;
                onToggleCategory(nv);
                items.forEach(i => onToggleItem(i.id, nv));
              }}
              aria-label={`Seleccionar todo ${title}`}
            />
            <ChevronDown
              size={16}
              className={cn("text-[#94a3b8] transition-transform", open && "rotate-180")}
              onClick={() => setOpen(o => !o)}
            />
          </>
        )}
      </div>

      <AnimatePresence initial={false}>
        {open && items.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="space-y-1.5 border-t border-black/[0.04] bg-[#f9f9fb] px-4 py-3">
              {items.map(it => (
                <label
                  key={it.id}
                  className="flex cursor-pointer items-start gap-2.5 rounded-xl bg-white p-2.5 shadow-[0_1px_4px_rgba(0,0,0,0.03)] active:scale-[0.99]"
                >
                  <Checkbox
                    checked={!!selectedItems[it.id]}
                    onCheckedChange={(v) => onToggleItem(it.id, !!v)}
                    className="mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-[12.5px] leading-snug text-[#0f172a]">{it.label}</p>
                    {it.sub && <p className="mt-0.5 text-[11px] text-[#64748b] line-clamp-2">{it.sub}</p>}
                  </div>
                </label>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
