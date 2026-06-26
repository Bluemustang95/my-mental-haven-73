import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { type Habit, type Completion, computeStreak, localDateStr } from "@/hooks/useHabits";
import { DBT_CATEGORIES, LINE_ICONS, FREQUENCY_OPTIONS } from "@/lib/habitsIcons";

interface Props {
  habit: Habit | null;
  completions: Completion[];
  onClose: () => void;
  onToggle: (dateStr: string) => void;
  onDelete: (id: string) => Promise<void>;
}

function HabitGlyph({ habit }: { habit: Habit }) {
  if (habit.icon_type === "line") {
    const f = LINE_ICONS.find(i => i.id === habit.icon);
    if (f) { const Ic = f.Icon; return <Ic size={28} strokeWidth={1.6} className="text-[#101927]" />; }
  }
  return <span className="text-3xl">{habit.icon}</span>;
}

function MiniYearMatrix({ habit, completions }: { habit: Habit; completions: Completion[] }) {
  const year = new Date().getFullYear();
  const done = useMemo(
    () => new Set(completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date)),
    [completions, habit.id]
  );
  const months = ["E","F","M","A","M","J","J","A","S","O","N","D"];
  return (
    <div>
      <div className="grid grid-cols-12 gap-1.5">
        {months.map((m, mi) => {
          const cells = Array.from({ length: 4 }).map((_, ri) => {
            const day = ri * 7 + 4;
            const d = new Date(year, mi, day);
            return done.has(localDateStr(d));
          });
          return (
            <div key={mi} className="flex flex-col items-center gap-1">
              {cells.map((isDone, i) => (
                <div
                  key={i}
                  className="h-3 w-full rounded"
                  style={{ backgroundColor: isDone ? habit.color : "#eef1f5" }}
                />
              ))}
              <span className="font-[Montserrat] text-[8px] font-bold tracking-wider text-[#101927]/45">{m}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MonthCalendar({ habit, completions, onToggle }: { habit: Habit; completions: Completion[]; onToggle: (d: string) => void }) {
  const today = new Date();
  const year = today.getFullYear(), month = today.getMonth();
  const first = new Date(year, month, 1);
  const dow = (first.getDay() + 6) % 7; // mon=0
  const last = new Date(year, month + 1, 0).getDate();
  const done = useMemo(
    () => new Set(completions.filter(c => c.habit_id === habit.id).map(c => c.completed_date)),
    [completions, habit.id]
  );
  const labels = ["L", "M", "M", "J", "V", "S", "D"];
  const monthName = first.toLocaleDateString("es-AR", { month: "long", year: "numeric" });
  return (
    <div>
      <p className="mb-3 font-serif text-[15px] font-bold capitalize text-[#101927]">{monthName}</p>
      <div className="grid grid-cols-7 gap-1.5">
        {labels.map((l, i) => (
          <p key={i} className="text-center font-[Montserrat] text-[9px] font-bold uppercase tracking-wider text-[#101927]/40">{l}</p>
        ))}
        {Array.from({ length: dow }).map((_, i) => <span key={`p${i}`} />)}
        {Array.from({ length: last }).map((_, i) => {
          const day = i + 1;
          const d = new Date(year, month, day);
          const date = localDateStr(d);
          const isDone = done.has(date);
          const isToday = date === localDateStr();
          return (
            <motion.button
              key={day}
              onClick={() => onToggle(date)}
              whileTap={{ scale: 0.85 }}
              animate={isDone ? { scale: [1, 1.1, 1] } : {}}
              className={`flex aspect-square items-center justify-center rounded-xl text-[12px] font-bold transition ${
                isToday ? "ring-1 ring-[#101927]/30" : ""
              }`}
              style={{
                backgroundColor: isDone ? habit.color : "#f3f5f8",
                color: isDone ? "#101927" : "#101927a0",
              }}
            >{day}</motion.button>
          );
        })}
      </div>
    </div>
  );
}

export function HabitDetailSheet({ habit, completions, onClose, onToggle, onDelete }: Props) {
  const [confirmDel, setConfirmDel] = useState(false);
  const streak = useMemo(() => habit ? computeStreak(completions, habit.id) : 0, [habit, completions]);
  if (!habit) return null;
  const cat = DBT_CATEGORIES.find(c => c.key === habit.category_key)?.label ?? habit.category_key;
  const freq = FREQUENCY_OPTIONS.find(f => f.key === habit.frequency)?.label ?? habit.frequency;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[110] bg-[#101927]/40 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="fixed inset-x-0 bottom-0 z-[120] mx-auto flex max-h-[92vh] w-full max-w-md flex-col rounded-t-[32px] border border-white/60 bg-white/95 shadow-[0_-20px_50px_-10px_rgba(16,25,39,0.18)] backdrop-blur-[28px]"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 28, stiffness: 240 }}
      >
        <div className="shrink-0 px-6 pt-4">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[#101927]/15" />
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl shadow-[0_4px_12px_-4px_rgba(16,25,39,0.12)] ring-1 ring-[#101927]/8"
                   style={{ backgroundColor: habit.color + "20" }}>
                <HabitGlyph habit={habit} />
              </div>
              <div>
                <h2 className="font-serif text-[20px] font-bold leading-tight text-[#101927]">{habit.name}</h2>
                {habit.description && <p className="mt-0.5 text-[12px] text-[#101927]/60">{habit.description}</p>}
                <p className="mt-1 font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">{cat}</p>
              </div>
            </div>
            <button onClick={onClose} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#101927]/5">
              <X size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 pt-5 pb-8">
          {/* Quick stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-white/60 bg-white p-4">
              <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">Objetivo</p>
              <p className="mt-1 font-serif text-[18px] font-bold text-[#101927]">{habit.frequency_count}× {freq.toLowerCase()}</p>
            </div>
            <div className="rounded-2xl border border-white/60 bg-white p-4">
              <p className="font-[Montserrat] text-[9px] font-bold uppercase tracking-[0.16em] text-[#101927]/45">Racha</p>
              <p className="mt-1 font-serif text-[18px] font-bold" style={{ color: habit.text_color }}>{streak} días 🔥</p>
            </div>
          </div>

          {/* Year matrix */}
          <div className="mt-5 rounded-[24px] border border-white/60 bg-white p-5">
            <p className="font-[Montserrat] text-[10px] font-bold uppercase tracking-[0.18em] text-[#101927]/50">Constancia anual</p>
            <div className="mt-3"><MiniYearMatrix habit={habit} completions={completions} /></div>
          </div>

          {/* Month calendar */}
          <div className="mt-4 rounded-[24px] border border-white/60 bg-white p-5">
            <MonthCalendar habit={habit} completions={completions} onToggle={(d) => { onToggle(d); toast.success("Progreso actualizado"); }} />
          </div>

          {/* Actions */}
          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              onClick={() => toast.info("Próximamente: editar hábito")}
              className="rounded-full bg-[#101927] py-3.5 font-[Montserrat] text-[11px] font-bold uppercase tracking-[0.18em] text-white"
            >Editar</button>
            {!confirmDel ? (
              <button
                onClick={() => setConfirmDel(true)}
                className="flex items-center justify-center gap-2 rounded-full border border-[#f47b6f]/40 bg-[#f47b6f]/10 py-3.5 font-[Montserrat] text-[11px] font-bold uppercase tracking-[0.18em] text-[#a8392f]"
              ><Trash2 size={14} /> Eliminar</button>
            ) : (
              <button
                onClick={async () => { await onDelete(habit.id); toast.success("Hábito eliminado"); onClose(); }}
                className="rounded-full bg-[#a8392f] py-3.5 font-[Montserrat] text-[11px] font-bold uppercase tracking-[0.18em] text-white"
              >Confirmar eliminar</button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
