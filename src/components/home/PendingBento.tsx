import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Heart, Sparkles, Wind, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { readDraft, draftHasProgress } from "@/hooks/useChangeResponseFlow";
import { readDraft as readBienestarDraft, todayStatus } from "@/components/bienestar/useBienestarDraft";

type Pending = {
  key: string;
  title: string;
  subtitle: string;
  to: string;
  icon: React.ReactNode;
  from: string;
  to2: string;
};

function readMindfulnessDraft(): { exerciseName: string; returnPath: string } | null {
  try {
    const raw = localStorage.getItem("mindfulness-current-draft");
    if (!raw) return null;
    const p = JSON.parse(raw);
    if (!p?.exerciseName || !p?.returnPath) return null;
    return { exerciseName: p.exerciseName, returnPath: p.returnPath };
  } catch {
    return null;
  }
}

function draftHasBienestarProgress(d: any) {
  return (
    (d?.selectedValues?.length ?? 0) > 0 ||
    !!d?.todayGoal ||
    (d?.selectedActivities?.length ?? 0) > 0
  );
}

export function PendingBento() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Pending[]>([]);
  const [tick, setTick] = useState(0);

  // Re-read on focus / visibility change
  useEffect(() => {
    const refresh = () => setTick((t) => t + 1);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, []);

  const compute = useCallback(async () => {
    const next: Pending[] = [];

    // Cambiar respuestas — sesión en curso
    const d = readDraft();
    if (d && draftHasProgress(d) && d.stage !== "done") {
      const stageMap: Record<string, string> = {
        wizard8: "Verificar los hechos",
        decision9: "Mente Sabia",
        problem12: "Acción · Resolver",
        opposite10: "Acción Opuesta",
      };
      next.push({
        key: "dbt",
        title: "Cambiar respuestas",
        subtitle: d.selectedEmotion ? `${d.selectedEmotion} · ${stageMap[d.stage] ?? "En curso"}` : "Sesión en curso",
        to: "/herramientas/cambiar-respuestas",
        icon: <Heart size={16} className="text-white" />,
        from: "#7cc2c8",
        to2: "#facb60",
      });
    }

    // Mindfulness
    const m = readMindfulnessDraft();
    if (m) {
      next.push({
        key: "mindfulness",
        title: "Práctica de mindfulness",
        subtitle: m.exerciseName,
        to: m.returnPath,
        icon: <Wind size={16} className="text-white" />,
        from: "#FB923C",
        to2: "#FCD34D",
      });
    }

    // Bienestar
    const b = readBienestarDraft();
    if (b) {
      const st = todayStatus(b);
      if (st.total > 0) {
        next.push({
          key: "bienestar-hoy",
          title: "Tu plan de bienestar",
          subtitle:
            st.pending > 0
              ? `${st.pending} de ${st.total} bloques pendientes hoy`
              : `Todo completado hoy ✓`,
          to: "/herramientas/construir-bienestar?tab=seguimiento&day=hoy",
          icon: <Calendar size={16} className="text-white" />,
          from: "#7cc2c8",
          to2: "#34D399",
        });
      } else if (draftHasBienestarProgress(b) && !b.done) {
        next.push({
          key: "bienestar-wizard",
          title: "Continuá tu plan",
          subtitle: `Paso ${b.step} de 4`,
          to: "/herramientas/construir-bienestar",
          icon: <Sparkles size={16} className="text-white" />,
          from: "#7cc2c8",
          to2: "#facb60",
        });
      }
    }

    // BA Pack
    if (user) {
      const { data } = await supabase
        .from("ba_programs" as any)
        .select("current_day, state")
        .eq("user_id", user.id)
        .maybeSingle();
      const prog: any = data;
      if (prog && prog.state && prog.state !== "completed") {
        next.push({
          key: "ba",
          title: "Pack de activación",
          subtitle: `Día ${prog.current_day ?? 1} en curso`,
          to: "/herramientas/pack-actividades",
          icon: <Sparkles size={16} className="text-white" />,
          from: "#FB923C",
          to2: "#F472B6",
        });
      }
    }

    // Sugerencia Mindfulness: si el check-in de hoy muestra mood bajo o
    // emociones tensas y no hizo mindfulness hoy, ofrecer 4-7-8.
    if (user) {
      try {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, "0");
        const dd = String(today.getDate()).padStart(2, "0");
        const todayStr = `${yyyy}-${mm}-${dd}`;
        const startOfDay = new Date(today);
        startOfDay.setHours(0, 0, 0, 0);

        const [{ data: ci }, { data: ms }] = await Promise.all([
          supabase
            .from("daily_checkins")
            .select("mood_score, emotions")
            .eq("user_id", user.id)
            .eq("checkin_date", todayStr)
            .maybeSingle(),
          supabase
            .from("exercise_sessions")
            .select("id")
            .eq("user_id", user.id)
            .eq("exercise_type", "mindfulness")
            .gte("created_at", startOfDay.toISOString())
            .limit(1),
        ]);

        const c: any = ci;
        const tense =
          (typeof c?.mood_score === "number" && c.mood_score <= 4) ||
          (Array.isArray(c?.emotions) &&
            c.emotions.some((e: string) => /ansied|enoj|miedo|panic|estr[eé]s/i.test(e)));
        const didMindfulness = (ms ?? []).length > 0;

        if (tense && !didMindfulness) {
          next.push({
            key: "mindfulness-reco",
            title: "Te puede aliviar",
            subtitle: "Respiración 4-7-8 · 3 min",
            to: "/herramientas/mindfulness/respiracion?intention=ansiedad&minutes=3",
            icon: <Wind size={16} className="text-white" />,
            from: "#60A5FA",
            to2: "#A78BFA",
          });
        }
      } catch {}
    }

    setItems(next);
  }, [user]);

  useEffect(() => {
    compute();
  }, [compute, tick]);

  if (items.length === 0) return null;

  return (
    <div className="mt-4">
      <p className="mb-2 px-1 text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground/70">
        Pendientes para vos
      </p>
      <div className="grid grid-cols-2 gap-2">
        {items.map((it) => (
          <motion.button
            key={it.key}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(it.to)}
            className="rounded-2xl p-3 text-left flex flex-col gap-2 text-white shadow-md"
            style={{
              background: `linear-gradient(135deg, ${it.from}, ${it.to2})`,
              boxShadow: `0 10px 24px -14px ${it.from}`,
            }}
          >
            <div className="h-9 w-9 rounded-lg flex items-center justify-center bg-white/25 backdrop-blur-sm">
              {it.icon}
            </div>
            <div>
              <p className="font-display text-[13px] font-bold text-white leading-tight">
                {it.title}
              </p>
              <p className="text-[11px] text-white/85 line-clamp-2 mt-0.5">
                {it.subtitle}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
