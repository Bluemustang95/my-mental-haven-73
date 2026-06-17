import { useEffect, useState } from "react";
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

export function PendingBento() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [items, setItems] = useState<Pending[]>([]);

  useEffect(() => {
    const next: Pending[] = [];

    // DBT draft
    const d = readDraft();
    if (d && draftHasProgress(d) && d.stage !== "done") {
      next.push({
        key: "dbt",
        title: "Cambiar respuestas",
        subtitle: d.selectedEmotion ? `Sesión: ${d.selectedEmotion}` : "Sesión en curso",
        to: "/herramientas/cambiar-respuestas",
        icon: <Heart size={16} className="text-white" />,
        from: "#7cc2c8",
        to2: "#facb60",
      });
    }

    // Mindfulness draft
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

    // Bienestar — plan de hoy o wizard inconcluso
    const b = readBienestarDraft();
    if (b) {
      if (b.done || (b.step >= 4 && b.selectedActivities.length >= 3)) {
        const st = todayStatus(b);
        if (st.total > 0) {
          next.push({
            key: "bienestar-hoy",
            title: "Tu plan de bienestar",
            subtitle:
              st.nextLabel ??
              `${st.pending} de ${st.total} bloques pendientes hoy`,
            to: "/herramientas/construir-bienestar?tab=seguimiento&day=hoy",
            icon: <Calendar size={16} className="text-white" />,
            from: "#7cc2c8",
            to2: "#34D399",
          });
        }
      } else if (draftHasBienestarProgress(b)) {
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

    setItems(next);

    function draftHasBienestarProgress(d: any) {
      return (
        (d?.selectedValues?.length ?? 0) > 0 ||
        !!d?.todayGoal ||
        (d?.selectedActivities?.length ?? 0) > 0
      );
    }


    // BA Pack
    (async () => {
      if (!user) return;
      const { data } = await supabase
        .from("ba_programs" as any)
        .select("current_day, state")
        .eq("user_id", user.id)
        .maybeSingle();
      const prog: any = data;
      if (prog && prog.state && prog.state !== "completed") {
        setItems((prev) => [
          ...prev,
          {
            key: "ba",
            title: "Pack de activación",
            subtitle: `Día ${prog.current_day ?? 1} en curso`,
            to: "/herramientas/pack-actividades",
            icon: <Sparkles size={16} className="text-white" />,
            from: "#FB923C",
            to2: "#F472B6",
          },
        ]);
      }
    })();
  }, [user]);

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
            className="rounded-2xl bg-white shadow-sm p-3 text-left flex flex-col gap-2"
          >
            <div
              className="h-9 w-9 rounded-lg flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${it.from}, ${it.to2})` }}
            >
              {it.icon}
            </div>
            <div>
              <p className="font-display text-[13px] font-bold text-[#101927] leading-tight">
                {it.title}
              </p>
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                {it.subtitle}
              </p>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
