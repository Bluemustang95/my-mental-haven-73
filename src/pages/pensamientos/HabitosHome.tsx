import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { useHabits, type Habit } from "@/hooks/useHabits";
import { HabitShell } from "@/components/habitos/HabitShell";
import { DashboardHeader } from "@/components/habitos/DashboardHeader";
import { ViewSegmentedControl, type HabitView } from "@/components/habitos/ViewSegmentedControl";
import { HabitCard } from "@/components/habitos/HabitCard";
import { NewHabitSheet } from "@/components/habitos/NewHabitSheet";
import { HabitDetailSheet } from "@/components/habitos/HabitDetailSheet";
import { StatsDashboard } from "@/components/habitos/StatsDashboard";

export default function HabitosHome() {
  const { habits, completions, categories, loading, toggle, create, remove, addCategory } = useHabits();
  const [view, setView] = useState<HabitView>("grid");
  const [screen, setScreen] = useState<"dashboard" | "stats">("dashboard");
  const [newOpen, setNewOpen] = useState(false);
  const [detail, setDetail] = useState<Habit | null>(null);

  const handleToggle = (habitId: string, dateStr: string) => {
    toggle(habitId, dateStr);
    toast.success("Progreso registrado", { duration: 1400 });
  };

  return (
    <HabitShell>
      <AnimatePresence mode="wait">
        {screen === "stats" ? (
          <motion.div
            key="stats"
            initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col"
          >
            <StatsDashboard habits={habits} completions={completions} onBack={() => setScreen("dashboard")} />
          </motion.div>
        ) : (
          <motion.div
            key="dash"
            initial={{ opacity: 0, x: -24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 24 }}
            transition={{ duration: 0.25 }}
            className="flex h-full flex-col"
          >
            <DashboardHeader onOpenStats={() => setScreen("stats")} onNewHabit={() => setNewOpen(true)} />

            <div className="flex-1 overflow-y-auto px-5 pt-6 pb-28 no-scrollbar smooth-scroll">
              <div>
                <ViewSegmentedControl value={view} onChange={setView} />
              </div>

              <div className={`mt-5 ${view === "cards" ? "grid grid-cols-2 gap-3" : "space-y-4"}`}>
                {loading && <p className="col-span-2 text-center text-sm text-[#101927]/50">Cargando…</p>}

                {!loading && habits.length === 0 && (
                  <div className="col-span-2 rounded-[28px] border border-dashed border-[#101927]/15 bg-white/60 p-8 text-center">
                    <span className="text-4xl">⚡</span>
                    <h3 className="mt-3 font-serif text-lg font-bold text-[#101927]">Empezá tu primer hábito</h3>
                    <p className="mt-2 text-sm text-[#101927]/60">Tocá el botón <strong>+</strong> de arriba para crear una rutina.</p>
                    <button onClick={() => setNewOpen(true)} className="mt-4 rounded-full bg-[#101927] px-6 py-3 text-sm font-bold text-white">
                      Crear hábito
                    </button>
                  </div>
                )}

                {habits.map(h => (
                  <HabitCard
                    key={h.id}
                    habit={h}
                    completions={completions}
                    view={view}
                    onToggle={(d) => handleToggle(h.id, d)}
                    onOpenDetail={() => setDetail(h)}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <NewHabitSheet
        open={newOpen}
        onClose={() => setNewOpen(false)}
        onCreate={create}
        customCategories={categories}
        onAddCategory={addCategory}
        existingHabits={habits}
      />
      <HabitDetailSheet
        habit={detail}
        completions={completions}
        onClose={() => setDetail(null)}
        onToggle={(d) => detail && handleToggle(detail.id, d)}
        onDelete={remove}
      />
    </HabitShell>
  );
}
