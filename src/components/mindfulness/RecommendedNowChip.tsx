import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";

type Reco = {
  label: string;
  reason: string;
  to: string;
};

function timeBasedReco(): Reco {
  const h = new Date().getHours();
  if (h >= 19 || h < 6) {
    return {
      label: "Respiración 4-7-8 · 3 min",
      reason: "Para soltar el día y dormir mejor",
      to: "/herramientas/mindfulness/respiracion?intention=dormir&minutes=3",
    };
  }
  if (h >= 12 && h < 19) {
    return {
      label: "Mira el presente · 2 min",
      reason: "Para anclarte en la tarde",
      to: "/herramientas/mindfulness/observar",
    };
  }
  return {
    label: "Coherencia 5-5 · 3 min",
    reason: "Para arrancar con foco",
    to: "/herramientas/mindfulness/respiracion?intention=concentrarme&minutes=3",
  };
}

export function RecommendedNowChip() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reco, setReco] = useState<Reco>(() => timeBasedReco());

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const today = localDateStr(new Date());
        const { data } = await supabase
          .from("daily_checkins")
          .select("mood_score, emotions")
          .eq("user_id", user.id)
          .eq("checkin_date", today)
          .maybeSingle();

        const c: any = data;
        const lowMood = typeof c?.mood_score === "number" && c.mood_score <= 4;
        const tense = Array.isArray(c?.emotions)
          ? c.emotions.some((e: string) => /ansied|enoj|miedo|panic|estr[eé]s/i.test(e))
          : false;

        if (lowMood || tense) {
          setReco({
            label: "Respiración 4-7-8 · 3 min",
            reason: "Te puede aliviar ahora",
            to: "/herramientas/mindfulness/respiracion?intention=ansiedad&minutes=3",
          });
        }
      } catch {}
    })();
  }, [user]);

  return (
    <motion.button
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => navigate(reco.to)}
      className="mt-3 flex w-full items-center gap-2 rounded-2xl border border-[#101927]/8 bg-white px-3 py-2.5 text-left shadow-sm"
    >
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#FB923C] to-[#FCD34D] text-white">
        <Sparkles size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">
          Recomendado ahora
        </div>
        <div className="truncate font-display text-[13px] font-semibold text-[#101927]">
          {reco.label}
        </div>
      </div>
      <div className="hidden text-[10px] text-muted-foreground sm:block">{reco.reason}</div>
    </motion.button>
  );
}
