import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wind, Eye, MessageSquare, Sparkles, Plus } from "lucide-react";
import { motion } from "framer-motion";

import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import { addDays, startOfWeek, subDays } from "date-fns";
import { QuickAddSheet } from "@/components/mindfulness/QuickAddSheet";

export default function MindfulnessHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progressByDate, setProgressByDate] = useState<Record<string, number>>({});
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [lastExercise, setLastExercise] = useState<{ path: string; label: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const start = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
      const end = addDays(new Date(), 1);
      const { data } = await supabase
        .from("exercise_sessions")
        .select("created_at, exercise_key")
        .eq("user_id", user.id)
        .eq("exercise_type", "mindfulness")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        const k = localDateStr(new Date(r.created_at));
        map[k] = Math.min(4, (map[k] ?? 0) + 1);
      });
      setProgressByDate(map);
      // "Continuar donde dejaste": última sesión de mindfulness
      const last = (data ?? [])[0] as any;
      if (last?.exercise_key) {
        const key = String(last.exercise_key);
        const map2: Record<string, { path: string; label: string }> = {
          "respiracion": { path: "/herramientas/mindfulness/respiracion", label: "Respiración" },
          "observar": { path: "/herramientas/mindfulness/observar", label: "Mira el presente" },
          "describir": { path: "/herramientas/mindfulness/describir", label: "Ver los hechos" },
        };
        setLastExercise(map2[key] ?? { path: "/herramientas/mindfulness/respiracion", label: "Última práctica" });
      }
    })();
  }, [user]);

  const todayKey = localDateStr(new Date());
  const didSomethingToday = (progressByDate[todayKey] ?? 0) > 0;

  const modules = [
    {
      to: "/herramientas/mindfulness/respiracion?intention=balance",
      icon: Sparkles,
      title: "Recomendado ahora",
      desc: "Mira el presente · 2 min",
      from: "#FCD34D",
      to2: "#FBBF24",
    },
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
      <div className="mx-auto max-w-md px-5 pt-5">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate("/herramientas")}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
          >
            <ArrowLeft size={16} />
          </button>
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.22em] text-muted-foreground">
            Atención plena
          </p>
          <span className="h-10 w-10" />
        </div>

        <div className="mt-5">
          <p className="font-[Montserrat] text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Tres caminos
          </p>
          <h1 className="mt-1 font-serif text-[26px] font-medium leading-tight text-[#101927]">
            Mindfulness
          </h1>
          <p className="mt-1.5 text-[12.5px] leading-relaxed text-muted-foreground">
            Tres caminos para estar más presente.
          </p>
        </div>
      </div>

      <div className="mx-auto mt-5 max-w-md space-y-2 px-5">
        {lastExercise && (
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(lastExercise.path)}
            className="flex w-full items-center justify-between rounded-2xl border border-[#e2e8f0] bg-gradient-to-br from-white to-[#f8fafc] p-3 text-left shadow-sm"
          >
            <div>
              <p className="font-[Montserrat] text-[9.5px] font-semibold uppercase tracking-[0.16em] text-[#7cc2c8]">
                Continuar donde dejaste
              </p>
              <p className="mt-0.5 font-display text-[14px] font-semibold text-[#0f172a]">
                {lastExercise.label}
              </p>
            </div>
            <span className="text-[18px] text-[#7cc2c8]">→</span>
          </motion.button>
        )}
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

      <QuickAddSheet open={quickAddOpen} onOpenChange={setQuickAddOpen} />
    </div>
  );
}
