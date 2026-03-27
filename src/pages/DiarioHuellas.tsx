import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, PencilSimple } from "@phosphor-icons/react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface Entry {
  id: string;
  content: string;
  prompt: string | null;
  emotion_tags: string[] | null;
  entry_date: string | null;
  created_at: string | null;
}

export default function DiarioHuellas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("journal_entries")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(50)
      .then(({ data }) => {
        setEntries(data ?? []);
        setLoading(false);
      });
  }, [user]);

  const entry = entries[current];

  const formatDate = (d: string | null) => {
    if (!d) return "";
    try {
      return format(new Date(d), "d 'de' MMMM, yyyy", { locale: es });
    } catch {
      return d;
    }
  };

  /* swipe handlers */
  /* "Anterior" → hacia el pasado (índice mayor), "Siguiente" → hacia lo reciente (índice menor) */
  const goPrev = () => setCurrent((c) => Math.min(entries.length - 1, c + 1));
  const goNext = () => setCurrent((c) => Math.max(0, c - 1));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex min-h-screen flex-col bg-[hsl(30,18%,94%)]"
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-14 pb-3 safe-area-top">
        <button onClick={() => navigate(-1)} className="rounded-xl p-1.5 active:bg-foreground/5">
          <ArrowLeft size={22} weight="bold" className="text-foreground" />
        </button>
        <h1 className="font-display text-lg font-semibold text-foreground">Tus Huellas</h1>
      </div>

      {loading && (
        <div className="flex flex-1 items-center justify-center">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-accent border-t-transparent" />
        </div>
      )}

      {!loading && entries.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-8 text-center">
          <PencilSimple size={40} weight="duotone" className="text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">
            Aún no hay entradas. Empezá a escribir en tu diario para verlas acá.
          </p>
        </div>
      )}

      {!loading && entry && (
        <div className="flex flex-1 flex-col items-center justify-center px-5 py-6">
          {/* Book */}
          <AnimatePresence mode="wait">
            <motion.div
              key={entry.id}
              initial={{ rotateY: 90, opacity: 0 }}
              animate={{ rotateY: 0, opacity: 1 }}
              exit={{ rotateY: -90, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              style={{ perspective: 1000 }}
              className="relative w-full max-w-sm"
            >
              {/* Page */}
              <div
                className="relative rounded-2xl border border-[hsl(35,25%,85%)] p-6 shadow-[0_4px_24px_-6px_rgba(80,60,30,0.12)]"
                style={{
                  background:
                    "linear-gradient(168deg, hsl(40 30% 96%) 0%, hsl(35 22% 92%) 100%)",
                  minHeight: 360,
                }}
              >
                {/* Spine shadow */}
                <div className="pointer-events-none absolute left-0 top-4 bottom-4 w-[3px] rounded-full bg-[hsl(30,20%,78%)]/40" />

                {/* Date */}
                <p className="mb-1 text-[11px] font-medium uppercase tracking-widest text-[hsl(30,15%,55%)]">
                  {formatDate(entry.entry_date || entry.created_at)}
                </p>

                {/* Prompt */}
                {entry.prompt && (
                  <p className="mb-3 text-[12px] italic text-muted-foreground/70">
                    "{entry.prompt}"
                  </p>
                )}

                {/* Content */}
                <p className="whitespace-pre-wrap font-body text-[14px] leading-relaxed text-foreground/85">
                  {entry.content}
                </p>

                {/* Emotion tags */}
                {entry.emotion_tags && entry.emotion_tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {entry.emotion_tags.map((t) => (
                      <span
                        key={t}
                        className="rounded-full bg-accent/15 px-2.5 py-0.5 text-[10px] font-medium text-accent-foreground"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Page number */}
                <p className="mt-6 text-center text-[11px] text-muted-foreground/40">
                  {current + 1} / {entries.length}
                </p>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="mt-5 flex items-center gap-6">
            <button
              onClick={goPrev}
              disabled={current === entries.length - 1}
              className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 active:bg-foreground/5 disabled:opacity-30"
            >
              ← Anterior
            </button>
            <button
              onClick={goNext}
              disabled={current === 0}
              className="rounded-xl px-4 py-2 text-sm font-medium text-foreground/70 active:bg-foreground/5 disabled:opacity-30"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
