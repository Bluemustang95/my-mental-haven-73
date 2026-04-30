import { useState, useEffect } from "react";
import { Plus, Check, X, Target } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { cn, localWeekStart } from "@/lib/utils";

type Goal = {
  id: string;
  goal_text: string;
  completed: boolean;
};

function getWeekStart(): string {
  return localWeekStart();
}

export function WeeklyGoalsWidget({ title = "Metas de la semana" }: { title?: string }) {
  const { user } = useAuth();
  const [goals, setGoals] = useState<Goal[]>([]);
  const [newGoal, setNewGoal] = useState("");
  const [adding, setAdding] = useState(false);
  const weekStart = getWeekStart();

  const fetch = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("weekly_goals")
      .select("id, goal_text, completed")
      .eq("user_id", user.id)
      .eq("week_start", weekStart)
      .order("created_at", { ascending: true });
    setGoals(data ?? []);
  };

  useEffect(() => { fetch(); }, [user]);

  const addGoal = async () => {
    if (!user || !newGoal.trim() || goals.length >= 3) return;
    await supabase.from("weekly_goals").insert({
      user_id: user.id,
      week_start: weekStart,
      goal_text: newGoal.trim(),
    });
    setNewGoal("");
    setAdding(false);
    fetch();
  };

  const toggleGoal = async (id: string, completed: boolean) => {
    await supabase.from("weekly_goals").update({ completed: !completed }).eq("id", id);
    fetch();
  };

  const deleteGoal = async (id: string) => {
    await supabase.from("weekly_goals").delete().eq("id", id);
    fetch();
  };

  return (
    <section className="mb-6">
      <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-wider text-resource-values-accent/70">
        <Target size={16} /> {title}
      </h2>
      <div className="space-y-3 rounded-[2.5rem] border border-resource-values-accent/15 bg-card/75 p-5 shadow-sm">
        {goals.map((g) => (
          <div key={g.id} className="flex items-center gap-3">
            <button
              onClick={() => toggleGoal(g.id, g.completed)}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                g.completed ? "border-resource-values-accent bg-resource-values-accent/15" : "border-resource-values-accent/20 bg-resource-values-bg/40"
              )}
            >
              {g.completed && <Check size={12} weight="bold" className="text-resource-values-accent" />}
            </button>
            <span className={cn("flex-1 font-sans text-sm text-resource-values-accent", g.completed && "text-resource-values-accent/45 line-through")}>
              {g.goal_text}
            </span>
            <button onClick={() => deleteGoal(g.id)} className="text-resource-values-accent/45 active:text-resource-values-accent">
              <X size={14} />
            </button>
          </div>
        ))}

        {goals.length === 0 && !adding && (
          <p className="text-center font-sans text-sm text-resource-values-accent/65">Definí hasta 3 metas para esta semana.</p>
        )}

        {adding ? (
          <div className="flex gap-2">
            <input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Ej: Meditar 5 min/día"
              className="flex-1 rounded-2xl border border-resource-values-accent/15 bg-resource-values-bg/55 px-3 py-2 font-sans text-sm text-resource-values-accent placeholder:text-resource-values-accent/40 focus:outline-none focus:ring-2 focus:ring-resource-values-accent/20"
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              autoFocus
            />
            <button onClick={addGoal} className="rounded-2xl bg-resource-values-accent px-4 py-2 font-display text-xs font-semibold text-primary-foreground">
              OK
            </button>
          </div>
        ) : goals.length < 3 ? (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-2xl border border-dashed border-resource-values-accent/25 bg-resource-values-bg/45 py-2 font-display text-xs font-semibold text-resource-values-accent/70 transition-colors active:bg-resource-values-bg"
          >
            <Plus size={14} /> Agregar meta
          </button>
        ) : null}
      </div>
    </section>
  );
}
