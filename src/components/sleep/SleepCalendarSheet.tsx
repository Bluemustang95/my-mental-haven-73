import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isFuture,
  isSameDay,
  isSameMonth,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Moon, ShieldAlert } from "lucide-react";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { cn, localDateStr } from "@/lib/utils";
import { GlassPanel } from "./SleepGlass";

export type DreamRow = {
  id: string;
  dream_date: string | null;
  description: string;
  emotions: string[] | null;
  themes: string[] | null;
  lucid: boolean | null;
};

const NIGHTMARE_KEYS = ["pesadilla", "nightmare", "terror", "angustia", "irt"];

export function isNightmare(d: DreamRow) {
  const tags = [...(d.themes ?? []), ...(d.emotions ?? [])].map((t) => t.toLowerCase());
  return tags.some((t) => NIGHTMARE_KEYS.some((k) => t.includes(k)));
}

const WEEK = ["L", "M", "X", "J", "V", "S", "D"];

/** Tracker nocturno: calendario mensual con sueños y pesadillas registrados. */
export function SleepCalendarSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [cursor, setCursor] = useState(new Date());
  const [dreams, setDreams] = useState<DreamRow[]>([]);
  const [hygiene, setHygiene] = useState<Record<string, number>>({});
  const [selected, setSelected] = useState<string>(localDateStr());
  const today = new Date();

  const from = format(startOfMonth(cursor), "yyyy-MM-dd");
  const to = format(endOfMonth(cursor), "yyyy-MM-dd");

  useEffect(() => {
    if (!open) return;
    let alive = true;
    (async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return;
      const [d, h] = await Promise.all([
        supabase
          .from("dream_log")
          .select("id, dream_date, description, emotions, themes, lucid")
          .eq("user_id", uid)
          .gte("dream_date", from)
          .lte("dream_date", to)
          .order("dream_date", { ascending: false }),
        supabase
          .from("sleep_hygiene_audits")
          .select("audit_date, score")
          .eq("user_id", uid)
          .gte("audit_date", from)
          .lte("audit_date", to),
      ]);
      if (!alive) return;
      setDreams((d.data ?? []) as DreamRow[]);
      const map: Record<string, number> = {};
      (h.data ?? []).forEach((r: any) => {
        map[r.audit_date] = r.score;
      });
      setHygiene(map);
    })();
    return () => {
      alive = false;
    };
  }, [open, from, to]);

  const byDate = useMemo(() => {
    const m = new Map<string, DreamRow[]>();
    dreams.forEach((d) => {
      if (!d.dream_date) return;
      const arr = m.get(d.dream_date) ?? [];
      arr.push(d);
      m.set(d.dream_date, arr);
    });
    return m;
  }, [dreams]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
    const out: Date[] = [];
    for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
    return out;
  }, [cursor]);

  const selectedDreams = byDate.get(selected) ?? [];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="h-[88vh] overflow-y-auto rounded-t-[32px] border-white/10 p-0 text-slate-100 no-scrollbar"
        style={{ background: "linear-gradient(180deg,#070b14 0%,#030712 100%)" }}
      >
        <div className="relative px-5 pb-16 pt-6">
          <div className="pointer-events-none absolute -left-20 top-0 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,70,229,0.25),transparent_70%)] blur-3xl" />
          <div className="relative">
            <p className="font-display text-[11px] font-semibold uppercase tracking-[0.2em] text-[#7cc2c8]">
              Tracker de descanso
            </p>

            <div className="mt-3 flex items-center justify-between">
              <button
                onClick={() => setCursor(addMonths(cursor, -1))}
                aria-label="Mes anterior"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.05]"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="font-mindful text-xl capitalize">
                {format(cursor, "MMMM yyyy", { locale: es })}
              </span>
              <button
                onClick={() => setCursor(addMonths(cursor, 1))}
                aria-label="Mes siguiente"
                className="grid h-9 w-9 place-items-center rounded-full border border-white/10 bg-white/[0.05]"
              >
                <ChevronRight size={16} />
              </button>
            </div>

            <div className="mt-4 grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-[0.14em] text-slate-500">
              {WEEK.map((d, i) => (
                <span key={i}>{d}</span>
              ))}
            </div>

            <div className="mt-2 grid grid-cols-7 gap-1.5">
              {days.map((d) => {
                const key = localDateStr(d);
                const rows = byDate.get(key) ?? [];
                const nightmare = rows.some(isNightmare);
                const inMonth = isSameMonth(d, cursor);
                const isToday = isSameDay(d, today);
                const isSel = key === selected;
                return (
                  <button
                    key={key}
                    disabled={isFuture(d) && !isToday}
                    onClick={() => setSelected(key)}
                    className={cn(
                      "relative flex aspect-square flex-col items-center justify-center rounded-2xl border text-[13px] font-semibold transition",
                      inMonth ? "text-slate-200" : "text-slate-600",
                      isSel
                        ? "border-[#7cc2c8]/60 bg-[#7cc2c8]/15"
                        : "border-white/[0.07] bg-white/[0.03]",
                      isToday && !isSel && "border-white/25",
                      isFuture(d) && !isToday && "opacity-30",
                    )}
                  >
                    {format(d, "d")}
                    {rows.length > 0 && (
                      <span
                        className="absolute bottom-1.5 h-1.5 w-1.5 rounded-full"
                        style={{
                          background: nightmare ? "#c084fc" : "#818cf8",
                          boxShadow: `0 0 8px ${nightmare ? "#c084fc" : "#818cf8"}`,
                        }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mt-4 flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#818cf8]" /> Sueño anotado
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-[#c084fc]" /> Pesadilla
              </span>
            </div>

            {/* Detalle del día */}
            <GlassPanel className="mt-5 p-5">
              <p className="font-display text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
                {format(new Date(`${selected}T12:00:00`), "EEEE d 'de' MMMM", { locale: es })}
              </p>

              {hygiene[selected] !== undefined && (
                <p className="mt-2 text-[12px] text-[#7cc2c8]">
                  Psicohigiene del sueño: {hygiene[selected]}%
                </p>
              )}

              {selectedDreams.length === 0 ? (
                <p className="mt-3 text-sm text-slate-500">
                  No hay registros nocturnos para este día.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {selectedDreams.map((d) => {
                    const bad = isNightmare(d);
                    return (
                      <div
                        key={d.id}
                        className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4"
                      >
                        <p
                          className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em]"
                          style={{ color: bad ? "#c084fc" : "#818cf8" }}
                        >
                          {bad ? <ShieldAlert size={13} /> : <Moon size={13} />}
                          {bad ? "Pesadilla" : "Sueño"}
                          {d.lucid && <span className="text-slate-500">· lúcido</span>}
                        </p>
                        <p className="mt-2 whitespace-pre-wrap text-[13px] leading-relaxed text-slate-200">
                          {d.description}
                        </p>
                        {(d.emotions?.length || d.themes?.length) && (
                          <div className="mt-3 flex flex-wrap gap-1.5">
                            {[...(d.emotions ?? []), ...(d.themes ?? [])].map((t, i) => (
                              <span
                                key={i}
                                className="rounded-full border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] text-slate-300"
                              >
                                {t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </GlassPanel>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
