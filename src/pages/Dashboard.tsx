import { useEffect, useMemo, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Settings, Sparkles, Sun, BookOpen, Wind, Moon as MoonIcon, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { WeekStrip } from "@/components/home/WeekStrip";
import { Timeline, TimelineNode } from "@/components/home/Timeline";
import { CheckinModal } from "@/components/modals/CheckinModal";
import { PsychoModal } from "@/components/modals/PsychoModal";
import { toast } from "sonner";

function getGreeting() {
  const h = new Date().getHours();
  if (h >= 6 && h < 13) return "Buen día";
  if (h >= 13 && h < 20) return "Buenas tardes";
  return "Buenas noches";
}

type Reco = {
  sub_resource_id: string;
  sub_resource_slug: string;
  sub_resource_name: string;
  sub_resource_route: string | null;
};

const fallbackChips = [
  { name: "Respiración", route: "/diario-inteligente/mindfulness" },
  { name: "Grounding", route: "/diario-inteligente/tolerancia-malestar" },
  { name: "Visualización", route: "/diario-inteligente/mindfulness" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const today = new Date();
  const todayStr = localDateStr(today);
  const greeting = useMemo(getGreeting, []);

  const [morningDone, setMorningDone] = useState(false);
  const [psychoDone, setPsychoDone] = useState(false);
  const [practiceDone, setPracticeDone] = useState<string | null>(null);
  const [nightDone, setNightDone] = useState(false);

  const [checkinOpen, setCheckinOpen] = useState<"morning" | "night" | null>(null);
  const [psychoOpen, setPsychoOpen] = useState(false);

  const [recos, setRecos] = useState<Reco[]>([]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("patient_app_profiles")
      .select("display_name")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        const n = data?.display_name || user.user_metadata?.display_name || user.email?.split("@")[0] || "";
        setName(n.split(" ")[0]);
      });

    (supabase.rpc as any)("get_daily_recommendations", { _user_id: user.id, _limit: 3 })
      .then(({ data }: { data: Reco[] | null }) => setRecos(data ?? []));
  }, [user]);

  const loadToday = useCallback(async () => {
    if (!user) return;
    const { data: ci } = await supabase
      .from("daily_checkins")
      .select("mode, sleep_score")
      .eq("user_id", user.id)
      .eq("checkin_date", todayStr);
    const morn = ci?.some((c: any) => c.mode === "morning" || (!c.mode && c.sleep_score != null)) ?? false;
    const night = ci?.some((c: any) => c.mode === "night") ?? false;
    setMorningDone(morn);
    setNightDone(night);
  }, [user, todayStr]);

  useEffect(() => {
    loadToday();
  }, [loadToday]);

  const chips = recos.length
    ? recos.slice(0, 3).map((r) => ({
        name: r.sub_resource_name,
        route: r.sub_resource_route ?? `/diario-inteligente/mindfulness`,
      }))
    : fallbackChips;

  const allDone = morningDone && psychoDone && !!practiceDone && nightDone;

  const completePractice = async (chipName: string, route: string) => {
    setPracticeDone(chipName);
    if (user) {
      await supabase.from("exercise_sessions").insert({
        user_id: user.id,
        exercise_type: "daily_practice",
        exercise_name: chipName,
      });
    }
    toast.success(`Completaste: ${chipName} ✨`);
  };

  const nodes: TimelineNode[] = [
    {
      id: "morning",
      title: "Valoración de la mañana",
      subtitle: "Analiza tu sueño y estado de ánimo.",
      icon: <Sun size={22} className="text-amber-500" />,
      iconBg: "linear-gradient(135deg,#FFE9C8 0%,#FFD9A3 100%)",
      done: morningDone,
      onClick: () => setCheckinOpen("morning"),
    },
    {
      id: "psycho",
      title: "Psicoeducación",
      subtitle: "Aprende sobre distorsiones cognitivas.",
      icon: <BookOpen size={22} className="text-orange-500" />,
      iconBg: "linear-gradient(135deg,#FFE3D1 0%,#FFCDAA 100%)",
      done: psychoDone,
      onClick: () => setPsychoOpen(true),
    },
    {
      id: "practice",
      title: "Tu práctica de hoy",
      subtitle: practiceDone ? `Completaste: ${practiceDone}` : "Elegí un ejercicio para realizar.",
      icon: <Wind size={22} className="text-amber-600" />,
      iconBg: "linear-gradient(135deg,#FFE9C8 0%,#FFD9A3 100%)",
      done: !!practiceDone,
      onClick: () => {},
      footer: (
        <div className="flex flex-wrap gap-2 pt-1">
          {chips.map((c) => (
            <button
              key={c.name}
              onClick={(e) => {
                e.stopPropagation();
                completePractice(c.name, c.route);
                setTimeout(() => navigate(c.route), 600);
              }}
              className="rounded-full bg-[#F4ECE0] px-4 py-2 text-xs font-semibold text-[#101927] transition active:scale-95"
            >
              {c.name}
            </button>
          ))}
        </div>
      ),
    },
    {
      id: "night",
      title: "Valoración de la noche",
      subtitle: "Cierra el día y prepara tu descanso.",
      icon: <MoonIcon size={22} className="text-amber-600" />,
      iconBg: "linear-gradient(135deg,#FFE9C8 0%,#FFD9A3 100%)",
      done: nightDone,
      onClick: () => setCheckinOpen("night"),
    },
  ];

  useEffect(() => {
    if (allDone) {
      toast.success("¡Plan completado! 🎉", { duration: 3000 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allDone]);

  return (
    <div className="min-h-screen bg-[#FAFAFB] pb-28 safe-area-top">
      <div className="mx-auto max-w-md px-5 pt-12">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold leading-tight text-[#101927]">
              {greeting},{" "}
              <span className="inline-flex items-center gap-1">
                <Sparkles size={22} className="text-amber-500" />
              </span>
            </h1>
            <h2 className="font-display text-3xl font-bold text-[#101927]">{name || "Usuario"}</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tu plan del día te espera</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/configuracion")}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm transition active:scale-95"
              aria-label="Configuración"
            >
              <Settings size={18} className="text-[#101927]" />
            </button>
            <button
              onClick={() => navigate("/perfil")}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4ECE0] font-display text-lg font-bold uppercase text-[#101927] transition active:scale-95"
            >
              {name ? name[0] : "U"}
            </button>
          </div>
        </div>

        {/* Week strip */}
        <div className="mt-8">
          <WeekStrip hasActivityToday={allDone} />
        </div>

        {/* Progress label */}
        <p className="mt-10 mb-4 px-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Tu progreso de hoy
        </p>

        {/* Timeline */}
        <Timeline nodes={nodes} allDone={allDone} />

        {/* Sleep banner */}
        <button
          onClick={() => navigate("/herramientas/sueno")}
          className="mt-6 flex w-full items-center justify-between gap-4 overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-500 p-5 text-left text-white shadow-[0_15px_40px_-15px_rgba(139,92,246,0.7)] transition active:scale-[0.98]"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur-md">
              <MoonIcon size={22} className="text-white" />
            </div>
            <div>
              <p className="font-display text-base font-bold">Te ayudamos con tu sueño</p>
              <p className="text-xs text-white/80">Recursos y diarios nocturnos</p>
            </div>
          </div>
          <ChevronRight size={20} />
        </button>
      </div>

      <CheckinModal
        open={!!checkinOpen}
        mode={checkinOpen ?? "morning"}
        onClose={() => setCheckinOpen(null)}
        onComplete={() => loadToday()}
      />
      <PsychoModal
        open={psychoOpen}
        onClose={() => setPsychoOpen(false)}
        onComplete={() => setPsychoDone(true)}
      />
    </div>
  );
}
