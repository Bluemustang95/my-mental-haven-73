import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarBlank } from "@phosphor-icons/react";
import { addDays, addMonths, endOfMonth, format, isSameDay, isSameMonth, startOfMonth, startOfWeek } from "date-fns";
import { es } from "date-fns/locale";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localDateStr } from "@/lib/utils";

const dayInitials = ["L", "M", "X", "J", "V", "S", "D"];

function capitalizeFirst(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

function monthGrid(month: Date) {
  const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
  const end = addDays(startOfWeek(endOfMonth(month), { weekStartsOn: 1 }), 6);
  const days: Date[] = [];
  for (let day = start; day <= end; day = addDays(day, 1)) days.push(day);
  return days;
}

export default function CalendarMonth() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const today = new Date();
  const [registeredDays, setRegisteredDays] = useState<Set<string>>(new Set());

  const months = useMemo(() => Array.from({ length: 25 }, (_, i) => addMonths(today, i - 12)), []);

  useEffect(() => {
    if (!user) return;
    const from = localDateStr(startOfMonth(months[0]));
    const to = localDateStr(addDays(endOfMonth(months[months.length - 1]), 1));
    const fromUtc = `${from}T03:00:00Z`;
    const toUtc = `${to}T03:00:00Z`;

    Promise.all([
      supabase.from("daily_checkins").select("checkin_date").eq("user_id", user.id).gte("checkin_date", from).lt("checkin_date", to),
      supabase.from("journal_entries").select("created_at").eq("user_id", user.id).gte("created_at", fromUtc).lt("created_at", toUtc),
      supabase.from("thought_records").select("created_at").eq("user_id", user.id).gte("created_at", fromUtc).lt("created_at", toUtc),
      supabase.from("test_results").select("created_at").eq("user_id", user.id).gte("created_at", fromUtc).lt("created_at", toUtc),
      supabase.from("exercise_sessions").select("created_at").eq("user_id", user.id).gte("created_at", fromUtc).lt("created_at", toUtc),
      supabase.from("dream_log").select("dream_date").eq("user_id", user.id).gte("dream_date", from).lt("dream_date", to),
      supabase.from("micro_achievements").select("created_at").eq("user_id", user.id).gte("created_at", fromUtc).lt("created_at", toUtc),
      supabase.from("body_map_entries").select("created_at").eq("user_id", user.id).gte("created_at", fromUtc).lt("created_at", toUtc),
    ]).then((results) => {
      const dates = new Set<string>();
      results[0].data?.forEach((row: any) => dates.add(row.checkin_date));
      results[1].data?.forEach((row: any) => dates.add(localDateStr(new Date(row.created_at))));
      results[2].data?.forEach((row: any) => dates.add(localDateStr(new Date(row.created_at))));
      results[3].data?.forEach((row: any) => dates.add(localDateStr(new Date(row.created_at))));
      results[4].data?.forEach((row: any) => dates.add(localDateStr(new Date(row.created_at))));
      results[5].data?.forEach((row: any) => dates.add(row.dream_date));
      results[6].data?.forEach((row: any) => dates.add(localDateStr(new Date(row.created_at))));
      results[7].data?.forEach((row: any) => dates.add(localDateStr(new Date(row.created_at))));
      setRegisteredDays(dates);
    });
  }, [months, user]);

  return (
    <div className="min-h-screen bg-[#FDFCFB] px-5 pb-8 pt-12 dark:bg-background">
      <header className="sticky top-0 z-10 -mx-5 mb-5 flex items-center justify-center bg-[#FDFCFB]/95 px-5 pb-4 pt-1 backdrop-blur dark:bg-background/95">
        <button
          onClick={() => navigate("/")}
          className="absolute left-5 flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground active:bg-muted/45"
          aria-label="Volver"
        >
          <ArrowLeft size={22} />
        </button>
        <h1 className="font-display text-[16px] font-semibold text-muted-foreground">Calendario mensual</h1>
        <CalendarBlank className="absolute right-6 text-muted-foreground" size={19} weight="duotone" />
      </header>

      <div className="space-y-9">
        {months.map((month) => (
          <section key={format(month, "yyyy-MM")}>
            <h2 className="mb-4 font-display text-sm font-semibold capitalize text-foreground">
              {capitalizeFirst(format(month, "MMMM yyyy", { locale: es }))}
            </h2>
            <div className="mb-2 grid grid-cols-7 text-center font-display text-[10px] font-semibold text-muted-foreground">
              {dayInitials.map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}
            </div>
            <div className="grid grid-cols-7 gap-y-2">
              {monthGrid(month).map((day) => {
                const ds = localDateStr(day);
                const hasInfo = registeredDays.has(ds);
                const isToday = isSameDay(day, today);
                const isCurrentMonth = isSameMonth(day, month);
                return (
                  <button
                    key={ds}
                    onClick={() => navigate(`/calendario/${ds}`)}
                    className={cn(
                      "flex h-12 flex-col items-center justify-center gap-1 rounded-full font-display text-sm font-medium transition-colors active:bg-muted/45",
                      isCurrentMonth ? "text-foreground" : "text-muted-foreground/30",
                    )}
                  >
                    <span className={cn("flex h-8 w-8 items-center justify-center rounded-full", isToday && "bg-accent/20 text-foreground")}>{day.getDate()}</span>
                    <span className={cn("h-1.5 w-1.5 rounded-full", hasInfo ? "bg-accent/70" : "bg-transparent")} />
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
