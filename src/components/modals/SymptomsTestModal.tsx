import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Q = { id: string; code: string; prompt: string; kind: string };

const emojiMap: Record<string, string> = {
  irritabilidad: "😤",
  toc: "🔁",
  desesperanza: "🌧️",
  ansiedad: "😟",
  tristeza: "😢",
  sueno: "🌙",
  energia: "⚡",
  miedo: "😨",
  default: "🧠",
};

function emojiFor(code: string) {
  return emojiMap[code.toLowerCase()] ?? emojiMap.default;
}

export function SymptomsTestModal({
  open,
  kind = "symptom",
  onClose,
}: {
  open: boolean;
  kind?: "symptom" | "personality";
  onClose: () => void;
}) {
  const [questions, setQuestions] = useState<Q[]>([]);

  useEffect(() => {
    if (!open) return;
    supabase
      .from("algo_questions")
      .select("id, code, prompt, kind")
      .eq("kind", kind)
      .eq("active", true)
      .order("sort")
      .then(({ data }) => setQuestions((data ?? []) as Q[]));
  }, [open, kind]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-[#0F0F12] text-white"
        >
          <div className="relative mx-auto min-h-screen max-w-md px-6 pt-12 pb-12">
            <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl" />
            <div className="relative mb-8 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-widest text-white/45">
                  {kind === "symptom" ? "Test de Síntomas" : "Test de Personalidad"}
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold">Elegí un área</h2>
              </div>
              <button
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-white/15 bg-white/5 backdrop-blur-md"
              >
                <X size={16} />
              </button>
            </div>

            {questions.length === 0 ? (
              <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/55">
                Todavía no hay preguntas configuradas. El admin puede crearlas en el panel.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {questions.map((q) => (
                  <motion.button
                    key={q.id}
                    whileTap={{ scale: 0.96 }}
                    className="relative flex aspect-[3/4] flex-col justify-between overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/[0.02] p-4 text-left backdrop-blur-md"
                  >
                    <p className="font-display text-base font-semibold leading-tight">
                      {q.prompt}
                    </p>
                    <div className="flex justify-end text-6xl">{emojiFor(q.code)}</div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
