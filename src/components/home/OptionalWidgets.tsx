import { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { localDateStr } from "@/lib/utils";
import { toast } from "sonner";
import { WidgetShell, WIDGET_IDENTITY } from "@/components/home/WidgetVisual";

export function MiniHabitsWidget() {
  const { user } = useAuth();
  const [habit, setHabit] = useState<{ id: string; name: string } | null>(null);
  const [doneToday, setDoneToday] = useState(false);
  const ink = WIDGET_IDENTITY.mini_habits.ink;

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await (supabase as any)
        .from("habits")
        .select("id, name")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .order("created_at", { ascending: true })
        .limit(1);
      const h = data?.[0];
      if (!h) return;
      setHabit({ id: h.id, name: h.name });
      const { data: c } = await (supabase as any)
        .from("habit_completions")
        .select("id")
        .eq("habit_id", h.id)
        .eq("completed_date", localDateStr(new Date()))
        .limit(1);
      setDoneToday((c?.length ?? 0) > 0);
    })();
  }, [user]);

  const toggle = async () => {
    if (!habit || !user) return;
    if (doneToday) {
      await (supabase as any)
        .from("habit_completions")
        .delete()
        .eq("habit_id", habit.id)
        .eq("completed_date", localDateStr(new Date()));
      setDoneToday(false);
    } else {
      await (supabase as any).from("habit_completions").insert({
        habit_id: habit.id,
        user_id: user.id,
        completed_date: localDateStr(new Date()),
      });
      setDoneToday(true);
      toast.success("¡Hábito completado! ✨");
    }
  };

  return (
    <WidgetShell id="mini_habits">
      <p className="mt-1 font-display text-[14px] font-bold" style={{ color: ink }}>
        Mini hábitos
      </p>
      {habit ? (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="min-w-0 truncate font-serifElegant text-[15px]" style={{ color: ink }}>
            {habit.name}
          </p>
          <button
            onClick={toggle}
            aria-label="Marcar"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition active:scale-90"
            style={{
              background: doneToday ? ink : "rgba(255,255,255,0.7)",
              color: doneToday ? "#ffffff" : ink,
            }}
          >
            <Check size={16} strokeWidth={3} />
          </button>
        </div>
      ) : (
        <p className="mt-2 text-[12px]" style={{ color: ink, opacity: 0.75 }}>
          Aún no tenés hábitos activos.
        </p>
      )}
    </WidgetShell>
  );
}

export function GratitudeWidget() {
  const { user } = useAuth();
  const [val, setVal] = useState("");
  const [saved, setSaved] = useState(false);
  const ink = WIDGET_IDENTITY.gratitude.ink;

  const save = async () => {
    if (!val.trim() || !user) return;
    await (supabase as any).from("journal_entries").insert({
      user_id: user.id,
      entry_date: localDateStr(new Date()),
      prompt: "Gratitud",
      content: val.trim(),
    });
    setSaved(true);
    setVal("");
    toast.success("Gratitud guardada ✨");
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <WidgetShell id="gratitude">
      <p className="mt-1 font-display text-[14px] font-bold" style={{ color: ink }}>
        Agradecimiento
      </p>
      <input
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Hoy agradezco…"
        className="mt-2 w-full bg-transparent font-serifElegant text-[14px] italic focus:outline-none"
        style={{ color: ink }}
      />
      {val && (
        <button
          onClick={save}
          className="mt-2 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white"
          style={{ background: ink }}
        >
          {saved ? "Guardado ✓" : "Guardar"}
        </button>
      )}
    </WidgetShell>
  );
}

export function ContentionNotesWidget() {
  const { user } = useAuth();
  const [val, setVal] = useState("");
  const ink = WIDGET_IDENTITY.contention_notes.ink;

  const save = async () => {
    if (!val.trim() || !user) return;
    await (supabase as any).from("journal_entries").insert({
      user_id: user.id,
      entry_date: localDateStr(new Date()),
      prompt: "Contención",
      content: val.trim(),
    });
    toast.success("Nota guardada para revisar más tarde ✨");
    setVal("");
  };

  return (
    <WidgetShell id="contention_notes">
      <p className="mt-1 font-display text-[14px] font-bold" style={{ color: ink }}>
        Notas de contención
      </p>
      <textarea
        value={val}
        onChange={(e) => setVal(e.target.value)}
        placeholder="Escribe pensamientos para revisar más tarde…"
        rows={2}
        onBlur={save}
        className="mt-2 w-full resize-none rounded-xl border border-white/50 bg-white/70 px-2.5 py-2 text-[13px] focus:outline-none"
        style={{ color: ink }}
      />
    </WidgetShell>
  );
}
