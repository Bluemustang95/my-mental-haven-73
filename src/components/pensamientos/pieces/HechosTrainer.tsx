import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, X } from "lucide-react";
import { TRAINER_ITEMS } from "@/lib/pensamientos/trainerData";

type Props = {
  onComplete: (score: number) => void;
};

export default function HechosTrainer({ onComplete }: Props) {
  const [open, setOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, "hecho" | "pensamiento" | null>>({});

  const answered = TRAINER_ITEMS.filter((i) => answers[i.id]).length;
  const correct = TRAINER_ITEMS.filter((i) => answers[i.id] === i.answer).length;
  const completed = answered === TRAINER_ITEMS.length;

  const choose = (id: string, choice: "hecho" | "pensamiento") => {
    if (answers[id]) return;
    const next = { ...answers, [id]: choice };
    setAnswers(next);
    const nextCorrect = TRAINER_ITEMS.filter((i) => next[i.id] === i.answer).length;
    if (Object.keys(next).length === TRAINER_ITEMS.length) onComplete(nextCorrect);
  };

  return (
    <div className="rounded-2xl border border-white/70 bg-white/60 backdrop-blur-[20px] overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full px-4 py-4 flex items-center justify-between gap-3"
      >
        <span className="font-display text-[15px] font-semibold text-[#7cc2c8]">
          🧠 ¿Te cuesta separar Hechos de Pensamientos?
        </span>
        <ChevronDown
          size={18}
          className={`text-[#7cc2c8] shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3">
              {completed && (
                <div className="rounded-xl bg-[#A7F3D0]/30 border border-[#A7F3D0]/50 px-3 py-2 text-center">
                  <p className="font-display text-base font-bold text-[#065f46]">
                    Puntuación: {correct} / {TRAINER_ITEMS.length}
                  </p>
                </div>
              )}
              {TRAINER_ITEMS.map((item, idx) => {
                const a = answers[item.id];
                const isCorrect = a === item.answer;
                return (
                  <div
                    key={item.id}
                    className="rounded-xl border border-[#101927]/8 bg-white p-3"
                  >
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#101927]/45">
                      Ítem {idx + 1}
                    </p>
                    <p className="mt-1 text-sm text-[#101927] leading-relaxed">
                      "{item.text}"
                    </p>
                    {!a ? (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        <button
                          onClick={() => choose(item.id, "hecho")}
                          className="rounded-lg border border-[#101927]/10 bg-white py-2 text-xs font-semibold text-[#101927] active:scale-95 transition"
                        >
                          Es Hecho
                        </button>
                        <button
                          onClick={() => choose(item.id, "pensamiento")}
                          className="rounded-lg border border-[#101927]/10 bg-white py-2 text-xs font-semibold text-[#101927] active:scale-95 transition"
                        >
                          Es Pensamiento
                        </button>
                      </div>
                    ) : (
                      <div
                        className={`mt-3 rounded-lg px-3 py-2 ${
                          isCorrect ? "bg-[#A7F3D0]/30" : "bg-[#FCA5A5]/20"
                        }`}
                      >
                        <div className="flex items-center gap-1.5">
                          {isCorrect ? (
                            <Check size={14} className="text-[#065f46]" />
                          ) : (
                            <X size={14} className="text-[#9b1c1c]" />
                          )}
                          <p className="text-[11px] font-bold uppercase tracking-widest">
                            {isCorrect
                              ? `Correcto: es un ${item.answer}`
                              : `La respuesta es: ${item.answer}`}
                          </p>
                        </div>
                        <p className="mt-1 text-xs text-[#101927]/75 leading-relaxed">
                          {item.justification}
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
