import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { cn } from "@/lib/utils";

const initials = ["L", "M", "X", "J", "V", "S", "D"];

export function WeekStrip({
  hasActivityToday,
  onSelectDay,
}: {
  hasActivityToday?: boolean;
  onSelectDay?: (d: Date) => void;
}) {
  const today = new Date();
  const ws = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  return (
    <div className="grid grid-cols-7 gap-1 px-2">
      {days.map((d, i) => {
        const isToday = isSameDay(d, today);
        return (
          <button
            key={i}
            onClick={() => onSelectDay?.(d)}
            className="flex flex-col items-center gap-1 py-1"
          >
            <span
              className={cn(
                "font-display text-[11px] font-semibold tracking-wide",
                isToday ? "text-foreground" : "text-muted-foreground/60"
              )}
            >
              {initials[i]}
            </span>
            <div
              className={cn(
                "relative flex h-9 w-9 items-center justify-center rounded-full font-display text-sm transition",
                isToday
                  ? hasActivityToday
                    ? "bg-[#34C759]/15 text-[#1f7a37] font-bold ring-1 ring-[#34C759]/40"
                    : "bg-[#F4ECE0] text-foreground font-bold"
                  : "text-foreground/70"
              )}
            >
              {format(d, "d")}
              {isToday && hasActivityToday && (
                <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[#34C759]" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
