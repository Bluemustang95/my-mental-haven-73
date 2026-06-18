import { useEffect, useMemo, useState } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Check, X as XIcon, ArrowRight, Zap } from "lucide-react";
import { pickDeck, type Statement, type Difficulty } from "@/lib/factJudgmentBank";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { ExerciseTopBar } from "@/components/exercises/ExerciseTopBar";
import { GlossaryTerm } from "@/components/mindfulness/GlossaryTerm";
import { cn } from "@/lib/utils";

interface Props {
  music: MusicTrack;
  onComplete: () => void;
  onAbort: () => void;
}

const ACCENT = "#A78BFA";

const LEVELS: { id: Difficulty; label: string; desc: string }[] = [
  { id: 1, label: "Suave", desc: "Cartas fáciles para empezar" },
  { id: 2, label: "Mixto", desc: "Fáciles + ambiguas" },
  { id: 3, label: "Desafiante", desc: "Incluye casos sutiles" },
];

export function HechosJuiciosView({ music, onComplete, onAbort }: Props) {
  const [level, setLevel] = useState<Difficulty | null>(null);
  const [deckKey, setDeckKey] = useState(0);
  const deck = useMemo(
    () => (level ? pickDeck(10, level) : []),
    [level, deckKey]
  );
  const [idx, setIdx] = useState(0);
  const [hits, setHits] = useState(0);
  const [showFeedback, setShowFeedback] = useState<null | { correct: boolean; card: Statement }>(null);

  const audio = useMindfulAudio();
  useEffect(() => {
    audio.playMusic(music);
    return () => {
      audio.stopMusic();
      audio.stopSpeech();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  if (!level) {
    return (
      <div className="absolute inset-0 flex flex-col px-5 pt-12 pb-8">
        <ExerciseTopBar title="Hechos vs. Juicios" onAbort={onAbort} />
        <div className="mt-8 text-center">
          <h2 className="font-serif text-2xl font-bold text-white">¿Cómo querés arrancar?</h2>
          <p className="mt-2 text-sm text-white/60">
            Vas a leer frases y decidir si son un{" "}
            <GlossaryTerm term="hecho">hecho</GlossaryTerm> o un{" "}
            <GlossaryTerm term="juicio">juicio</GlossaryTerm>.
          </p>
        </div>

        <div className="mt-8 space-y-3">
          {LEVELS.map((l) => (
            <motion.button
              key={l.id}
              whileTap={{ scale: 0.97 }}
              onClick={() => setLevel(l.id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-4 text-left"
            >
              <div
                className="flex h-10 w-10 items-center justify-center rounded-xl"
                style={{ background: `${ACCENT}25`, color: ACCENT }}
              >
                <Zap size={18} />
              </div>
              <div className="flex-1">
                <div className="font-display text-base font-semibold text-white">{l.label}</div>
                <div className="text-[11px] text-white/55">{l.desc}</div>
              </div>
              <ArrowRight size={16} className="text-white/40" />
            </motion.button>
          ))}
        </div>
      </div>
    );
  }

  const current = deck[idx];

  function answer(choice: "fact" | "judgment") {
    if (!current || showFeedback) return;
    const correct = current.kind === choice;
    if (correct) setHits((h) => h + 1);
    setShowFeedback({ correct, card: current });
  }

  function next() {
    setShowFeedback(null);
    if (idx + 1 >= deck.length) onComplete();
    else setIdx((i) => i + 1);
  }

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-12 pb-8">
      <ExerciseTopBar
        title="Hechos vs. Juicios"
        subtitle={`Carta ${idx + 1} de ${deck.length} · ${hits} aciertos · ${LEVELS.find((l) => l.id === level)?.label}`}
        onAbort={onAbort}
      />

      <div className="relative flex flex-1 items-center justify-center">
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
              <div
                className={cn(
                  "mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full",
                  showFeedback.correct
                    ? "bg-[#34C759]/20 text-[#34C759]"
                    : "bg-[#F87171]/20 text-[#F87171]"
                )}
              >
                {showFeedback.correct ? <Check size={28} /> : <XIcon size={28} />}
              </div>
              <div className="font-display text-xl font-semibold text-white">
                {showFeedback.correct
                  ? "Bien observado"
                  : "Era un " + (showFeedback.card.kind === "fact" ? "hecho" : "juicio")}
              </div>
              <p className="mt-3 font-serif text-sm leading-relaxed text-white/75">
                {showFeedback.card.explain}
              </p>
              <button
                onClick={next}
                className="mt-5 inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white"
                style={{ background: ACCENT, boxShadow: `0 10px 28px ${ACCENT}55` }}
              >
                {idx + 1 >= deck.length ? "Ver resumen" : "Siguiente"} <ArrowRight size={16} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!showFeedback && (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => answer("judgment")}
            className="rounded-2xl border border-[#F87171]/40 bg-[#F87171]/10 py-4 text-sm font-semibold text-[#FCA5A5]"
          >
            Juicio
          </button>
          <button
            onClick={() => answer("fact")}
            className="rounded-2xl border border-[#34C759]/40 bg-[#34C759]/10 py-4 text-sm font-semibold text-[#86EFAC]"
          >
            Hecho
          </button>
        </div>
      )}
    </div>
  );
}

function SwipeCard({
  statement,
  onAnswer,
}: {
  statement: Statement;
  onAnswer: (c: "fact" | "judgment") => void;
}) {
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
      className="relative w-full max-w-sm cursor-grab rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur"
    >
      <motion.div
        style={{ opacity: judgOp }}
        className="absolute left-4 top-4 rotate-[-12deg] rounded-md border-2 border-[#F87171] px-2 py-0.5 text-xs font-bold uppercase text-[#F87171]"
      >
        Juicio
      </motion.div>
      <motion.div
        style={{ opacity: factOp }}
        className="absolute right-4 top-4 rotate-[12deg] rounded-md border-2 border-[#34C759] px-2 py-0.5 text-xs font-bold uppercase text-[#34C759]"
      >
        Hecho
      </motion.div>
      <p className="mt-6 text-center font-serif text-xl leading-relaxed text-white">
        "{statement.text}"
      </p>
      <p className="mt-6 text-center text-[10px] uppercase tracking-wider text-white/40">
        Deslizá ← juicio · hecho →
      </p>
    </motion.div>
  );
}

// Silenciar warning de var no usada
void setDeckKey;
