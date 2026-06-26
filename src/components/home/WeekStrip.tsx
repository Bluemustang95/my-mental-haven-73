import { addDays, format, isSameDay, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { localDateStr } from "@/lib/utils";

const initials = ["L", "M", "X", "J", "V", "S", "D"];
const dayNames = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];

export function WeekStrip({
  progressByDate = {},
  onSelectDay,
  selectedDate,
}: {
  progressByDate?: Record<string, number>;
  onSelectDay?: (d: Date) => void;
  selectedDate?: Date;
}) {
  const today = new Date();
  const ws = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
  const active = selectedDate ?? today;

  return (
    <div className="glass-premium flex w-full items-stretch justify-between gap-1 rounded-[26px] px-2 py-2">
      {days.map((d, i) => {
        const isActive = isSameDay(d, active);
        const isToday = isSameDay(d, today);
        const key = localDateStr(d);
        const prog = progressByDate[key] ?? 0;
        return (
          <button
            key={i}
            onClick={() => {
              onSelectDay?.(d);
              toast(`Visualizando el progreso del ${dayNames[i]}`, { duration: 1800 });
            }}
            className={cn(
              "relative flex flex-1 flex-col items-center justify-center rounded-2xl py-2 transition-all",
              isActive ? "bg-resma-navy text-white shadow-[0_10px_24px_-12px_rgba(16,25,39,0.7)]" : "text-muted-foreground/70"
            )}
          >
            <span className={cn("text-[10px] font-semibold tracking-[0.12em]", isActive ? "text-white/70" : "text-muted-foreground/60")}>
              {initials[i]}
            </span>
            <motion.span
              layoutId={isActive ? "weekDayBadge" : undefined}
              className={cn(
                "mt-0.5 font-serifElegant text-xl font-bold",
                isActive ? "text-white" : "text-foreground/70"
              )}
            >
              {format(d, "d", { locale: es })}
            </motion.span>
            {isToday && (
              <span className={cn("mt-1 h-1 w-1 rounded-full", isActive ? "bg-resma-gold" : prog > 0 ? "bg-resma-teal" : "bg-resma-gold/60")} />
            )}
            {!isToday && prog > 0 && (
              <span className="mt-1 h-1 w-1 rounded-full bg-resma-teal/80" />
            )}
          </button>
        );
      })}
    </div>
  );
}
