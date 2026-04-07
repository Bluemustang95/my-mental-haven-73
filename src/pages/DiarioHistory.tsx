import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface JournalEntry {
  id: string;
  content: string;
  emotion_tags: string[] | null;
  created_at: string | null;
  prompt: string | null;
}

function summarize(text: string, maxLen = 100): string {
  if (text.length <= maxLen) return text;
  const cut = text.slice(0, maxLen);
  const lastSpace = cut.lastIndexOf(" ");
  return (lastSpace > 60 ? cut.slice(0, lastSpace) : cut) + "…";
}

export default function DiarioHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("journal_entries")
      .select("id, content, emotion_tags, created_at, prompt")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries((data as JournalEntry[]) || []);
        setLoading(false);
      });
  }, [user]);

  const formatEntryDate = (dateStr: string | null) => {
    if (!dateStr) return "";
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
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-4">
        <button
          onClick={() => navigate("/diario")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-muted-foreground active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Historial</h1>
          <p className="text-[11px] text-muted-foreground">Todo lo que escribiste en tu diario.</p>
        </div>
      </div>

      {/* Entries */}
      <div className="px-5 pb-8 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Todavía no tenés entradas.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Escribí algo en tu diario para comenzar.</p>
          </div>
        ) : (
          entries.map((entry, i) => {
            const { dayName, date, time } = formatEntryDate(entry.created_at);
            const isExpanded = expanded === entry.id;

            return (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <button
                  onClick={() => setExpanded(isExpanded ? null : entry.id)}
                  className="w-full rounded-2xl bg-card border border-border/40 p-4 text-left shadow-[0_1px_6px_-2px_hsl(var(--foreground)/0.04)] transition-all active:shadow-none"
                >
                  {/* Date header */}
                  <div className="flex items-baseline justify-between mb-2">
                    <span className="font-display text-[11px] font-medium text-accent-foreground capitalize">
                      {dayName}
                    </span>
                    <span className="text-[10px] text-muted-foreground">{time}</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground/70 mb-2">{date}</p>

                  {/* Summary / Full content */}
                  <p className="text-sm text-foreground leading-relaxed font-body">
                    {isExpanded ? entry.content : summarize(entry.content)}
                  </p>

                  {/* Emotion tags */}
                  {entry.emotion_tags && entry.emotion_tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {entry.emotion_tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-full bg-accent/10 border border-accent/20 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </button>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
