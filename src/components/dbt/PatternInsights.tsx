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

const DISMISS_KEY = "dbt-pattern-dismissed-v1";

function readDismissed(): string[] {
  try {
    const raw = localStorage.getItem(DISMISS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function dismissId(id: string) {
  const next = Array.from(new Set([...readDismissed(), id]));
  try { localStorage.setItem(DISMISS_KEY, JSON.stringify(next)); } catch {}
  return next;
}

interface Props {
  embedded?: boolean;
}

export function PatternInsights({ embedded = false }: Props) {
  const { user } = useAuth();
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState<string[]>(() => readDismissed());

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

  if (loading) return null;
  if (!data || data.total === 0) {
    if (embedded) {
      return (
        <p className="px-2 py-3 text-center text-[12px] text-[#101927]/55">
          Sin patrones aún. Hacé una sesión para empezar a verlos.
        </p>
      );
    }
    return null;
  }

  const pathLabel =
    data.dominantPath === "problem" ? "Resolución de Problemas" :
    data.dominantPath === "opposite" ? "Acción Opuesta" : null;

  const cards: { id: string; label: string; value: string; sub?: string }[] = [];
  if (data.topEmotion) cards.push({
    id: `emo-${data.topEmotion.name}`,
    label: "Emoción frecuente",
    value: data.topEmotion.name,
    sub: `${data.topEmotion.count} ${data.topEmotion.count === 1 ? "vez" : "veces"}`,
  });
  if (pathLabel) cards.push({ id: `path-${data.dominantPath}`, label: "Camino dominante", value: pathLabel });
  if (data.effectiveRate !== null) cards.push({
    id: "effectiveness",
    label: "Efectividad percibida",
    value: `${Math.round(data.effectiveRate * 100)}%`,
  });
  cards.push({
    id: "last30",
    label: "Últimos 30 días",
    value: `${data.last30} ${data.last30 === 1 ? "sesión" : "sesiones"}`,
  });

  const visible = cards.filter((c) => !dismissed.includes(c.id));

  if (visible.length === 0) {
    return (
      <p className="px-2 py-3 text-center text-[12px] text-[#101927]/55">
        Sin patrones pendientes. ¡Bien hecho!
      </p>
    );
  }

  const Wrapper: any = embedded ? "div" : motion.div;
  const wrapperProps = embedded
    ? { className: "" }
    : {
        initial: { opacity: 0, y: 8 },
        animate: { opacity: 1, y: 0 },
        className: "rounded-2xl bg-white shadow-sm p-4",
      };

  return (
    <Wrapper {...wrapperProps}>
      {!embedded && (
        <div className="mb-3 flex items-center gap-2">
          <Sparkles size={14} className="text-[#facb60]" />
          <span className="text-[11px] font-semibold uppercase tracking-widest text-[#101927]/55">
            Tus patrones · {data.total} {data.total === 1 ? "sesión" : "sesiones"}
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {visible.map((c) => (
          <div key={c.id} className="relative rounded-xl bg-[#FDFCFB] p-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-[#101927]/45">
              {c.label}
            </p>
            <p className="mt-1 font-display text-base font-bold capitalize text-[#101927]">
              {c.value}
            </p>
            {c.sub && <p className="mt-0.5 text-[11px] text-[#101927]/55">{c.sub}</p>}
            <button
              onClick={() => setDismissed(dismissId(c.id))}
              className="mt-2 w-full rounded-lg bg-[#7cc2c8]/15 py-1 text-[10px] font-semibold text-[#0c5b62] active:scale-[0.97]"
            >
              ✓ Marcar como visto
            </button>
          </div>
        ))}
      </div>
    </Wrapper>
  );
}
