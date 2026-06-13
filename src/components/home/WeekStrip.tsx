import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { cn } from "@/lib/utils";
import { localDateStr } from "@/lib/utils";

const initials = ["L", "M", "X", "J", "V", "S", "D"];

export function WeekStrip({
  progressByDate = {},
  onSelectDay,
}: {
  progressByDate?: Record<string, number>;
  onSelectDay?: (d: Date) => void;
}) {
  const today = new Date();
  const ws = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  return (
    <div className="grid grid-cols-7 gap-1 px-2">
      {days.map((d, i) => {
        const isToday = isSameDay(d, today);
        const key = localDateStr(d);
        const prog = progressByDate[key] ?? 0;
        const complete = prog >= 4;
        const partial = prog > 0 && prog < 4;
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
                  ? "bg-accent/20 text-foreground font-bold ring-1 ring-accent/40"
                  : "text-foreground/70"
              )}
            >
              {format(d, "d")}
              {isToday && (
                <span className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-accent" />
              )}
              {!isToday && (complete || partial) && (
                <span
                  className={cn(
                    "absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rounded-full",
                    complete ? "bg-success" : "bg-accent"
                  )}
                />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
