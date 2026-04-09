import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface RelEntry {
  id: string;
  person: string;
  what_happened: string | null;
  what_i_wished: string | null;
  emotion: string | null;
  created_at: string | null;
}

export default function RelationshipLogHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<RelEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("relationship_logs")
      .select("id, person, what_happened, what_i_wished, emotion, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries((data as RelEntry[]) || []);
        setLoading(false);
      });
  }, [user]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return { dayName: "", date: "", time: "" };
    try {
      const d = new Date(dateStr);
      return {
        dayName: format(d, "EEEE", { locale: es }),
        date: format(d, "d 'de' MMMM yyyy", { locale: es }),
        time: format(d, "HH:mm"),
      };
    } catch {
      return { dayName: "", date: "", time: "" };
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] dark:bg-background safe-area-top">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => navigate("/diario/vinculos")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-muted-foreground active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Historial de vínculos</h1>
          <p className="text-[11px] text-muted-foreground">Tus registros de relaciones anteriores.</p>
        </div>
      </div>

      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Todavía no tenés registros.</p>
          </div>
        ) : (
          <div className="relative ml-3 border-l-2 border-border/40 pl-6 space-y-6">
            {entries.map((entry, i) => {
              const { dayName, date, time } = formatDate(entry.created_at);
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-[#FDFCFB] dark:bg-background" />
                  <div className="rounded-2xl bg-card border border-border/40 p-4 shadow-[0_1px_6px_-2px_hsl(var(--foreground)/0.04)]">
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-display text-[11px] font-medium text-accent-foreground capitalize">{dayName}</span>
                      <span className="text-[10px] text-muted-foreground">{time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mb-3">{date}</p>

                    <p className="font-display text-sm font-medium text-foreground mb-2">{entry.person}</p>

                    {entry.what_happened && (
                      <div className="mb-2">
                        <p className="font-display text-[10px] text-muted-foreground mb-0.5">¿Qué pasó?</p>
                        <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">{entry.what_happened}</p>
                      </div>
                    )}

                    {entry.what_i_wished && (
                      <div className="mb-2">
                        <p className="font-display text-[10px] text-muted-foreground mb-0.5">Lo que hubiera querido decir</p>
                        <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">{entry.what_i_wished}</p>
                      </div>
                    )}

                    {entry.emotion && (
                      <span className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground">
                        {entry.emotion}
                      </span>
                    )}
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
