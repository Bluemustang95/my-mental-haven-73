import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Play, BookOpen } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Content = {
  id: string;
  title: string;
  subtitle: string | null;
  content: string | null;
  category: string | null;
};

export function PsychoModal({
  open,
  goal,
  onClose,
  onComplete,
}: {
  open: boolean;
  goal?: string | null;
  onClose: () => void;
  onComplete: () => void;
}) {
  const [c, setC] = useState<Content | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      const q = supabase
        .from("psychoeducation_content")
        .select("id, title, subtitle, content, category")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(1);
      const { data } = await q;
      setC((data?.[0] as any) ?? null);
    })();
  }, [open, goal]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-t-3xl bg-white sm:rounded-3xl"
          >
            <div className="relative flex h-44 items-center justify-center overflow-hidden bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-600">
              <div className="absolute inset-0 opacity-30">
                <div className="absolute -top-10 -left-10 h-40 w-40 rounded-full bg-white/30 blur-3xl" />
                <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-pink-300/40 blur-3xl" />
              </div>
              <button
                onClick={onClose}
                className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 backdrop-blur-md text-white"
              >
                <X size={16} />
              </button>
              <div className="relative flex h-16 w-16 items-center justify-center rounded-full bg-white/15 backdrop-blur-md ring-2 ring-white/30">
                <Play size={28} className="text-white" fill="white" />
              </div>
            </div>

            <div className="max-h-[55vh] overflow-y-auto p-6">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-violet-600">
                Psicoeducación
              </p>
              <h2 className="font-display text-xl font-bold text-[#101927]">
                {c?.title ?? "¿Qué son las distorsiones cognitivas?"}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c?.subtitle ??
                  "Aprende cómo nuestra mente a veces nos engaña y cómo identificar estas trampas."}
              </p>
              {c?.content && (
                <div className="mt-4 whitespace-pre-wrap text-sm leading-relaxed text-[#101927]/85">
                  {c.content}
                </div>
              )}
              {!c?.content && (
                <div className="mt-4 flex items-start gap-2 rounded-xl bg-violet-50 p-3 text-xs text-violet-900">
                  <BookOpen size={14} className="mt-0.5 shrink-0" />
                  Próximamente más contenido vinculado a tu perfil.
                </div>
              )}
            </div>

            <div className="border-t border-black/5 bg-white p-4">
              <button
                onClick={() => {
                  onComplete();
                  onClose();
                }}
                className="w-full rounded-2xl bg-[#101927] py-4 text-sm font-semibold text-white transition active:scale-[0.98]"
              >
                He leído y aprendido
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
