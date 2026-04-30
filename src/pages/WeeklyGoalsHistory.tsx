import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface GoalEntry {
  id: string;
  goal_text: string;
  completed: boolean | null;
  week_start: string;
  created_at: string | null;
}

export default function WeeklyGoalsHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<GoalEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("weekly_goals")
      .select("id, goal_text, completed, week_start, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries((data as GoalEntry[]) || []);
        setLoading(false);
      });
  }, [user]);

  // Group by week_start
  const grouped = entries.reduce<Record<string, GoalEntry[]>>((acc, e) => {
    const key = e.week_start;
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const groups = Object.entries(grouped);

  const formatWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr + "T12:00:00");
      return {
        label: `Semana del ${format(d, "d 'de' MMMM yyyy", { locale: es })}`,
      };
    } catch {
      return { label: dateStr };
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-background safe-area-top">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-muted-foreground active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Historial de objetivos</h1>
          <p className="text-[11px] text-muted-foreground">Tus metas semanales anteriores.</p>
        </div>
      </div>

      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Todavía no tenés objetivos registrados.</p>
          </div>
        ) : (
          <div className="relative ml-3 border-l-2 border-border/40 pl-6 space-y-6">
            {groups.map(([key, items], i) => {
              const { label } = formatWeek(key);
              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-[#FDFCFB] dark:bg-background" />
                  <div className="rounded-2xl bg-card border border-border/40 p-4 shadow-[0_1px_6px_-2px_hsl(var(--foreground)/0.04)]">
                    <p className="font-display text-[11px] font-medium text-accent-foreground mb-3">{label}</p>

                    <div className="space-y-2">
                      {items.map((g) => (
                        <div key={g.id} className="flex items-center gap-2.5">
                          <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${g.completed ? "bg-accent" : "bg-border"}`} />
                          <p className={`text-sm font-body ${g.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                            {g.goal_text}
                          </p>
                          <span className={`ml-auto rounded-full border px-2 py-0.5 font-display text-[10px] ${g.completed ? "border-accent bg-accent/10 text-accent-foreground" : "border-border text-muted-foreground"}`}>
                            {g.completed ? "✓" : "Pendiente"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
