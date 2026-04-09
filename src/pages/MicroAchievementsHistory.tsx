import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star } from "@phosphor-icons/react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface AchievementEntry {
  id: string;
  achievement_text: string;
  achievement_date: string | null;
  created_at: string | null;
}

export default function MicroAchievementsHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<AchievementEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("micro_achievements")
      .select("id, achievement_text, achievement_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries((data as AchievementEntry[]) || []);
        setLoading(false);
      });
  }, [user]);

  // Group by date
  const grouped = entries.reduce<Record<string, AchievementEntry[]>>((acc, e) => {
    const key = e.achievement_date || (e.created_at ? e.created_at.slice(0, 10) : "unknown");
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const groups = Object.entries(grouped);

  const formatGroupDate = (dateStr: string) => {
    if (dateStr === "unknown") return { dayName: "", date: "" };
    try {
      const d = new Date(dateStr + "T12:00:00");
      return {
        dayName: format(d, "EEEE", { locale: es }),
        date: format(d, "d 'de' MMMM yyyy", { locale: es }),
      };
    } catch {
      return { dayName: "", date: "" };
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-background safe-area-top">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => navigate("/diario/logros")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-muted-foreground active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Historial de logros</h1>
          <p className="text-[11px] text-muted-foreground">Tus micro-logros registrados.</p>
        </div>
      </div>

      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Todavía no tenés logros registrados.</p>
          </div>
        ) : (
          <div className="relative ml-3 border-l-2 border-border/40 pl-6 space-y-6">
            {groups.map(([key, items], i) => {
              const { dayName, date } = formatGroupDate(key);
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
                    <div className="mb-2">
                      <span className="font-display text-[11px] font-medium text-accent-foreground capitalize">{dayName}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mb-3">{date}</p>

                    <div className="space-y-2">
                      {items.map((a) => (
                        <div key={a.id} className="flex items-center gap-2 rounded-xl border border-accent/20 bg-accent/5 p-2.5">
                          <Star size={14} weight="fill" className="text-accent shrink-0" />
                          <p className="text-sm font-body">{a.achievement_text}</p>
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
