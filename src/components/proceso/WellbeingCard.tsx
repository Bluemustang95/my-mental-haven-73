import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";

const POSITIVE = ["Alegría", "Calma", "Motivado", "Cariño"];
const NEGATIVE = ["Agotamiento", "Ansiedad", "Enojo", "Tristeza", "Confuso"];

type Snapshot = {
  index: number;
  sleep: number;
  goalRate: number;
  resourceCount: number;
  streak: number;
};

async function computeSnapshot(userId: string, from: Date, to: Date): Promise<Snapshot> {
  const fromStr = localDateStr(from);
  const toStr = localDateStr(to);

  const { data: cis } = await supabase
    .from("daily_checkins")
    .select("checkin_date, mode, sleep_score, dawn_score, emotions, goal_completed, day_goal")
    .eq("user_id", userId)
    .gte("checkin_date", fromStr)
    .lte("checkin_date", toStr);

  const { data: exs } = await supabase
    .from("exercise_sessions")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", from.toISOString())
    .lte("created_at", to.toISOString());

  const rows = (cis as any[]) ?? [];
  const sleepScores = rows.map((r) => r.sleep_score).filter((v) => v != null);
  const sleepAvg = sleepScores.length
    ? sleepScores.reduce((a, b) => a + b, 0) / sleepScores.length / 5
    : 0;
  const dawnMap: Record<string, number> = { Excelente: 1, "Muy bien": 0.8, Normal: 0.6, Mal: 0.3, Pésimo: 0.1 };
  const dawns = rows.map((r) => dawnMap[r.dawn_score] ?? null).filter((v): v is number => v != null);
  const dawnAvg = dawns.length ? dawns.reduce((a, b) => a + b, 0) / dawns.length : 0;

  const nightRows = rows.filter((r) => r.mode === "night");
  let balanceScore = 0;
  let balanceCount = 0;
  nightRows.forEach((r) => {
    const ems: string[] = r.emotions ?? [];
    if (!ems.length) return;
    const pos = ems.filter((e) => POSITIVE.includes(e)).length;
    const neg = ems.filter((e) => NEGATIVE.includes(e)).length;
    const total = pos + neg;
    if (total > 0) {
      balanceScore += pos / total;
      balanceCount++;
    }
  });
  const balanceAvg = balanceCount ? balanceScore / balanceCount : 0.5;

  const goalRows = rows.filter((r) => r.day_goal);
  const goalsDone = goalRows.filter((r) => r.goal_completed === "yes").length;
  const goalsPartial = goalRows.filter((r) => r.goal_completed === "partial").length;
  const goalRate = goalRows.length ? (goalsDone + goalsPartial * 0.5) / goalRows.length : 0;

  const resourceCount = (exs ?? []).length;
  const resourceScore = Math.min(1, resourceCount / 7);

  const dates = new Set(rows.map((r) => r.checkin_date));
  const adherence = dates.size / 7;

  const index =
    Math.round(
      (sleepAvg * 0.25 +
        dawnAvg * 0.1 +
        balanceAvg * 0.15 +
        resourceScore * 0.25 +
        goalRate * 0.15 +
        adherence * 0.1) *
        100
    );

  return {
    index,
    sleep: Math.round(sleepAvg * 100),
    goalRate: Math.round(goalRate * 100),
    resourceCount,
    streak: dates.size,
  };
}

export function WellbeingCard() {
  const { user } = useAuth();
  const [now, setNow] = useState<Snapshot | null>(null);
  const [prev, setPrev] = useState<Snapshot | null>(null);

  useEffect(() => {
    if (!user) return;
    const today = new Date();
    const w1Start = new Date(today);
    w1Start.setDate(today.getDate() - 6);
    const w2End = new Date(today);
    w2End.setDate(today.getDate() - 7);
    const w2Start = new Date(today);
    w2Start.setDate(today.getDate() - 13);

    Promise.all([
      computeSnapshot(user.id, w1Start, today),
      computeSnapshot(user.id, w2Start, w2End),
    ]).then(([a, b]) => {
      setNow(a);
      setPrev(b);
    });
  }, [user]);

  if (!now) {
    return (
      <div className="rounded-3xl bg-white p-5 shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)]">
        <p className="text-sm text-muted-foreground">Calculando tu bienestar...</p>
      </div>
    );
  }

  const delta = prev ? now.index - prev.index : 0;
  const Arrow = delta > 2 ? TrendingUp : delta < -2 ? TrendingDown : Minus;
  const arrowColor = delta > 2 ? "text-emerald-600" : delta < -2 ? "text-rose-600" : "text-muted-foreground";
  const arrowBg = delta > 2 ? "bg-emerald-100" : delta < -2 ? "bg-rose-100" : "bg-muted";

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#101927] to-[#1E2A47] p-6 text-white shadow-lg">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-white/55">
              Índice de Bienestar
            </p>
            <p className="mt-1 font-display text-5xl font-bold">{now.index}</p>
            <p className="text-xs text-white/55">de 100 · últimos 7 días</p>
          </div>
          <div className={`flex items-center gap-1 rounded-full ${arrowBg} px-3 py-1.5 ${arrowColor}`}>
            <Arrow size={14} />
            <span className="text-xs font-bold">{delta >= 0 ? "+" : ""}{delta}</span>
          </div>
        </div>
        <p className="mt-4 text-sm text-white/75">
          {delta > 2
            ? `Mejoraste un ${delta}% esta semana. Seguí así.`
            : delta < -2
            ? `Bajaste ${Math.abs(delta)}% vs semana anterior. Empezá de a poco.`
            : "Te mantenés estable. Pequeños hábitos generan grandes cambios."}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <MiniStat label="Sueño" value={`${now.sleep}%`} color="#6366F1" />
        <MiniStat label="Objetivos" value={`${now.goalRate}%`} color="#F59E0B" />
        <MiniStat label="Recursos" value={String(now.resourceCount)} color="#10B981" />
      </div>
    </div>
  );
}

function MiniStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl bg-white p-3 text-center shadow-[0_2px_18px_-6px_rgba(15,23,42,0.06)]"
    >
      <p className="font-display text-xl font-bold" style={{ color }}>
        {value}
      </p>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </motion.div>
  );
}
