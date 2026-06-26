import { useEffect, useState } from "react";
import { Check, Droplet, Sparkles, NotebookPen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";

export function MiniHabitsWidget() {
  const { user } = useAuth();
  const [habit, setHabit] = useState<{ id: string; name: string } | null>(null);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("habits")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1);
      const h = data?.[0];
      if (!h) return;
      setHabit({ id: h.id, name: h.name });
      const { data: c } = await supabase
        .from("habit_completions")
        .select("id")
        .eq("habit_id", h.id)
        .eq("completion_date", localDateStr(new Date()))
        .limit(1);
      setDoneToday((c?.length ?? 0) > 0);
    })();
  }, [user]);

  const toggle = async () => {
    if (!habit || !user) return;
    if (doneToday) {
      await supabase
        .from("habit_completions")
        .delete()
        .eq("habit_id", habit.id)
        .eq("completion_date", localDateStr(new Date()));
      setDoneToday(false);
    } else {
      await supabase.from("habit_completions").insert({
        habit_id: habit.id,
        user_id: user.id,
        completion_date: localDateStr(new Date()),
      });
      setDoneToday(true);
      toast.success("¡Hábito completado! ✨");
    }
  };

  if (!habit) {
    return (
      <div className="glass-premium rounded-[22px] p-3.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">Mini hábitos</p>
        <p className="mt-1 text-sm text-muted-foreground">Aún no tenés hábitos activos.</p>
      </div>
    );
  }

  return (
    <div className="glass-premium flex items-center justify-between rounded-[22px] p-3.5">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">Mini hábitos</p>
        <p className="mt-0.5 truncate font-display text-[15px] font-bold text-resma-navy">
          <Droplet size={13} className="mr-1 inline text-resma-teal" />
          {habit.name}
        </p>
      </div>
      <button
        onClick={toggle}
        aria-label="Marcar"
        className={`flex h-10 w-10 items-center justify-center rounded-full transition active:scale-90 ${
          doneToday ? "bg-resma-teal text-white" : "border border-foreground/10 bg-white text-resma-navy/60"
        }`}
      >
        <Check size={18} strokeWidth={3} />
      </button>
    </div>
  );
}

export function GratitudeWidget() {
  const { user } = useAuth();
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState(false);

  const save = async () => {
    if (!val.trim() || !user) return;
    await supabase.from("journal_entries").insert({
      user_id: user.id,
      kind: "gratitud",
      content: val.trim(),
    } as any);
    setSaved(true);
    setVal("");
    toast.success("Gratitud guardada ✨");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="glass-premium rounded-[22px] p-3.5">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
        <Sparkles size={10} /> Agradecimiento
      </p>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Hoy agradezco…"
        className="mt-2 w-full bg-transparent font-serifElegant text-[14px] italic text-resma-navy placeholder:text-muted-foreground/60 focus:outline-none"
      />
      {val && (
        <button
          onClick={save}
          className="mt-2 rounded-full bg-resma-navy px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
        >
          {saved ? "Guardado ✓" : "Guardar"}
        </button>
      )}
    </div>
  );
}

export function ContentionNotesWidget() {
  const { user } = useAuth();
  const [val, setVal] = useState("");

  const save = async () => {
    if (!val.trim() || !user) return;
    await supabase.from("journal_entries").insert({
      user_id: user.id,
      kind: "contencion",
      content: val.trim(),
    } as any);
    toast.success("Nota guardada para revisar más tarde ✨");
    setVal("");
  };

  return (
    <div className="glass-premium rounded-[22px] p-3.5">
      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground/80">
        <NotebookPen size={10} /> Notas rápidas de contención
      </p>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Escribe pensamientos para revisar más tarde…"
        rows={2}
        onBlur={save}
        className="mt-2 w-full resize-none rounded-2xl border border-foreground/5 bg-white/60 px-3 py-2 text-[13px] text-resma-navy placeholder:text-muted-foreground/55 focus:border-resma-teal/50 focus:outline-none"
      />
    </div>
  );
}
