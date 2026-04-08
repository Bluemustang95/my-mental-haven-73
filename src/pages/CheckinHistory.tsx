import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const bodyPartLabels: Record<string, string> = {
  head: "Cabeza",
  neck: "Cuello",
  chest: "Pecho",
  stomach: "Estómago",
  left_shoulder: "Hombro izq.",
  right_shoulder: "Hombro der.",
  left_arm: "Brazo izq.",
  right_arm: "Brazo der.",
  pelvis: "Pelvis",
  left_leg: "Pierna izq.",
  right_leg: "Pierna der.",
  left_foot: "Pie izq.",
  right_foot: "Pie der.",
};

interface BodyEntry {
  id: string;
  body_part: string;
  note: string | null;
  created_at: string | null;
}

export default function CheckinHistory() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<BodyEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("body_map_entries")
      .select("id, body_part, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setEntries((data as BodyEntry[]) || []);
        setLoading(false);
      });
  }, [user]);

  // Group entries by date+time (same batch = same created_at roughly)
  const grouped = entries.reduce<Record<string, BodyEntry[]>>((acc, e) => {
    const key = e.created_at ? e.created_at.slice(0, 16) : "unknown";
    if (!acc[key]) acc[key] = [];
    acc[key].push(e);
    return acc;
  }, {});

  const groups = Object.entries(grouped);

  const formatGroupDate = (dateStr: string): { dayName: string; date: string; time: string } => {
    if (dateStr === "unknown") return { dayName: "", date: "", time: "" };
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
          onClick={() => navigate("/diario/checkin")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-card border border-border/50 text-muted-foreground active:scale-95 transition"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="font-display text-lg font-semibold text-foreground">Historial somático</h1>
          <p className="text-[11px] text-muted-foreground">Tus registros corporales anteriores.</p>
        </div>
      </div>

      {/* Timeline */}
      <div className="px-5 pb-8">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          </div>
        ) : groups.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-sm text-muted-foreground">Todavía no tenés registros.</p>
            <p className="text-xs text-muted-foreground/70 mt-1">Hacé un check-in somático para comenzar.</p>
          </div>
        ) : (
          <div className="relative ml-3 border-l-2 border-border/40 pl-6 space-y-6">
            {groups.map(([key, items], i) => {
              const { dayName, date, time } = formatGroupDate(key);
              const note = items[0]?.note;
              const parts = items.map((e) => bodyPartLabels[e.body_part] || e.body_part);

              return (
                <motion.div
                  key={key}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="relative"
                >
                  {/* Timeline dot */}
                  <div className="absolute -left-[31px] top-1 h-3 w-3 rounded-full border-2 border-accent bg-[#FDFCFB] dark:bg-background" />

                  <div className="rounded-2xl bg-card border border-border/40 p-4 shadow-[0_1px_6px_-2px_hsl(var(--foreground)/0.04)]">
                    {/* Date header */}
                    <div className="flex items-baseline justify-between mb-2">
                      <span className="font-display text-[11px] font-medium text-accent-foreground capitalize">
                        {dayName}
                      </span>
                      <span className="text-[10px] text-muted-foreground">{time}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground/70 mb-3">{date}</p>

                    {/* Body zones */}
                    <div className="flex flex-wrap gap-1.5 mb-2">
                      {parts.map((part) => (
                        <span
                          key={part}
                          className="rounded-full bg-destructive/8 border border-destructive/15 px-2.5 py-0.5 text-[10px] font-medium text-destructive"
                        >
                          Tensión en {part}
                        </span>
                      ))}
                    </div>

                    {/* Note */}
                    {note && (
                      <p className="text-sm text-foreground leading-relaxed font-body mt-2">{note}</p>
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
