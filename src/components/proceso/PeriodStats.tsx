import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion } from "framer-motion";

type Range = "week" | "month" | "year";
type Totals = {
  checkins: number;
  mindfulnessMin: number;
  journalEntries: number;
  thoughtRecords: number;
  habitsCompleted: number;
};

type Props = {
  /** Controlled range. If omitted, an internal toggle is shown. */
  range?: Range;
  /** Hide the internal segmented toggle (usually true when parent controls range). */
  hideToggle?: boolean;
};

/**
 * Aggregated activity totals for the selected range.
 * Can be used standalone (with its own month/year toggle) or controlled
 * from a parent (Wellbeing sheet passes range="week" | "month" | "year").
 */
export function PeriodStats({ range: controlledRange, hideToggle }: Props = {}) {
  const { user } = useAuth();
  const [internal, setInternal] = useState<Range>("month");
  const range = controlledRange ?? internal;
  const [totals, setTotals] = useState<Totals | null>(null);
  const [loading, setLoading] = useState(true);

  const since = useMemo(() => {
    const d = new Date();
    if (range === "week") d.setDate(d.getDate() - 7);
    else if (range === "month") d.setDate(d.getDate() - 30);
    else d.setDate(d.getDate() - 365);
    return d.toISOString();
  }, [range]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    Promise.all([
      supabase.from("daily_checkins").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
      supabase.from("exercise_sessions").select("duration_seconds").eq("user_id", user.id).eq("exercise_type", "mindfulness").gte("created_at", since),
      supabase.from("journal_entries").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
      supabase.from("thought_records").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
      supabase.from("habit_completions").select("id", { count: "exact", head: true }).eq("user_id", user.id).gte("created_at", since),
    ]).then(([ci, mind, jr, tr, hc]) => {
      const min = Math.round(((mind.data as { duration_seconds: number | null }[] | null) ?? []).reduce((s, r) => s + (r.duration_seconds ?? 0), 0) / 60);
      setTotals({
        checkins: ci.count ?? 0,
        mindfulnessMin: min,
        journalEntries: jr.count ?? 0,
        thoughtRecords: tr.count ?? 0,
        habitsCompleted: hc.count ?? 0,
      });
      setLoading(false);
    });
  }, [user, since]);

  const items = [
    { label: "Check-ins", value: totals?.checkins ?? 0, tint: "bg-[#facb60]/20 text-[#b45309]" },
    { label: "Min. mindfulness", value: totals?.mindfulnessMin ?? 0, tint: "bg-[#7cc2c8]/20 text-[#3d8a90]" },
    { label: "Entradas de diario", value: totals?.journalEntries ?? 0, tint: "bg-[#c5b8e8]/25 text-[#5b4b8a]" },
    { label: "Pensamientos", value: totals?.thoughtRecords ?? 0, tint: "bg-[#f5c8c1]/30 text-[#a25248]" },
    { label: "Hábitos ✓", value: totals?.habitsCompleted ?? 0, tint: "bg-[#a8d8b9]/30 text-[#3b7a55]" },
  ];

  const showToggle = !hideToggle && !controlledRange;

  return (
    <section className="rounded-[22px] border border-white/70 bg-white/80 p-4 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <p className="font-[Montserrat] text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#94a3b8]">
          Tu actividad
        </p>
        {showToggle && (
          <div className="flex rounded-full bg-[#f1f5f9] p-0.5">
            {(["month", "year"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setInternal(r)}
                className={`rounded-full px-3 py-1 text-[10.5px] font-semibold transition ${
                  range === r ? "bg-white text-[#0f172a] shadow-sm" : "text-[#64748b]"
                }`}
              >
                {r === "month" ? "30 días" : "12 meses"}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        {items.map((it, i) => (
          <motion.div
            key={it.label}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className={`rounded-2xl p-3 ${it.tint}`}
          >
            <p className="font-display text-[20px] font-bold leading-none tabular-nums">
              {loading ? "—" : it.value}
            </p>
            <p className="mt-1.5 text-[10.5px] font-semibold leading-tight opacity-80">
              {it.label}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
