import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Check, X, ArrowRight } from "lucide-react";
import { pickDeck, type Statement } from "@/lib/factJudgmentBank";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";

interface Props {
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

export function HechosJuiciosView({ music, onComplete }: Props) {
  const deck = useMemo(() => pickDeck(10), []);
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [showFeedback, setShowFeedback] = useState<null | { correct: boolean; card: Statement }>(null);

  const audio = useMindfulAudio();
  useEffect(() => {
    audio.startMusic(music);
    return () => { audio.stopMusic(); audio.stopVoice(); };
  }, [music]);

  const current = deck[idx];

  function answer(choice: "fact" | "judgment") {
    if (!current || showFeedback) return;
    const correct = current.kind === choice;
    if (correct) setHits((h) => h + 1);
    setShowFeedback({ correct, card: current });
  }

  function next() {
    setShowFeedback(null);
    if (idx + 1 >= deck.length) {
      onComplete();
    } else {
      setIdx((i) => i + 1);
    }
  }

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-12 pb-8">
      <div className="flex items-center justify-between text-xs text-white/55">
        <span>Carta {idx + 1} de {deck.length}</span>
        <span>Aciertos {hits}</span>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {current && !showFeedback && (
            <SwipeCard key={current.id} statement={current} onAnswer={answer} />
          )}
          {showFeedback && (
            <motion.div
              key="fb"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="w-full max-w-sm rounded-3xl border border-white/10 bg-white/5 p-6 text-center"
            >
              <div className={`mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full ${showFeedback.correct ? "bg-[#34C759]/20 text-[#34C759]" : "bg-[#F87171]/20 text-[#F87171]"}`}>
                {showFeedback.correct ? <Check size={28} /> : <X size={28} />}
              </div>
              <div className="font-display text-xl font-semibold text-white">
                {showFeedback.correct ? "Bien observado" : "Era un " + (showFeedback.card.kind === "fact" ? "hecho" : "juicio")}
              </div>
              <p className="mt-3 font-serif text-sm text-white/75 leading-relaxed">{showFeedback.card.explain}</p>
              <button onClick={next} className="mt-5 inline-flex items-center gap-2 rounded-full bg-[#FB923C] px-6 py-3 text-sm font-semibold text-[#0F172A]">
                {idx + 1 >= deck.length ? "Ver resumen" : "Siguiente"} <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showFeedback && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={() => answer("judgment")} className="rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 py-4 text-sm font-semibold text-[#FCA5A5]">
            Juicio
          </button>
          <button onClick={() => answer("fact")} className="rounded-2xl border border-[#34C759]/40 bg-[#34C759]/10 py-4 text-sm font-semibold text-[#86EFAC]">
            Hecho
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeCard({ statement, onAnswer }: { statement: Statement; onAnswer: (c: "fact" | "judgment") => void }) {
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-12, 12]);
  const factOp = useTransform(x, [10, 120], [0, 1]);
  const judgOp = useTransform(x, [-120, -10], [1, 0]);

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      style={{ x, rotate }}
      onDragEnd={(_, info) => {
        if (info.offset.x > 120) onAnswer("fact");
        else if (info.offset.x < -120) onAnswer("judgment");
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="relative w-full max-w-sm cursor-grab rounded-3xl bg-white/10 border border-white/10 p-8 shadow-2xl backdrop-blur"
    >
      <motion.div style={{ opacity: judgOp }} className="absolute left-4 top-4 rounded-md border-2 border-[#F87171] px-2 py-0.5 text-xs font-bold text-[#F87171] uppercase rotate-[-12deg]">
        Juicio
      </motion.div>
      <motion.div style={{ opacity: factOp }} className="absolute right-4 top-4 rounded-md border-2 border-[#34C759] px-2 py-0.5 text-xs font-bold text-[#34C759] uppercase rotate-[12deg]">
        Hecho
      </motion.div>
      <p className="mt-6 text-center font-serif text-xl leading-relaxed text-white">"{statement.text}"</p>
      <p className="mt-6 text-center text-[10px] uppercase tracking-wider text-white/40">Deslizá ← juicio · hecho →</p>
    </motion.div>
  );
}
