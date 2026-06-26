import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wind, Eye, MessageSquare, Plus } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import { addDays, startOfWeek, subDays } from "date-fns";
import { DayHistorySheet } from "@/components/mindfulness/DayHistorySheet";
import { QuickAddSheet } from "@/components/mindfulness/QuickAddSheet";
import { OpenMindfulnessList } from "@/components/mindfulness/OpenMindfulnessList";
import { RecommendedNowChip } from "@/components/mindfulness/RecommendedNowChip";
import { StreakBadge } from "@/components/mindfulness/StreakBadge";

export default function MindfulnessHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progressByDate, setProgressByDate] = useState<Record<string, number>>({});
  const [historyDate, setHistoryDate] = useState<Date | null>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  // (Se eliminó la tarjeta "Continuar" superior — usar OpenMindfulnessList al pie)

  useEffect(() => {
    if (!user) return;
    (async () => {
      const start = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
      const end = addDays(new Date(), 1);
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

  // (La detección de sesión abandonada ahora vive en OpenMindfulnessList)

  const todayKey = localDateStr(new Date());
  const didSomethingToday = (progressByDate[todayKey] ?? 0) > 0;

  const modules = [
    {
      to: "/herramientas/mindfulness/respiracion",
      icon: Wind,
      title: "Respiración",
      desc: "2–5 min · Regular el sistema nervioso",
      from: "#FB923C",
      to2: "#FCD34D",
    },
    {
      to: "/herramientas/mindfulness/observar",
      icon: Eye,
      title: "Mira el presente",
      desc: "1–3 min · Anclarte sin engancharte",
      from: "#60A5FA",
      to2: "#A78BFA",
    },
    {
      to: "/herramientas/mindfulness/describir",
      icon: MessageSquare,
      title: "Ver los hechos",
      desc: "3–7 min · Poner palabras sin juicio",
      from: "#A78BFA",
      to2: "#F472B6",
    },
  ];

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="px-5 pt-12">
        <button
          onClick={() => navigate("/herramientas")}
          className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <ArrowLeft size={18} />
        </button>

        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="font-serif text-3xl font-bold text-[#101927]">Mindfulness</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Tres caminos para estar más presente.
            </p>
          </div>
          <StreakBadge progressByDate={progressByDate} />
        </div>

        <RecommendedNowChip />

        {/* Se eliminó la tarjeta superior "Continuar" — la práctica abierta ya se muestra debajo en OpenMindfulnessList */}

      </div>

      <div className="mt-5 space-y-2 px-5">
        {modules.map((m) => (
          <motion.button
            key={m.to}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(m.to)}
            className="flex w-full items-center gap-3 rounded-2xl bg-white p-3 text-left shadow-sm"
          >
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
              style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to2})` }}
            >
              <m.icon size={20} className="text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="font-display text-base font-semibold text-[#101927]">{m.title}</div>
              <div className="text-[11px] leading-snug text-muted-foreground line-clamp-1">
                {m.desc}
              </div>
            </div>
          </motion.button>
        ))}

        <div className="pt-2">
          <OpenMindfulnessList />
        </div>
      </div>

      {didSomethingToday && (
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          whileTap={{ scale: 0.92 }}
          onClick={() => setQuickAddOpen(true)}
          aria-label="Agregar ejercicio"
          className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#101927] text-white shadow-lg"
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
