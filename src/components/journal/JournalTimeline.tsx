import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, CalendarBlank, Brain, Notebook, Heart, Trophy, ChatCircleDots } from "@phosphor-icons/react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { motion } from "framer-motion";

interface TimelineEvent {
  id: string;
  type: string;
  label: string;
  detail: string;
  date: string;
  icon: typeof Brain;
  color: string;
}

export default function JournalTimeline() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadTimeline();
  }, [user]);

  const loadTimeline = async () => {
    if (!user) return;
    const allEvents: TimelineEvent[] = [];

    // Fetch journal entries
    const { data: journals } = await supabase
      .from("journal_entries")
      .select("id, created_at, content")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50);

    journals?.forEach((j: any) => {
      allEvents.push({
        id: j.id,
        type: "journal",
        label: "Entrada de diario",
        detail: j.content?.slice(0, 80) + (j.content?.length > 80 ? "..." : ""),
        date: j.created_at,
        icon: Notebook,
        color: "bg-accent/15 text-accent-foreground",
      });
    });

    // Fetch thought records
    const { data: thoughts } = await supabase
      .from("thought_records")
      .select("id, created_at, situation")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    thoughts?.forEach((t: any) => {
      allEvents.push({
        id: t.id,
        type: "thought",
        label: "Registro de pensamiento",
        detail: t.situation?.slice(0, 80) || "",
        date: t.created_at,
        icon: Brain,
        color: "bg-secondary text-secondary-foreground",
      });
    });

    // Fetch internal dialogues
    const { data: dialogues } = await supabase
      .from("internal_dialogues")
      .select("id, created_at, situation")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    dialogues?.forEach((d: any) => {
      allEvents.push({
        id: d.id,
        type: "dialogue",
        label: "Diálogo interno",
        detail: d.situation?.slice(0, 80) || "Sin situación",
        date: d.created_at,
        icon: ChatCircleDots,
        color: "bg-primary/10 text-foreground",
      });
    });

    // Fetch test results
    const { data: tests } = await supabase
      .from("test_results")
      .select("id, created_at, test_type, score, severity")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20);

    tests?.forEach((t: any) => {
      allEvents.push({
        id: t.id,
        type: "test",
        label: `Test ${t.test_type?.toUpperCase()}`,
        detail: `Puntaje: ${t.score} — ${t.severity || ""}`,
        date: t.created_at,
        icon: Heart,
        color: "bg-destructive/10 text-foreground",
      });
    });

    // Fetch micro achievements
    const { data: achievements } = await supabase
      .from("micro_achievements")
      .select("id, created_at, achievement_text")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(30);

    achievements?.forEach((a: any) => {
      allEvents.push({
        id: a.id,
        type: "achievement",
        label: "Micro-logro",
        detail: a.achievement_text,
        date: a.created_at,
        icon: Trophy,
        color: "bg-accent/10 text-accent-foreground",
      });
    });

    // Sort by date descending
    allEvents.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setEvents(allEvents);
    setLoading(false);
  };

  // Group by date
  const grouped: Record<string, TimelineEvent[]> = {};
  events.forEach((e) => {
    const day = e.date?.split("T")[0] || "unknown";
    if (!grouped[day]) grouped[day] = [];
    grouped[day].push(e);
  });

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/herramientas/journal")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Línea temporal</h1>
      </div>

      <p className="mb-5 text-xs text-muted-foreground">Tu proceso terapéutico en perspectiva.</p>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <CalendarBlank size={40} weight="duotone" className="mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Tu línea temporal se irá construyendo</p>
          <p className="text-xs text-muted-foreground">a medida que uses el diario.</p>
        </div>
      ) : (
        <div className="relative flex-1">
          {/* Vertical line */}
          <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />

          {Object.entries(grouped).map(([day, dayEvents], gi) => (
            <div key={day} className="mb-6">
              <div className="mb-2 flex items-center gap-3 pl-0">
                <div className="relative z-10 h-[10px] w-[10px] rounded-full bg-accent ring-4 ring-background ml-[10px]" />
                <span className="font-display text-xs font-medium text-muted-foreground">
                  {format(new Date(day), "d 'de' MMMM, yyyy", { locale: es })}
                </span>
              </div>

              <div className="ml-[31px] space-y-2">
                {dayEvents.map((event, i) => {
                  const Icon = event.icon;
                  return (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: (gi * dayEvents.length + i) * 0.03 }}
                      className="rounded-xl border border-border bg-card p-3"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className={`flex h-5 w-5 items-center justify-center rounded-md ${event.color}`}>
                          <Icon size={12} weight="duotone" />
                        </div>
                        <span className="font-display text-[11px] font-medium">{event.label}</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{event.detail}</p>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
