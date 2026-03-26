import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft, CalendarBlank, Brain, Notebook, Trophy, ChatCircleDots,
  Star, PencilSimple, Heartbeat, CaretDown, CaretUp,
} from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion, AnimatePresence } from "framer-motion";

interface TimelineEvent {
  id: string;
  type: "journal" | "thought" | "dialogue" | "test" | "achievement";
  label: string;
  detail: string;
  date: string;
}

const typeConfig: Record<TimelineEvent["type"], { icon: typeof Brain; bg: string; accent: string }> = {
  test:        { icon: Heartbeat,       bg: "bg-[hsl(250_60%_95%)]", accent: "border-l-[hsl(250_50%_75%)]" },
  achievement: { icon: Star,            bg: "bg-[hsl(140_40%_94%)]", accent: "border-l-[hsl(var(--mood-5))]" },
  journal:     { icon: PencilSimple,    bg: "bg-[hsl(35_30%_94%)]",  accent: "border-l-[hsl(var(--accent))]" },
  thought:     { icon: Brain,           bg: "bg-[hsl(193_40%_94%)]", accent: "border-l-[hsl(193_50%_70%)]" },
  dialogue:    { icon: ChatCircleDots,  bg: "bg-[hsl(35_30%_94%)]",  accent: "border-l-[hsl(var(--accent))]" },
};

