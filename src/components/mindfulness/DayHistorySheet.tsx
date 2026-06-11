import { useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { CalendarActivity, fetchCalendarActivities } from "@/lib/calendarActivity";
import { localDateStr } from "@/lib/utils";
import { addDays } from "date-fns";

type Props = {
  date: Date | null;
  scope: "mindfulness" | "all";
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function DayHistorySheet({ date, scope, open, onOpenChange }: Props) {
  const { user } = useAuth();
  const [items, setItems] = useState<CalendarActivity[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !date || !user) return;
    setLoading(true);
    (async () => {
      if (scope === "all") {
        const list = await fetchCalendarActivities(user.id, date);
        setItems(list);
      } else {
        const ds = localDateStr(date);
        const dayStart = `${ds}T03:00:00Z`;
        const dayEnd = `${localDateStr(addDays(date, 1))}T03:00:00Z`;
        const { data } = await supabase
          .from("exercise_sessions")
          .select("id, created_at, exercise_type, exercise_name, duration_seconds, mood_before, mood_after")
          .eq("user_id", user.id)
          .eq("exercise_type", "mindfulness")
          .gte("created_at", dayStart)
          .lt("created_at", dayEnd)
          .order("created_at");
        setItems(
          (data ?? []).map((e: any) => {
            const dur = e.duration_seconds ? `${Math.round(e.duration_seconds / 60)} min` : "Completado";
            const suds =
              e.mood_before != null && e.mood_after != null
                ? ` · SUDS ${e.mood_before}→${e.mood_after}`
                : "";
            return {
              type: "exercise" as const,
              label: e.exercise_name || "Mindfulness",
              detail: `${dur}${suds}`,
              time: format(new Date(e.created_at), "HH:mm"),
            };
          })
        );
      }
      setLoading(false);
    })();
  }, [open, date, user, scope]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-none bg-[#FDFCFB] px-5 pb-8 pt-5 max-h-[75vh] overflow-y-auto"
      >
        <SheetHeader className="text-left">
          <SheetTitle className="font-display text-base font-semibold capitalize text-[#101927]">
            {date ? format(date, "EEEE d 'de' MMMM", { locale: es }) : ""}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">
            {scope === "mindfulness" ? "Sesiones de mindfulness" : "Toda tu actividad del día"}
          </p>
        </SheetHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#101927] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Todavía no hiciste nada este día.
            </p>
          ) : (
            <div className="divide-y divide-black/[0.05] rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
              {items.map((a, i) => (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className="mt-0.5 w-10 shrink-0 text-[11px] font-mono text-muted-foreground">
                    {a.time || "—"}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-[#101927]">{a.label}</p>
                    {a.detail && (
                      <p className="text-[12px] leading-snug text-muted-foreground">{a.detail}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
