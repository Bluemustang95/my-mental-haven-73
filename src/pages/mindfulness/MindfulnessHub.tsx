import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wind, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { WeekStrip } from "@/components/home/WeekStrip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import { addDays, startOfWeek } from "date-fns";

export default function MindfulnessHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progressByDate, setProgressByDate] = useState<Record<string, number>>({});

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
      title: "Observar",
      desc: "Notá lo que aparece sin engancharte. Pensamientos y sentidos.",
      from: "#60A5FA",
      to2: "#A78BFA",
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

        <div className="mt-5">
          <WeekStrip progressByDate={progressByDate} onSelectDay={(d) => navigate(`/calendario/${localDateStr(d)}`)} />
        </div>
      </div>

      <div className="mt-6 space-y-3 px-5">
        {modules.map((m) => (
          <motion.button
            key={m.to}
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate(m.to)}
            className="w-full rounded-3xl bg-white p-5 text-left shadow-sm flex items-center gap-4"
          >
            <div
              className="h-14 w-14 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${m.from}, ${m.to2})` }}
            >
              <m.icon size={26} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="font-display text-lg font-semibold text-[#101927]">{m.title}</div>
              <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{m.desc}</div>
            </div>
          </motion.button>
        ))}

        <div className="rounded-3xl border border-dashed border-black/10 bg-white/40 p-5 text-center">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">Próximamente</div>
          <div className="mt-1 font-display text-sm font-semibold text-[#101927]/60">Describir · Hechos vs. juicios</div>
        </div>
      </div>
    </div>
  );
}
