import { useEffect, useMemo, useState } from "react";
import { addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek, endOfWeek, addDays, isFuture } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { fetchActivityDateKeys } from "@/lib/recentActivity";
import { localDateStr, cn } from "@/lib/utils";

export function MonthCalendarSheet({
  open,
  onOpenChange,
  onPickDay,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPickDay: (d: Date) => void;
}) {
  const { user } = useAuth();
  const [cursor, setCursor] = useState(new Date());
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const today = new Date();

  useEffect(() => {
    if (!user || !open) return;
    const from = startOfMonth(cursor);
    const to = endOfMonth(cursor);
    fetchActivityDateKeys(user.id, from, to).then(setActiveKeys).catch(() => setActiveKeys(new Set()));
  }, [user, cursor, open]);

  const grid = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const days: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
    return days;
  }, [cursor]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-[28px] border-none bg-[#FDFCFB] p-0">
        <div className="mx-auto max-w-md px-5 pt-4 pb-8">
          <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-foreground/15" />
          <div className="mb-4 flex items-center justify-between">
            <button
              onClick={() => setCursor((c) => addMonths(c, -1))}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
              aria-label="Mes anterior"
            >
              <ChevronLeft size={16} />
            </button>
            <div className="text-center">
              <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
                Tu actividad
              </p>
              <h2 className="font-serif text-[20px] font-medium capitalize text-resma-navy">
                {format(cursor, "MMMM yyyy", { locale: es })}
              </h2>
            </div>
            <button
              onClick={() => setCursor((c) => addMonths(c, 1))}
              disabled={isSameMonth(cursor, today)}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm disabled:opacity-30"
              aria-label="Mes siguiente"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center">
            {["L", "M", "X", "J", "V", "S", "D"].map((d) => (
              <span key={d} className="text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground/60">
                {d}
              </span>
            ))}
          </div>

          <div className="mt-2 grid grid-cols-7 gap-1.5">
            {grid.map((d) => {
              const key = localDateStr(d);
              const has = activeKeys.has(key);
              const inMonth = isSameMonth(d, cursor);
              const isToday = isSameDay(d, today);
              const disabled = isFuture(d);
              return (
                <button
                  key={key}
                  disabled={disabled}
                  onClick={() => {
                    onPickDay(d);
                    onOpenChange(false);
                  }}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center rounded-2xl text-[13px] font-sans font-semibold transition",
                    inMonth ? "text-foreground/80" : "text-foreground/25",
                    isToday && "bg-resma-navy text-white shadow-[0_8px_18px_-10px_rgba(16,25,39,0.6)]",
                    !isToday && has && "bg-white shadow-sm",
                    disabled && "opacity-30",
                  )}
                >
                  <span>{format(d, "d")}</span>
                  {has && (
                    <span
                      className={cn(
                        "absolute bottom-1 h-1 w-1 rounded-full",
                        isToday ? "bg-resma-gold" : "bg-resma-teal",
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <p className="mt-4 text-center text-[11px] text-muted-foreground">
            Tocá un día para ver toda tu actividad de esa fecha.
          </p>
        </div>
      </SheetContent>
    </Sheet>
  );
}
