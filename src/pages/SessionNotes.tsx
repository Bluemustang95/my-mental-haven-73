import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash, NoteBlank } from "@phosphor-icons/react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { es } from "date-fns/locale";

type SessionNote = {
  id: string;
  session_date: string;
  note: string;
  mood_after: number | null;
  created_at: string | null;
};

const moodLabels: Record<number, string> = { 1: "Muy bajo", 2: "Bajo", 3: "Neutro", 4: "Bien", 5: "Muy bien" };

export default function SessionNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<SessionNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [note, setNote] = useState("");
  const [mood, setMood] = useState<number | null>(null);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchNotes = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("session_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("session_date", { ascending: false });
    setNotes(data ?? []);
    setLoading(false);
  };

  useEffect(() => { fetchNotes(); }, [user]);

  const handleSave = async () => {
    if (!user || !note.trim()) return;
    await supabase.from("session_notes").insert({
      user_id: user.id,
      session_date: date,
      note: note.trim(),
      mood_after: mood,
    });
    setNote("");
    setMood(null);
    setShowForm(false);
    fetchNotes();
  };

  const handleDelete = async (id: string) => {
    await supabase.from("session_notes").delete().eq("id", id);
    fetchNotes();
  };

  return (
    <div className="px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Notas de Sesión</h1>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">Anotá reflexiones después de cada sesión con tu terapeuta.</p>

      {!showForm && (
        <button
          onClick={() => setShowForm(true)}
          className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-accent/40 bg-accent/5 p-4 font-display text-sm font-medium text-accent-foreground transition-colors active:bg-accent/10"
        >
          <Plus size={18} /> Nueva nota
        </button>
      )}

      {showForm && (
        <div className="mb-5 rounded-2xl border border-border bg-card p-5 space-y-4">
          <div>
            <label className="mb-1 block font-display text-xs font-medium text-muted-foreground">Fecha de sesión</label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-xl border border-border bg-background p-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </div>
          <div>
            <label className="mb-1 block font-display text-xs font-medium text-muted-foreground">¿Cómo te sentiste después?</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((v) => (
                <button
                  key={v}
                  onClick={() => setMood(mood === v ? null : v)}
                  className={`rounded-full border px-3 py-1 text-[10px] font-display transition-all ${mood === v ? "border-accent bg-accent/10" : "border-border text-muted-foreground"}`}
                >
                  {moodLabels[v]}
                </button>
              ))}
            </div>
          </div>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="¿Qué hablaron? ¿Qué te resonó?"
            className="w-full resize-none rounded-xl border border-border bg-background p-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={4}
          />
          <div className="flex gap-2">
            <button onClick={() => setShowForm(false)} className="flex-1 rounded-xl border border-border py-2.5 font-display text-sm font-medium">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={!note.trim()}
              className="flex-1 rounded-xl bg-primary py-2.5 font-display text-sm font-medium text-primary-foreground disabled:opacity-50"
            >
              Guardar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-col items-center py-12 text-muted-foreground">
          <NoteBlank size={40} weight="duotone" className="mb-2" />
          <p className="text-sm">Aún no tenés notas.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((n) => (
            <div key={n.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-display text-xs font-medium text-muted-foreground">
                  {format(new Date(n.session_date), "d 'de' MMMM, yyyy", { locale: es })}
                </p>
                <button onClick={() => handleDelete(n.id)} className="text-muted-foreground active:text-destructive">
                  <Trash size={14} />
                </button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.note}</p>
              {n.mood_after && (
                <p className="mt-2 text-[10px] text-muted-foreground">Ánimo: {moodLabels[n.mood_after] ?? n.mood_after}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
