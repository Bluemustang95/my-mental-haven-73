import { useState, useEffect } from "react";
import { ClockCounterClockwise, X } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface HistoryPanelProps<T> {
  tableName: string;
  orderColumn?: string;
  renderItem: (item: T) => React.ReactNode;
  renderDetail: (item: T) => React.ReactNode;
  dateField?: keyof T;
}

export default function HistoryPanel<T extends { id: string; created_at?: string | null }>({
  tableName,
  orderColumn = "created_at",
  renderItem,
  renderDetail,
  dateField,
}: HistoryPanelProps<T>) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<T | null>(null);

  useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    supabase
      .from(tableName as any)
      .select("*")
      .eq("user_id", user.id)
      .order(orderColumn, { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries((data as unknown as T[]) || []);
        setLoading(false);
      });
  }, [open, user, tableName, orderColumn]);

  const formatDate = (item: T) => {
    const raw = dateField ? (item[dateField] as string) : item.created_at;
    if (!raw) return "";
    try {
      return format(new Date(raw), "d MMM yyyy · HH:mm", { locale: es });
    } catch {
      return raw;
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1 font-display text-[11px] transition-all",
          open
            ? "border-accent bg-accent/10 text-accent-foreground"
            : "border-border text-muted-foreground"
        )}
      >
        <ClockCounterClockwise size={13} weight="duotone" />
        Historial
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-4 overflow-hidden"
          >
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
              </div>
            ) : entries.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                No hay registros anteriores.
              </p>
            ) : (
              <div className="space-y-2">
                {entries.map((entry) => (
                  <motion.button
                    key={entry.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => setSelected(entry)}
                    className="w-full rounded-2xl border border-border bg-card p-3.5 text-left transition-shadow active:shadow-none hover:shadow-[0_2px_8px_-3px_hsl(var(--foreground)/0.08)]"
                  >
                    <p className="mb-1 font-display text-[10px] text-muted-foreground">
                      {formatDate(entry)}
                    </p>
                    {renderItem(entry)}
                  </motion.button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/30 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg rounded-t-3xl border-t border-border bg-card px-5 pb-8 pt-4 safe-area-bottom max-h-[85vh] overflow-y-auto"
            >
              <div className="mb-4 flex items-center justify-between">
                <p className="font-display text-xs text-muted-foreground">
                  {formatDate(selected)}
                </p>
                <button onClick={() => setSelected(null)} className="text-muted-foreground">
                  <X size={18} />
                </button>
              </div>
              <div className="mb-3 rounded-xl bg-muted/30 px-3 py-1.5">
                <p className="font-display text-[10px] uppercase tracking-wider text-muted-foreground">
                  Solo lectura
                </p>
              </div>
              {renderDetail(selected)}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
