import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Leaf, Plus, Check, Trash } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { cn, localDateStr } from "@/lib/utils";

const SUGGESTED_TASKS = [
  "Caminar 15 min sin celular",
  "Tomar un vaso de agua",
  "Estirarse durante 5 minutos",
  "Escribir 3 cosas por las que estás agradecido/a",
  "Escuchar una canción que te guste",
  "Sentarte al sol unos minutos",
  "Llamar a alguien querido",
  "Ordenar un espacio pequeño de tu casa",
];

type Task = { id: string; task_text: string; completed: boolean; completed_date: string | null };

export default function SelfCare() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newTask, setNewTask] = useState("");
  const [loading, setLoading] = useState(true);
  const todayStr = localDateStr();

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("selfcare_tasks")
        .select("id, task_text, completed, completed_date")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(30);
      setTasks((data as Task[]) ?? []);
      setLoading(false);
    })();
  }, [user]);

  const addSuggested = async (text: string) => {
    if (!user) return;
    const { data } = await supabase
      .from("selfcare_tasks")
      .insert({ user_id: user.id, task_text: text, is_suggested: true })
      .select("id, task_text, completed, completed_date")
      .single();
    if (data) setTasks((t) => [data as Task, ...t]);
  };

  const addCustom = async () => {
    if (!user || !newTask.trim()) return;
    const { data } = await supabase
      .from("selfcare_tasks")
      .insert({ user_id: user.id, task_text: newTask.trim(), is_suggested: false })
      .select("id, task_text, completed, completed_date")
      .single();
    if (data) setTasks((t) => [data as Task, ...t]);
    setNewTask("");
  };

  const toggleComplete = async (task: Task) => {
    const completed = !task.completed;
    await supabase
      .from("selfcare_tasks")
      .update({ completed, completed_date: completed ? todayStr : null })
      .eq("id", task.id);
    setTasks((ts) => ts.map((t) => (t.id === task.id ? { ...t, completed, completed_date: completed ? todayStr : null } : t)));
  };

  const deleteTask = async (id: string) => {
    await supabase.from("selfcare_tasks").delete().eq("id", id);
    setTasks((ts) => ts.filter((t) => t.id !== id));
  };

  const unusedSuggestions = SUGGESTED_TASKS.filter((s) => !tasks.some((t) => t.task_text === s));

  return (
    <div className="min-h-screen bg-resource-selfcare-bg px-5 pt-14 pb-4 safe-area-top">
      <button onClick={() => navigate("/herramientas")} className="mb-4 flex items-center gap-1 text-sm text-resource-selfcare-accent/65">
        <ArrowLeft size={16} /> Herramientas
      </button>
      <h1 className="mb-2 font-display text-xl font-semibold flex items-center gap-2 text-resource-selfcare-accent">
        <Leaf size={24} weight="duotone" /> Autocuidado
      </h1>
      <p className="mb-6 text-sm text-resource-selfcare-accent/65">Pequeñas acciones para el mundo real.</p>

      {/* Add custom */}
      <div className="mb-4 flex gap-2">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()}
          placeholder="Agregar actividad..."
          className="flex-1 rounded-xl border border-resource-selfcare-accent/20 bg-card/75 px-3 py-2.5 text-sm text-foreground placeholder:text-resource-selfcare-accent/35 focus:outline-none focus:ring-1 focus:ring-resource-selfcare-accent/30"
        />
        <button onClick={addCustom} disabled={!newTask.trim()} className="rounded-xl bg-resource-selfcare-accent px-3 text-primary-foreground active:scale-95 transition-transform disabled:opacity-40">
          <Plus size={18} />
        </button>
      </div>

      {/* Task list */}
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-resource-selfcare-accent border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          <AnimatePresence>
            {tasks.map((task) => (
              <motion.div
                key={task.id}
                layout
                exit={{ opacity: 0, x: -30 }}
                className={cn(
                  "flex items-center gap-3 rounded-2xl border bg-card/75 p-3.5 transition-colors",
                  task.completed ? "border-resource-selfcare-accent/30 bg-resource-selfcare-accent/10" : "border-resource-selfcare-accent/15"
                )}
              >
                <button onClick={() => toggleComplete(task)} className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                  task.completed ? "border-resource-selfcare-accent bg-resource-selfcare-accent text-primary-foreground" : "border-resource-selfcare-accent/30"
                )}>
                  {task.completed && <Check size={14} weight="bold" />}
                </button>
                <span className={cn("flex-1 text-sm", task.completed && "line-through text-resource-selfcare-accent/55")}>{task.task_text}</span>
                <button onClick={() => deleteTask(task.id)} className="p-1 text-resource-selfcare-accent/45 active:text-resource-selfcare-accent">
                  <Trash size={14} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}

      {/* Suggestions */}
      {unusedSuggestions.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-xs font-medium uppercase tracking-wider text-resource-selfcare-accent/65">Sugerencias</h2>
          <div className="flex flex-wrap gap-2">
            {unusedSuggestions.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => addSuggested(s)}
                className="rounded-full border border-resource-selfcare-accent/15 bg-card/75 px-3 py-1.5 text-xs text-resource-selfcare-accent/75 transition-colors active:bg-resource-selfcare-accent/10"
              >
                + {s}
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
