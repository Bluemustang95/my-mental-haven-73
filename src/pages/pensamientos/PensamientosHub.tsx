import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Brain, Plus, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { WeekStrip } from "@/components/home/WeekStrip";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import { addDays, startOfWeek, subDays, format } from "date-fns";
import { es } from "date-fns/locale";

type ThoughtRow = {
  id: string;
  created_at: string;
  situation: string | null;
  emotion: string | null;
  distortion_label: string | null;
  distortions?: { label: string }[] | null;
};

export default function PensamientosHub() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [progressByDate, setProgressByDate] = useState<{ [k: string]: number }>({});
  const [recent, setRecent] = useState<ThoughtRow[]>([]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const start = subDays(startOfWeek(new Date(), { weekStartsOn: 1 }), 7);
      const end = addDays(new Date(), 1);
      const { data } = await supabase
        .from("thought_records")
        .select("id, created_at, situation, emotion, distortion_label")
        .eq("user_id", user.id)
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString())
        .order("created_at", { ascending: false });
      const map: { [k: string]: number } = {};
      (data ?? []).forEach((r: any) => {
        const k = localDateStr(new Date(r.created_at));
        map[k] = Math.min(4, (map[k] ?? 0) + 1);
      });
      setProgressByDate(map);
      setRecent(((data as any[]) ?? []).slice(0, 5) as ThoughtRow[]);
    })();
  }, [user]);

  const modules = [
    {
      to: "/diario-inteligente/gestion-pensamientos/pensamientos-automaticos",
      icon: Brain,
      title: "Modificá tus pensamientos",
      desc: "5–10 min · Wizard CBT con IA",
      from: "#7cc2c8",
      to2: "#facb60",
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

        <h1 className="font-serif text-3xl font-bold text-[#101927]">Pensamientos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Identificá, evaluá y modificá pensamientos automáticos.
        </p>

        <div className="mt-4">
          <WeekStrip progressByDate={progressByDate} />
        </div>
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
            <ChevronRight size={16} className="text-[#101927]/40" />
          </motion.button>
        ))}
      </div>

      {recent.length > 0 && (
        <div className="mt-6 px-5">
          <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-[#101927]/55">
            Tus registros recientes
          </p>
          <div className="space-y-2">
            {recent.map((r) => (
              <div
                key={r.id}
                className="rounded-2xl bg-white p-3 shadow-sm"
              >
                <p className="text-[10px] font-semibold uppercase tracking-wide text-[#101927]/45">
                  {format(new Date(r.created_at), "EEE d MMM · HH:mm", { locale: es })}
                </p>
                <p className="mt-1 font-display text-[13px] font-semibold text-[#101927] line-clamp-2">
                  {r.situation ?? "(sin descripción)"}
                </p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {r.emotion && (
                    <span className="rounded-full bg-[#7cc2c8]/15 px-2 py-0.5 text-[10px] font-semibold text-[#101927]/70">
                      {r.emotion}
                    </span>
                  )}
                  {r.distortion_label && (
                    <span className="rounded-full bg-[#facb60]/25 px-2 py-0.5 text-[10px] font-semibold text-[#92561a]">
                      {r.distortion_label}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.92 }}
        onClick={() => navigate("/diario-inteligente/gestion-pensamientos/pensamientos-automaticos")}
        aria-label="Nuevo registro"
        className="fixed bottom-24 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#101927] text-white shadow-lg"
      >
        <Plus size={24} />
      </motion.button>
    </div>
  );
}
