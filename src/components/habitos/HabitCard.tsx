import { useMemo } from "react";
import { motion } from "framer-motion";
import { type Habit, type Completion, computeStreak, localDateStr, VALUE_OPTIONS } from "@/hooks/useHabits";

type View = "grid" | "semana" | "cards";

interface Props {
  habit: Habit;
  completions: Completion[];
  view: View;
  onToggle: (dateStr: string) => void;
  onOpenStats: () => void;
}

function dateForOffset(offsetDaysBack: number): string {
  const d = new Date();
  d.setDate(d.getDate() - offsetDaysBack);
  return localDateStr(d);
}

function monthDays(): { date: string; day: number }[] {
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const last = new Date(year, month + 1, 0).getDate();
  const arr: { date: string; day: number }[] = [];
  for (let d = 1; d <= last; d++) {
    const dt = new Date(year, month, d);
    arr.push({ date: localDateStr(dt), day: d });
  }
  return arr;
}

function weekDays(): { date: string; label: string }[] {
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=Mon
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - dow + i);
    return { date: localDateStr(d), label: labels[i] };
  });
}

export function HabitCard({ habit, completions, view, onToggle, onOpenStats }: Props) {
  const done = useMemo(() => new Set(completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date)), [completions, habit.id]);
  const streak = useMemo(() => computeStreak(completions, habit.id), [completions, habit.id]);
  const valueLabel = VALUE_OPTIONS.find(v => v.key === habit.value_key)?.label ?? habit.value_key;

  return (
    <motion.div
      layout
      className="rounded-[28px] border border-white/60 bg-white/75 p-5 shadow-[0_10px_30px_-12px_rgba(16,25,39,0.08)] backdrop-blur-[24px]"
    >
      <button onClick={onOpenStats} className="flex w-full items-start justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-2xl shadow-[0_4px_12px_-4px_rgba(16,25,39,0.12)] ring-1 ring-[#101927]/8">
            {habit.icon}
          </div>
          <div>
            <h3 className="font-serif text-[18px] font-bold leading-tight text-[#101927]">{habit.name}</h3>
            <p className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">
              VALOR: {valueLabel}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">Racha</p>
          <p className="font-serif text-[18px] font-bold" style={{ color: habit.text_color }}>
            {streak} días <span className="text-base">🔥</span>
          </p>
        </div>
      </button>

      <div className="mt-4">
        {view === "grid" && (
          <>
            <div className="grid grid-cols-10 gap-1.5">
              {Array.from({ length: 40 }).map((_, i) => {
                const dateStr = dateForOffset(39 - i);
                const isDone = done.has(dateStr);
                return (
                  <button
                    key={i}
                    onClick={() => onToggle(dateStr)}
                    className="aspect-square rounded-md transition-transform active:scale-90"
                    style={{
                      backgroundColor: isDone ? habit.color : "#eef1f5",
                      boxShadow: isDone ? `0 2px 8px -2px ${habit.color}80` : undefined,
                    }}
                    aria-label={dateStr}
                  />
                );
              })}
            </div>
            <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/35">
              Tocá los bloques para registrar tus completados diarios
            </p>
          </>
        )}

        {view === "semana" && (
          <div>
            <div className="grid grid-cols-7 gap-2">
              {weekDays().map((d, i) => (
                <p key={i} className="text-center text-[10px] font-bold uppercase tracking-wider text-[#101927]/40">{d.label}</p>
              ))}
            </div>
            <div className="mt-2 grid grid-cols-7 gap-2">
              {weekDays().map((d) => {
                const isDone = done.has(d.date);
                return (
                  <button
                    key={d.date}
                    onClick={() => onToggle(d.date)}
                    className="flex aspect-square items-center justify-center rounded-full border transition-transform active:scale-90"
                    style={{
                      borderColor: isDone ? habit.color : "#e2e7ee",
                      backgroundColor: isDone ? habit.color : "transparent",
                    }}
                  >
                    {isDone && <span className="text-[#101927] text-lg font-bold">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "cards" && (
          <div className="grid grid-cols-7 gap-2">
            {monthDays().slice(0, 28).map(({ date, day }) => {
              const isDone = done.has(date);
              return (
                <button
                  key={date}
                  onClick={() => onToggle(date)}
                  className="flex aspect-square items-center justify-center rounded-xl text-[12px] font-bold transition-transform active:scale-90"
                  style={{
                    backgroundColor: isDone ? habit.color : "#f3f5f8",
                    color: isDone ? "#101927" : "#101927a0",
                  }}
                >
                  {day}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
