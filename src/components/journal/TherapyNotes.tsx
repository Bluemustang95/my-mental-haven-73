import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Check, Trash, Notepad } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TherapyNote {
  id: string;
  note: string;
  resolved: boolean;
  created_at: string;
}

export default function TherapyNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<TherapyNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("therapy_prep_notes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotes((data as TherapyNote[]) || []);
        setLoading(false);
      });
  }, [user]);

  const addNote = async () => {
    if (!user || !newNote.trim()) return;
    const trimmed = newNote.trim().slice(0, 500);

    const { data, error } = await supabase
      .from("therapy_prep_notes")
      .insert({ user_id: user.id, note: trimmed })
      .select()
      .single();

    if (!error && data) {
      setNotes([data as TherapyNote, ...notes]);
      setNewNote("");
    }
  };

  const toggleResolved = async (id: string, current: boolean) => {
    await supabase.from("therapy_prep_notes").update({ resolved: !current }).eq("id", id);
    setNotes(notes.map((n) => (n.id === id ? { ...n, resolved: !current } : n)));
  };

  const deleteNote = async (id: string) => {
    await supabase.from("therapy_prep_notes").delete().eq("id", id);
    setNotes(notes.filter((n) => n.id !== id));
    toast.success("Nota eliminada");
  };

  const pending = notes.filter((n) => !n.resolved);
  const resolved = notes.filter((n) => n.resolved);

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Notas para terapia</h1>
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        Anotá preguntas o temas que quieras llevar a tu próxima sesión.
      </p>

      {/* Add new note */}
      <div className="mb-5 flex gap-2">
        <input
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          placeholder="Nueva nota..."
          maxLength={500}
          onKeyDown={(e) => e.key === "Enter" && addNote()}
          className="flex-1 rounded-xl border border-border bg-card px-3 py-2.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
        />
        <button
          onClick={addNote}
          disabled={!newNote.trim()}
          className={cn(
            "rounded-xl px-3 transition-all",
            newNote.trim() ? "bg-accent text-accent-foreground" : "bg-muted text-muted-foreground"
          )}
        >
          <Plus size={18} />
        </button>
      </div>

      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      ) : notes.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <Notepad size={40} weight="duotone" className="mb-3 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">Todavía no tenés notas.</p>
          <p className="text-xs text-muted-foreground">Cuando algo te resuene, anotalo acá.</p>
        </div>
      ) : (
        <div className="flex-1 space-y-4">
          {pending.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">Pendientes</h3>
              <AnimatePresence>
                {pending.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="mb-2 flex items-start gap-2 rounded-xl border border-accent/20 bg-accent/5 p-3"
                  >
                    <button onClick={() => toggleResolved(n.id, n.resolved)} className="mt-0.5 rounded-md border border-border p-0.5 text-muted-foreground hover:bg-muted">
                      <div className="h-3 w-3" />
                    </button>
                    <p className="flex-1 text-sm font-body leading-relaxed">{n.note}</p>
                    <button onClick={() => deleteNote(n.id)} className="text-muted-foreground hover:text-destructive">
                      <Trash size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {resolved.length > 0 && (
            <div>
              <h3 className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">Conversados</h3>
              {resolved.map((n) => (
                <div key={n.id} className="mb-2 flex items-start gap-2 rounded-xl border border-border bg-card p-3 opacity-60">
                  <button onClick={() => toggleResolved(n.id, n.resolved)} className="mt-0.5 rounded-md bg-success/20 p-0.5 text-success">
                    <Check size={12} />
                  </button>
                  <p className="flex-1 text-sm font-body leading-relaxed line-through">{n.note}</p>
                  <button onClick={() => deleteNote(n.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
