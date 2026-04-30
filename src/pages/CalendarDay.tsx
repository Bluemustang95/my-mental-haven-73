import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Brain, Flag, Flower, Heart, Heartbeat, Notebook, Target, Trophy } from "@phosphor-icons/react";
import { format, isValid, parse } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { CalendarActivity, fetchCalendarActivities } from "@/lib/calendarActivity";

const activityConfig: Record<CalendarActivity["type"], { icon: typeof Brain; color: string }> = {
  journal: { icon: Notebook, color: "text-accent" },
  thought: { icon: Brain, color: "text-[hsl(193_50%_50%)]" },
  test: { icon: Heartbeat, color: "text-[hsl(250_50%_60%)]" },
  exercise: { icon: Flower, color: "text-[hsl(var(--mood-5))]" },
  dream: { icon: Flower, color: "text-[hsl(var(--mood-4))]" },
  goal: { icon: Target, color: "text-accent" },
};

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export default function CalendarDay() {
  const navigate = useNavigate();
  const { date } = useParams();
  const { user } = useAuth();
  const [activities, setActivities] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(true);

  const day = useMemo(() => parse(date ?? "", "yyyy-MM-dd", new Date()), [date]);

  useEffect(() => {
    if (!user || !isValid(day)) return;
    setLoading(true);
    fetchCalendarActivities(user.id, day).then((items) => {
      setActivities(items);
      setLoading(false);
    });
  }, [day, user]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] px-6 pb-8 pt-12 dark:bg-background">
      <header className="sticky top-0 z-10 -mx-6 mb-6 flex items-center justify-center bg-[#FDFCFB]/95 px-6 pb-4 pt-1 backdrop-blur dark:bg-background/95">
        <button
          onClick={() => navigate(-1)}
          className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted/45"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <div className="text-center">
          <h1 className="font-display text-[16px] font-semibold capitalize text-foreground">
            {isValid(day) ? capitalizeFirst(format(day, "EEEE d", { locale: es })) : "Día"}
          </h1>
          <p className="text-[11px] text-muted-foreground">
            {isValid(day) ? capitalizeFirst(format(day, "MMMM yyyy", { locale: es })) : ""}
          </p>
        </div>
      </header>

      <div className="mb-6 grid grid-cols-2 gap-3">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/diario/checkin")}
          className="flex min-h-[132px] flex-col items-start rounded-[2.5rem] border border-resource-safety-accent/15 bg-resource-safety-bg p-5 text-left text-resource-safety-accent shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/70">
            <Heart size={20} weight="duotone" />
          </span>
          <span className="mt-auto pt-4 font-display text-sm font-semibold leading-tight">Check-in rápido</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/diario/objetivos")}
          className="flex min-h-[132px] flex-col items-start rounded-[2.5rem] border border-resource-values-accent/15 bg-resource-values-bg p-5 text-left text-resource-values-accent shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/70">
            <Flag size={20} weight="duotone" />
          </span>
          <span className="mt-auto pt-4 font-display text-sm font-semibold leading-tight">Mis objetivos</span>
        </motion.button>
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => navigate("/diario/logros")}
          className="col-span-2 flex min-h-[118px] flex-col items-start rounded-[2.5rem] border border-resource-breathing-accent/15 bg-resource-breathing-bg p-5 text-left text-resource-breathing-accent shadow-sm"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-card/70">
            <Trophy size={20} weight="duotone" />
          </span>
          <span className="mt-auto pt-4 font-display text-sm font-semibold leading-tight">Micro-logros</span>
        </motion.button>
      </div>

      <section>
        <h2 className="mb-4 font-display text-[11px] font-medium uppercase tracking-widest text-muted-foreground">
          Información registrada
        </h2>
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : activities.length === 0 ? (
          <p className="py-10 text-center text-xs italic text-muted-foreground">No hubo actividad registrada este día.</p>
        ) : (
          <div className="space-y-2.5">
            {activities.map((act, i) => {
              const cfg = activityConfig[act.type];
              const Icon = cfg.icon;
              return (
                <article key={`${act.label}-${i}`} className="flex items-start gap-3 rounded-2xl border border-border/40 bg-card/55 p-3.5">
                  <div className={cn("mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-muted/40", cfg.color)}>
                    <Icon size={15} weight="duotone" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[13px] font-medium leading-snug text-foreground">{act.label}</p>
                    <p className="mt-1 text-[12px] leading-relaxed text-muted-foreground">{act.detail}</p>
                  </div>
                  <span className="mt-0.5 shrink-0 text-[10px] text-muted-foreground/70">{act.time}</span>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
