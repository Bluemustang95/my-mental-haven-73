import { useMemo } from "react";
import { motion } from "framer-motion";
import { Check, Info } from "lucide-react";
import { type Habit, type Completion, computeStreak, localDateStr } from "@/hooks/useHabits";
import { DBT_CATEGORIES, LINE_ICONS } from "@/lib/habitsIcons";
import type { HabitView } from "./ViewSegmentedControl";

interface Props {
  habit: Habit;
  completions: Completion[];
  view: HabitView;
  onToggle: (dateStr: string) => void;
  onOpenDetail: () => void;
}

function dateBack(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return localDateStr(d);
}

function monthCells(): { date: string }[] {
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: last }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return { date: localDateStr(d) };
  });
}

function HabitIcon({ habit, className = "text-2xl" }: { habit: Habit; className?: string }) {
  if (habit.icon_type === "line") {
    const found = LINE_ICONS.find(i => i.id === habit.icon);
    if (found) {
      const Ic = found.Icon;
      return <Ic size={22} strokeWidth={1.6} className="text-[#101927]" />;
    }
  }
  return <span className={className}>{habit.icon}</span>;
}

export function HabitCard({ habit, completions, view, onToggle, onOpenDetail }: Props) {
  const doneSet = useMemo(
    () => new Set(completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date)),
    [completions, habit.id]
  );
  const streak = useMemo(() => computeStreak(completions, habit.id), [completions, habit.id]);
  const today = localDateStr();
  const isTodayDone = doneSet.has(today);
  const categoryLabel = DBT_CATEGORIES.find(c => c.key === habit.category_key)?.label ?? habit.category_key;

  if (view === "cards") {
    return (
      <motion.div
        layout
        onClick={onOpenDetail}
        className="flex cursor-pointer flex-col rounded-[24px] border border-white/60 bg-white/85 p-4 text-left shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] backdrop-blur-[20px]"
      >
        <div className="flex items-start justify-between">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-[0_4px_10px_-4px_rgba(16,25,39,0.12)] ring-1 ring-[#101927]/8">
            <HabitIcon habit={habit} className="text-xl" />
          </div>
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(today); }}
            whileTap={{ scale: 0.85 }}
            animate={isTodayDone ? { scale: [1, 1.15, 1] } : {}}
            className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full transition"
            style={{ backgroundColor: isTodayDone ? habit.color : "#eef1f5" }}
            aria-label="Completar hoy"
          >
            <Check size={14} strokeWidth={3} className={isTodayDone ? "text-[#101927]" : "text-[#101927]/30"} />
          </motion.button>
        </div>
        <h3 className="mt-6 font-serif text-[15px] font-bold leading-tight text-[#101927]">{habit.name}</h3>
        <p className="mt-1 font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/50">{categoryLabel}</p>
        <p className="mt-2 text-[12px] font-bold" style={{ color: habit.text_color }}>{streak}d racha 🔥</p>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      className="rounded-[28px] border border-white/60 bg-white/85 p-5 shadow-[0_10px_30px_-14px_rgba(16,25,39,0.10)] backdrop-blur-[20px]"
    >
      <div className="flex items-start justify-between gap-3">
        <button onClick={onOpenDetail} className="flex flex-1 items-center gap-3 text-left">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-[0_4px_12px_-4px_rgba(16,25,39,0.12)] ring-1 ring-[#101927]/8">
            <HabitIcon habit={habit} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h3 className="truncate font-serif text-[17px] font-bold leading-tight text-[#101927]">{habit.name}</h3>
              <Info size={12} className="shrink-0 text-[#101927]/35" />
            </div>
            <p className="mt-0.5 font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.18em] text-[#101927]/45">
              CATEGORÍA: {categoryLabel}
            </p>
          </div>
        </button>

        {view === "grid" ? (
          <motion.button
            type="button"
            onClick={(e) => { e.stopPropagation(); e.preventDefault(); onToggle(today); }}
            whileTap={{ scale: 0.85 }}
            animate={isTodayDone ? { scale: [1, 1.18, 1] } : {}}
            transition={{ duration: 0.25 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition"
            style={{ backgroundColor: isTodayDone ? habit.color : "#eef1f5" }}
            aria-label="Completar hoy"
          >
            <Check size={18} strokeWidth={3} className={isTodayDone ? "text-[#101927]" : "text-[#101927]/30"} />
          </motion.button>
        ) : (
          <div className="text-right">
            <p className="font-serif text-[15px] font-bold leading-none" style={{ color: habit.text_color }}>
              {streak}d <span className="text-base">🔥</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-4">
        {view === "grid" && (
          <>
            <div className="mb-2 flex items-center justify-between">
              <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.18em] text-[#101927]/45">
                Constancia mes actual
              </p>
              <p className="text-[10px] font-bold" style={{ color: habit.text_color }}>
                Racha: {streak}d 🔥
              </p>
            </div>
            <div className="grid grid-cols-10 gap-1.5">
              {monthCells().slice(0, 20).map(({ date }) => {
                const isDone = doneSet.has(date);
                return (
                  <motion.button
                    key={date}
                    onClick={() => onToggle(date)}
                    whileTap={{ scale: 0.8 }}
                    className="aspect-square rounded-md"
                    style={{
                      backgroundColor: isDone ? habit.color : "#eef1f5",
                      boxShadow: isDone ? `0 2px 6px -2px ${habit.color}80` : undefined,
                    }}
                    aria-label={date}
                  />
                );
              })}
            </div>
          </>
        )}

        {view === "last5" && (
          <div className="grid grid-cols-5 gap-2">
            {Array.from({ length: 5 }).map((_, i) => {
              const offset = 4 - i;
              const date = dateBack(offset);
              const d = new Date(date + "T00:00:00");
              const dow = ["DO", "LU", "MA", "MI", "JU", "VI", "SÁ"][d.getDay()];
              const dayNum = d.getDate();
              const isDone = doneSet.has(date);
              return (
                <motion.button
                  key={date}
                  onClick={() => onToggle(date)}
                  whileTap={{ scale: 0.9 }}
                  animate={isDone ? { scale: [1, 1.08, 1] } : {}}
                  className="flex aspect-square flex-col items-center justify-center rounded-2xl border transition"
                  style={{
                    borderColor: isDone ? habit.color : "#e2e7ee",
                    backgroundColor: isDone ? habit.color : "transparent",
                  }}
                >
                  <span className="font-[Montserrat] text-[9px] font-bold tracking-[0.14em] text-[#101927]/60">{dow}</span>
                  <span className="font-serif text-[18px] font-bold text-[#101927]">{dayNum}</span>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
