import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Notebook } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface TherapyNote {
  id: string;
  note: string;
  created_at: string;
}

export default function TherapyNotes() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [notes, setNotes] = useState<TherapyNote[]>([]);
  const [draft, setDraft] = useState("");
  const [composing, setComposing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("therapy_prep_notes")
      .select("id, note, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setNotes((data as TherapyNote[]) || []);
        setLoading(false);
      });
  }, [user]);

  const saveNote = async () => {
    if (!user || !draft.trim()) return;
    const trimmed = draft.trim().slice(0, 2000);
    const { data, error } = await supabase
      .from("therapy_prep_notes")
      .insert({ user_id: user.id, note: trimmed })
      .select("id, note, created_at")
      .single();
    if (!error && data) {
      setNotes([data as TherapyNote, ...notes]);
      setDraft("");
      setComposing(false);
    }
  };

  const deleteNote = async (id: string) => {
    await supabase.from("therapy_prep_notes").delete().eq("id", id);
    setNotes(notes.filter((n) => n.id !== id));
    toast.success("Nota eliminada");
  };

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col bg-[#f9f9fb]">
      <div className="flex items-center gap-3 px-5 pt-14 pb-4 safe-area-top">
        <button
          onClick={() => navigate("/mi-proceso")}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm text-[#101927]"
        >
          <ArrowLeft size={16} />
        </button>
        <div>
          <h1 className="font-display text-base font-semibold text-[#101927]">Notas para terapia</h1>
          <p className="text-[11px] text-slate-500">Un espacio seguro para tu próxima sesión.</p>
        </div>
      </div>

      <div className="no-scrollbar flex-1 overflow-y-auto px-5 pb-24">
        {/* Compose */}
        <AnimatePresence mode="wait" initial={false}>
          {!composing ? (
            <motion.button
              key="btn"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setComposing(true)}
              className="mb-5 flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-slate-300 bg-white py-4 text-sm text-slate-500 active:bg-slate-50"
            >
              <Plus size={16} /> Escribir nueva nota...
            </motion.button>
          ) : (
            <motion.div
              key="card"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="mb-5 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100"
            >
              <textarea
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="¿Qué te gustaría hablar con tu terapeuta?"
                className="min-h-[120px] w-full resize-none border-0 bg-transparent text-sm leading-relaxed text-[#101927] placeholder:text-slate-400 focus:outline-none"
              />
              <div className="mt-2 flex items-center justify-end gap-2">
                <button
                  onClick={() => {
                    setDraft("");
                    setComposing(false);
                  }}
                  className="rounded-lg px-3 py-2 text-sm text-slate-500"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveNote}
                  disabled={!draft.trim()}
                  className="rounded-lg bg-[#101927] px-4 py-2 text-sm font-medium text-white disabled:opacity-40"
                >
                  Guardar nota
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#7cc2c8] border-t-transparent" />
          </div>
        ) : notes.length === 0 ? (
          <div className="mt-10 flex flex-col items-center text-center text-slate-400">
            <Notebook size={40} className="mb-2" />
            <p className="text-sm">Todavía no tenés notas.</p>
          </div>
        ) : (
          <section>
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-slate-400">
              Tus notas ({notes.length})
            </h3>
            <div className="space-y-2.5">
              <AnimatePresence>
                {notes.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="relative rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
                  >
                    <p className="pr-6 text-sm leading-relaxed text-[#101927] whitespace-pre-wrap">
                      {n.note}
                    </p>
                    <button
                      onClick={() => deleteNote(n.id)}
                      aria-label="Eliminar nota"
                      className="absolute right-2 top-2 rounded-full p-1.5 text-slate-300 active:text-red-500"
                    >
                      <Trash2 size={14} />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
