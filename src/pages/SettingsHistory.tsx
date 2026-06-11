import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronDown, ChevronRight } from "lucide-react";
import { format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { useAuth } from "@/hooks/useAuth";
import { CalendarActivity, fetchCalendarActivities } from "@/lib/calendarActivity";
import { cn } from "@/lib/utils";

type DayBlock = { date: Date; activities: CalendarActivity[] };

const FILTERS = [
  { id: "all", label: "Todo" },
  { id: "test", label: "Tests" },
  { id: "reading", label: "Lecturas" },
  { id: "exercise", label: "Check-ins" },
  { id: "goal", label: "Objetivos" },
] as const;

export default function SettingsHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [blocks, setBlocks] = useState<DayBlock[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");

  useEffect(() => {
    if (!user) return;
    (async () => {
      const days = Array.from({ length: 30 }, (_, i) => subDays(new Date(), i));
      const results = await Promise.all(
        days.map(async (d) => ({ date: d, activities: await fetchCalendarActivities(user.id, d) }))
      );
      setBlocks(results.filter((b) => b.activities.length > 0));
      setLoading(false);
    })();
  }, [user]);

  const filtered = blocks
    .map((b) => ({
      ...b,
      activities:
        filter === "all" ? b.activities : b.activities.filter((a) => a.type === filter),
    }))
    .filter((b) => b.activities.length > 0);

  return (
    <div className="min-h-screen bg-[#F2F2F7] pb-32 safe-area-top">
      <div className="mx-auto max-w-md">
        <div className="flex items-center px-4 pt-12 pb-2">
          <button
            onClick={() => navigate(-1)}
            className="-ml-2 flex h-9 w-9 items-center justify-center text-accent"
            aria-label="Volver"
          >
            <ChevronLeft size={26} />
          </button>
          <div className="flex-1 text-center">
            <p className="text-xs text-muted-foreground">Historial</p>
          </div>
          <div className="w-9" />
        </div>

        <div className="px-5 pb-3">
          <h1 className="font-display text-2xl font-semibold text-[#101927]">
            Tu historial
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Todo lo que hiciste, día por día.
          </p>
        </div>

        <div className="flex gap-2 overflow-x-auto px-5 pb-3 no-scrollbar">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={cn(
                "shrink-0 rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider transition",
                filter === f.id
                  ? "border-[#101927] bg-[#101927] text-white"
                  : "border-black/10 bg-white text-[#101927]/70"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center pt-12">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="px-5 pt-12 text-center text-sm text-muted-foreground">
            Todavía no hay actividad registrada.
          </p>
        ) : (
          <div className="space-y-2 px-3">
            {filtered.map((b) => {
              const key = format(b.date, "yyyy-MM-dd");
              const isOpen = open[key] ?? false;
              return (
                <div key={key} className="overflow-hidden rounded-2xl bg-white shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                  <button
                    onClick={() => setOpen((o) => ({ ...o, [key]: !isOpen }))}
                    className="flex w-full items-center justify-between px-4 py-3 active:bg-black/[0.03]"
                  >
                    <div className="text-left">
                      <p className="font-display text-sm font-semibold capitalize text-[#101927]">
                        {format(b.date, "EEEE d 'de' MMMM", { locale: es })}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {b.activities.length} actividad{b.activities.length === 1 ? "" : "es"}
                      </p>
                    </div>
                    {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </button>
                  {isOpen && (
                    <div className="border-t border-black/[0.05] px-4 py-2">
                      {b.activities.map((a, i) => (
                        <div key={i} className="flex items-start gap-3 py-2">
                          <span className="mt-0.5 w-10 shrink-0 text-[11px] font-mono text-muted-foreground">
                            {a.time || "—"}
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[13px] font-medium text-[#101927]">{a.label}</p>
                            {a.detail && (
                              <p className="text-[12px] leading-snug text-muted-foreground">
                                {a.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
