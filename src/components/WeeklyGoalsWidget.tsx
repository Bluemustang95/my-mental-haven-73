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
      <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-medium uppercase tracking-wider text-muted-foreground">
        <Target size={16} /> {title}
      </h2>
      <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
        {goals.map((g) => (
          <div key={g.id} className="flex items-center gap-3">
            <button
              onClick={() => toggleGoal(g.id, g.completed)}
              className={cn(
                "flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 transition-all",
                g.completed ? "border-accent bg-accent/20" : "border-border"
              )}
            >
              {g.completed && <Check size={12} weight="bold" className="text-accent" />}
            </button>
            <span className={cn("flex-1 text-sm", g.completed && "line-through text-muted-foreground")}>
              {g.goal_text}
            </span>
            <button onClick={() => deleteGoal(g.id)} className="text-muted-foreground active:text-destructive">
              <X size={14} />
            </button>
          </div>
        ))}

        {goals.length === 0 && !adding && (
          <p className="text-center text-sm text-muted-foreground">Definí hasta 3 metas para esta semana.</p>
        )}

        {adding ? (
          <div className="flex gap-2">
            <input
              value={newGoal}
              onChange={(e) => setNewGoal(e.target.value)}
              placeholder="Ej: Meditar 5 min/día"
              className="flex-1 rounded-xl border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              onKeyDown={(e) => e.key === "Enter" && addGoal()}
              autoFocus
            />
            <button onClick={addGoal} className="rounded-xl bg-primary px-4 py-2 font-display text-xs font-medium text-primary-foreground">
              OK
            </button>
          </div>
        ) : goals.length < 3 ? (
          <button
            onClick={() => setAdding(true)}
            className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-border py-2 text-xs text-muted-foreground transition-colors active:bg-muted"
          >
            <Plus size={14} /> Agregar meta
          </button>
        ) : null}
      </div>
    </section>
  );
}
