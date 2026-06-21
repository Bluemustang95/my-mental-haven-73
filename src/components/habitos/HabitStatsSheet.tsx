import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { type Habit, type Completion, computeBestStreak, VALUE_OPTIONS } from "@/hooks/useHabits";

interface Props {
  habit: Habit | null;
  completions: Completion[];
  onClose: () => void;
}

export function HabitStatsSheet({ habit, completions, onClose }: Props) {
  const stats = useMemo(() => {
    if (!habit) return null;
    const own = completions.filter(c => c.habit_id === habit.id);
    const now = new Date();
    const monthCount = own.filter(c => {
      const d = new Date(c.completed_date + "T00:00:00");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    // hourly buckets [morning, midday, afternoon, night] from created_at
    const hourly = [0, 0, 0, 0];
    own.forEach(c => {
      const h = new Date(c.created_at).getHours();
      if (h >= 6 && h < 12) hourly[0]++;
      else if (h >= 12 && h < 17) hourly[1]++;
      else if (h >= 17 && h < 21) hourly[2]++;
      else hourly[3]++;
    });

    const weekday = [0, 0, 0, 0, 0, 0, 0];
    own.forEach(c => {
      const d = new Date(c.completed_date + "T00:00:00");
      const idx = (d.getDay() + 6) % 7;
      weekday[idx]++;
    });

    const trend = [0, 0, 0, 0];
    own.forEach(c => {
      const d = new Date(c.completed_date + "T00:00:00");
      const diffDays = Math.floor((Date.now() - d.getTime()) / 86400000);
      if (diffDays < 7) trend[3]++;
      else if (diffDays < 14) trend[2]++;
      else if (diffDays < 21) trend[1]++;
      else if (diffDays < 28) trend[0]++;
    });

    return { monthCount, bestStreak: computeBestStreak(completions, habit.id), hourly, weekday, trend };
  }, [habit, completions]);

  return (
    <AnimatePresence>
      {habit && stats && (
        <>
          <motion.div
            className="fixed inset-0 z-[90] bg-[#101927]/40 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-x-0 bottom-0 z-[100] mx-auto max-h-[88vh] max-w-[480px] overflow-y-auto rounded-t-[32px] border border-white/60 bg-white/95 p-6 pb-12 shadow-[0_-20px_50px_-10px_rgba(16,25,39,0.18)] backdrop-blur-[28px]"
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 240 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#101927]/15" />
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl ring-1 ring-[#101927]/8">{habit.icon}</div>
                <div>
                  <h2 className="font-serif text-[20px] font-bold text-[#101927]">{habit.name}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">
                    VALOR: {VALUE_OPTIONS.find(v => v.key === habit.value_key)?.label}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full bg-[#101927]/5"><X size={16} /></button>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <StatCard label="Total del mes" value={`${stats.monthCount}`} sub="completados" color={habit.text_color} />
              <StatCard label="Mejor racha" value={`${stats.bestStreak}`} sub="días seguidos" color={habit.text_color} />
            </div>

            <Section title="Distribución horaria">
              <HBars data={stats.hourly} labels={["Mañana", "Mediodía", "Tarde", "Noche"]} color={habit.color} />
            </Section>

            <Section title="Rendimiento semanal">
              <VBars data={stats.weekday} labels={["L", "M", "M", "J", "V", "S", "D"]} color={habit.color} />
            </Section>

            <Section title="Tendencia últimas 4 semanas">
              <VBars data={stats.trend} labels={["S-4", "S-3", "S-2", "S-1"]} color={habit.color} />
            </Section>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

function StatCard({ label, value, sub, color }: { label: string; value: string; sub: string; color: string }) {
  return (
    <div className="rounded-2xl border border-white/60 bg-white p-4 shadow-[0_4px_12px_-6px_rgba(16,25,39,0.08)]">
      <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">{label}</p>
      <p className="mt-1 font-serif text-[28px] font-bold leading-none" style={{ color }}>{value}</p>
      <p className="mt-1 text-[11px] text-[#101927]/55">{sub}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 rounded-2xl border border-white/60 bg-white p-4">
      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#101927]/55">{title}</p>
      <div className="mt-3">{children}</div>
    </div>
  );
}

function HBars({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="space-y-2">
      {data.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <span className="w-16 text-[11px] text-[#101927]/60">{labels[i]}</span>
          <div className="h-2.5 flex-1 rounded-full bg-[#eef1f5]">
            <div className="h-full rounded-full transition-all" style={{ width: `${(v / max) * 100}%`, backgroundColor: color }} />
          </div>
          <span className="w-6 text-right text-[11px] font-bold text-[#101927]/65">{v}</span>
        </div>
      ))}
    </div>
  );
}

function VBars({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const max = Math.max(1, ...data);
  return (
    <div className="flex items-end gap-2">
      {data.map((v, i) => (
        <div key={i} className="flex flex-1 flex-col items-center gap-1.5">
          <div className="flex h-24 w-full items-end">
            <div className="w-full rounded-t-md transition-all" style={{ height: `${(v / max) * 100}%`, backgroundColor: color, minHeight: v > 0 ? 4 : 0 }} />
          </div>
          <span className="text-[10px] font-semibold text-[#101927]/55">{labels[i]}</span>
        </div>
      ))}
    </div>
  );
}