export default function JournalTimeline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [collapsedDays, setCollapsedDays] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;
    loadTimeline();
  }, [user]);

  const loadTimeline = async () => {
    if (!user) return;
    const all: TimelineEvent[] = [];

    const [journals, thoughts, dialogues, tests, achievements] = await Promise.all([
      supabase.from("journal_entries").select("id, created_at, content").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50),
      supabase.from("thought_records").select("id, created_at, situation").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
      supabase.from("internal_dialogues").select("id, created_at, situation").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("test_results").select("id, created_at, test_type, score, severity").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20),
      supabase.from("micro_achievements").select("id, created_at, achievement_text").eq("user_id", user.id).order("created_at", { ascending: false }).limit(30),
    ]);

    journals.data?.forEach((j: any) => all.push({ id: j.id, type: "journal", label: "Entrada de diario", detail: j.content?.slice(0, 100) + (j.content?.length > 100 ? "…" : ""), date: j.created_at }));
    thoughts.data?.forEach((t: any) => all.push({ id: t.id, type: "thought", label: "Registro de pensamiento", detail: t.situation?.slice(0, 100) || "", date: t.created_at }));
    dialogues.data?.forEach((d: any) => all.push({ id: d.id, type: "dialogue", label: "Diálogo interno", detail: d.situation?.slice(0, 100) || "Sin situación", date: d.created_at }));
    tests.data?.forEach((t: any) => all.push({ id: t.id, type: "test", label: `Test ${t.test_type}`, detail: `Puntaje: ${t.score}${t.severity ? ` · ${t.severity}` : ""}`, date: t.created_at }));
    achievements.data?.forEach((a: any) => all.push({ id: a.id, type: "achievement", label: a.achievement_text, detail: "Micro-logro alcanzado ✦", date: a.created_at }));

    all.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(all);
    setLoading(false);
  };

  const toggleDay = (day: string) => {
    setCollapsedDays((prev) => {
      const next = new Set(prev);
      next.has(day) ? next.delete(day) : next.add(day);
      return next;
    });
  };

  // Group by date
  const grouped: [string, TimelineEvent[]][] = [];
  const map = new Map<string, TimelineEvent[]>();
  events.forEach((e) => {
    const day = e.date?.split("T")[0] || "unknown";
    if (!map.has(day)) { map.set(day, []); grouped.push([day, map.get(day)!]); }
    map.get(day)!.push(e);
  });

  const COLLAPSE_THRESHOLD = 4;

  return (
    <div className="flex min-h-screen flex-col pb-4 safe-area-top">
      {/* Header */}
      <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-lg px-5 pt-14 pb-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate("/mi-proceso")} className="rounded-xl p-1.5 text-muted-foreground active:bg-muted">
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="font-display text-lg font-semibold">Tu camino</h1>
            <p className="text-[11px] text-muted-foreground">El mapa de tu recuperación</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center px-8">
          <CalendarBlank size={44} weight="duotone" className="mb-3 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground font-display">Tu línea temporal se irá construyendo</p>
          <p className="text-xs text-muted-foreground mt-1">a medida que registres tu proceso.</p>
        </div>
      ) : (
        <div className="relative px-5 pt-2 flex-1">
          {/* Central timeline spine */}
          <div className="absolute left-[29px] top-0 bottom-0 w-[2px] rounded-full bg-gradient-to-b from-accent/40 via-border to-border/30" />

          {grouped.map(([day, dayEvents], gi) => {
            const isCollapsed = collapsedDays.has(day);
            const shouldCollapse = dayEvents.length > COLLAPSE_THRESHOLD;
            const visibleEvents = isCollapsed ? dayEvents.slice(0, 2) : dayEvents;

            return (
              <div key={day} className="mb-5 last:mb-0">
                {/* ── Date bubble ─────────────── */}
                <div className="relative mb-3 flex items-center">
                  <div className="relative z-10 ml-[18px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-accent shadow-[0_0_0_4px_hsl(var(--background))]">
                    <div className="h-[8px] w-[8px] rounded-full bg-accent-foreground/70" />
                  </div>
                  <span className="ml-3 inline-block rounded-full bg-card px-3 py-1 font-display text-[11px] font-semibold shadow-[0_1px_8px_hsl(var(--foreground)/0.05)] text-foreground">
                    {format(new Date(day), "d 'de' MMMM", { locale: es })}
                  </span>
                </div>

                {/* ── Event cards ─────────────── */}
                <div className="ml-[40px] space-y-2">
                  <AnimatePresence initial={false}>
                    {visibleEvents.map((event, i) => {
                      const cfg = typeConfig[event.type];
                      const Icon = cfg.icon;
                      const isAchievement = event.type === "achievement";

                      return (
                        <motion.div
                          key={event.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          transition={{ delay: i * 0.04, duration: 0.25 }}
                          className={`relative rounded-2xl border-l-[3px] ${cfg.accent} ${cfg.bg} px-3.5 py-3 shadow-[0_1px_6px_hsl(var(--foreground)/0.03)] ${isAchievement ? "ring-1 ring-[hsl(var(--mood-5))]/20" : ""}`}
                        >
                          {/* Connector dot to spine */}
                          <div className="absolute -left-[15.5px] top-4 h-[7px] w-[7px] rounded-full bg-border shadow-[0_0_0_3px_hsl(var(--background))]" />

                          <div className="flex items-start gap-2.5">
                            <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-background/60">
                              <Icon size={15} weight={isAchievement ? "fill" : "duotone"} className={isAchievement ? "text-[hsl(var(--mood-5))]" : "text-muted-foreground"} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`font-display text-[12px] font-semibold leading-snug ${isAchievement ? "text-[hsl(142_40%_35%)]" : "text-foreground"}`}>
                                {event.label}
                              </p>
                              <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                                {event.detail}
                              </p>
                            </div>
                            <span className="shrink-0 text-[9px] text-muted-foreground/60 mt-0.5">
                              {format(new Date(event.date), "HH:mm")}
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>

                  {/* Expand/Collapse for busy days */}
                  {shouldCollapse && (
                    <button
                      onClick={() => toggleDay(day)}
                      className="flex items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium text-muted-foreground transition-colors active:bg-muted"
                    >
                      {isCollapsed ? (
                        <>
                          <CaretDown size={11} /> Ver {dayEvents.length - 2} más
                        </>
                      ) : (
                        <>
                          <CaretUp size={11} /> Colapsar
                        </>
                      )}
                    </button>
                  )}
                </div>
              </div>
            );
          })}

          {/* Journey start marker */}
          <div className="relative mt-2 flex items-center">
            <div className="relative z-10 ml-[18px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-muted shadow-[0_0_0_4px_hsl(var(--background))]">
              <Star size={10} weight="fill" className="text-muted-foreground" />
            </div>
            <span className="ml-3 font-display text-[10px] text-muted-foreground italic">Inicio de tu camino</span>
          </div>
        </div>
      )}
    </div>
  );
}
