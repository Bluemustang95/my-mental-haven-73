import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Row {
  emotion: string | null;
  path: string | null;
  is_effective: boolean | null;
  created_at: string;
}

interface Insights {
  total: number;
  topEmotion: { name: string; count: number } | null;
  dominantPath: "problem" | "opposite" | null;
  effectiveRate: number | null;
  last30: number;
}

function summarize(rows: Row[]): Insights {
  const total = rows.length;
  if (total === 0) return { total: 0, topEmotion: null, dominantPath: null, effectiveRate: null, last30: 0 };

  const counts: Record<string, number> = {};
  let problem = 0, opposite = 0;
  let effYes = 0, effTot = 0;
  const cutoff = Date.now() - 30 * 24 * 3600_000;
  let last30 = 0;
  for (const r of rows) {
    if (r.emotion) counts[r.emotion] = (counts[r.emotion] || 0) + 1;
    if (r.path === "problem") problem++;
    else if (r.path === "opposite") opposite++;
    if (r.is_effective !== null) { effTot++; if (r.is_effective) effYes++; }
    if (new Date(r.created_at).getTime() >= cutoff) last30++;
  }
  const topEntry = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
  return {
    total,
    topEmotion: topEntry ? { name: topEntry[0], count: topEntry[1] } : null,
    dominantPath: problem === 0 && opposite === 0 ? null : (problem >= opposite ? "problem" : "opposite"),
    effectiveRate: effTot ? effYes / effTot : null,
    last30,
  };
}

export function PatternInsights() {
  const { user } = useAuth();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) { setLoading(false); return; }
      const { data: rows } = await supabase
        .from("dbt_emotion_sessions")
        .select("emotion, path, is_effective, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(60);
      if (cancelled) return;
      setData(summarize((rows ?? []) as Row[]));
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  if (loading || !data || data.total === 0) return null;

  const pathLabel =
    data.dominantPath === "problem" ? "Resolución de Problemas" :
    data.dominantPath === "opposite" ? "Acción Opuesta" : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white shadow-sm p-4"
    >
      <div className="mb-3 flex items-center gap-2">
        <Sparkles size={14} className="text-[#facb60]" />
        <span className="text-[11px] font-semibold uppercase tracking-widest text-[#101927]/55">
          Tus patrones · {data.total} {data.total === 1 ? "sesión" : "sesiones"}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {data.topEmotion && (
          <div className="rounded-xl bg-[#FDFCFB] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#101927]/45">
              Emoción frecuente
            </p>
            <p className="mt-1 font-display text-base font-bold capitalize text-[#101927]">
              {data.topEmotion.name}
            </p>
            <p className="mt-0.5 text-[11px] text-[#101927]/55">
              {data.topEmotion.count} {data.topEmotion.count === 1 ? "vez" : "veces"}
            </p>
          </div>
        )}

        {pathLabel && (
          <div className="rounded-xl bg-[#FDFCFB] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#101927]/45">
              Camino dominante
            </p>
            <p className="mt-1 font-display text-sm font-bold leading-tight text-[#101927]">
              {pathLabel}
            </p>
          </div>
        )}

        {data.effectiveRate !== null && (
          <div className="rounded-xl bg-[#FDFCFB] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#101927]/45">
              Efectividad percibida
            </p>
            <p className="mt-1 font-display text-base font-bold text-[#101927]">
              {Math.round(data.effectiveRate * 100)}%
            </p>
          </div>
        )}

        <div className="rounded-xl bg-[#FDFCFB] p-3">
          <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-[#101927]/45">
            <TrendingUp size={10} /> Últimos 30 días
          </div>
          <p className="mt-1 font-display text-base font-bold text-[#101927]">
            {data.last30} {data.last30 === 1 ? "sesión" : "sesiones"}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
