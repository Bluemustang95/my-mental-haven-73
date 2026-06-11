import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wind, Eye, MessageSquare, Plus } from "lucide-react";
import { motion } from "framer-motion";
import { WeekStrip } from "@/components/home/WeekStrip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import { addDays, startOfWeek } from "date-fns";
import { DayHistorySheet } from "@/components/mindfulness/DayHistorySheet";
import { QuickAddSheet } from "@/components/mindfulness/QuickAddSheet";

export default function MindfulnessHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progressByDate, setProgressByDate] = useState<Record<string, number>>({});
  const [historyDate, setHistoryDate] = useState<Date | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = addDays(start, 7);
      const { data } = await supabase
        .from("exercise_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("exercise_type", "mindfulness")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        const k = localDateStr(new Date(r.created_at));
        map[k] = Math.min(4, (map[k] ?? 0) + 1);
      });
      setProgressByDate(map);
    })();
  }, [user]);

  const todayKey = localDateStr(new Date());
  const didSomethingToday = (progressByDate[todayKey] ?? 0) > 0;

  const modules = [
    {
      to: "/herramientas/mindfulness/respiracion",
      icon: Wind,
      title: "Respiración",
      desc: "Patrones guiados para regular tu sistema nervioso.",
      from: "#FB923C",
      to2: "#FCD34D",
    },
    {
      to: "/herramientas/mindfulness/observar",
      icon: Eye,
      title: "Mira el presente",
      desc: "Notá lo que aparece sin engancharte.",
      from: "#60A5FA",
      to2: "#A78BFA",
    },
    {
      to: "/herramientas/mindfulness/describir",
      icon: MessageSquare,
      title: "Ver los hechos",
      desc: "Hechos vs. juicios y anatomía emocional.",
      from: "#A78BFA",
      to2: "#F472B6",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="px-5 pt-12">
        <button onClick={() => navigate("/herramientas")} className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <h1 className="font-serif text-3xl font-bold text-[#101927]">Mindfulness</h1>
        <p className="mt-1 text-sm text-muted-foreground">Tres caminos para estar más presente.</p>

        <div className="mt-4">
          <WeekStrip
            progressByDate={progressByDate}
            onSelectDay={(d) => {
              setHistoryDate(d);
              setHistoryOpen(true);
            }}
          />
        </div>
      </div>

      <div className="mt-5 space-y-2 px-5">
        {modules.map((m) => (
          <motion.button
            key={m.to}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(m.to)}
            className="w-full rounded-2xl bg-white p-3 text-left shadow-sm flex items-center gap-3"
          >
            <div
              className="h-11 w-11 rounded-xl flex items-center justify-center shrink-0"
              style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to2})` }}
            >
              <m.icon size={20} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-display text-base font-semibold text-[#101927]">{m.title}</div>
              <div className="text-[11px] leading-snug text-muted-foreground line-clamp-1">{m.desc}</div>
            </div>
          </motion.button>
        ))}
      </div>

      {didSomethingToday && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setQuickAddOpen(true)}
          aria-label="Agregar ejercicio"
          className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full bg-[#101927] text-white shadow-lg flex items-center justify-center"
        >
          <Plus size={24} />
        </motion.button>
      )}

      <DayHistorySheet
        date={historyDate}
        scope="mindfulness"
        open={historyOpen}
        onOpenChange={setHistoryOpen}
      />
      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
