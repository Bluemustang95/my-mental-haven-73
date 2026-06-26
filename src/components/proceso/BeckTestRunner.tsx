import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, Wind, Share2, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Question = { id: string; dimension: string; title: string; options: string[] };

// Demo subset of BDI-II (4 representative items)
const QUESTIONS: Question[] = [
  {
    id: "tristeza",
    dimension: "Dimensión afectiva",
    title: "Tristeza",
    options: [
      "No me siento triste.",
      "Me siento triste gran parte del tiempo.",
      "Estoy triste todo el tiempo.",
      "Estoy tan triste o infeliz que no puedo soportarlo.",
    ],
  },
  {
    id: "pesimismo",
    dimension: "Dimensión cognitiva",
    title: "Pesimismo",
    options: [
      "No estoy desalentado respecto de mi futuro.",
      "Me siento más desalentado respecto de mi futuro que lo habitual.",
      "No espero que las cosas funcionen para mí.",
      "Siento que el futuro es desesperanzador y sólo empeorará.",
    ],
  },
  {
    id: "placer",
    dimension: "Dimensión conductual",
    title: "Pérdida de placer",
    options: [
      "Obtengo tanta satisfacción como antes.",
      "No disfruto tanto como antes de las cosas que solía disfrutar.",
      "Obtengo muy poco placer de las cosas que solía disfrutar.",
      "No puedo obtener ningún placer de las cosas.",
    ],
  },
  {
    id: "critica",
    dimension: "Dimensión cognitiva",
    title: "Pensamientos críticos",
    options: [
      "No me critico ni me culpo más que de costumbre.",
      "Soy más crítico conmigo mismo que de costumbre.",
      "Me critico por todos mis defectos.",
      "Me culpo por todo lo malo que sucede.",
    ],
  },
];

function bandFor(score: number) {
  if (score <= 13) return { label: "Mínimo", color: "#22c55e" };
  if (score <= 19) return { label: "Leve", color: "#eab308" };
  if (score <= 28) return { label: "Moderado", color: "#f97316" };
  return { label: "Severo", color: "#ef4444" };
}

export function BeckTestRunner({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [finished, setFinished] = useState(false);

  const reset = () => {
    setStep(0);
    setAnswers([]);
    setFinished(false);
  };

  const close = () => {
    onClose();
    setTimeout(reset, 300);
  };

  const handleAnswer = (value: number) => {
    const next = [...answers];
    next[step] = value;
    setAnswers(next);
    if (step + 1 >= QUESTIONS.length) {
      setFinished(true);
    } else {
      setStep(step + 1);
    }
  };

  // For demo: extrapolate raw score across 21 BDI items to fit the band realistically
  const rawScore = answers.reduce((a, b) => a + (b ?? 0), 0);
  // multiply by ~5 to project onto full scale (4 items × ~5 ≈ 21 items)
  const score = useMemo(() => Math.min(63, Math.round(rawScore * 5.25)), [rawScore]);
  const band = bandFor(score);
  const q = QUESTIONS[step];
  const progress = ((step + (finished ? 1 : 0)) / QUESTIONS.length) * 100;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] overflow-y-auto bg-[#f9f9fb]"
        >
          <div className="mx-auto max-w-md px-5 pt-10 pb-12">
            {!finished ? (
              <>
                {/* Header */}
                <div className="flex items-center justify-between">
                  <button
                    onClick={step === 0 ? close : () => setStep(step - 1)}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm"
                  >
                    <ChevronLeft size={20} className="text-[#0f172a]" />
                  </button>
                  <div className="text-right">
                    <p className="font-[Montserrat] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#7cc2c8]">
                      Depresión (BDI-II)
                    </p>
                    <p className="text-[14px] font-bold text-[#0f172a]">{step + 1} de {QUESTIONS.length}</p>
                  </div>
                </div>

                {/* Progress */}
                <div className="mt-5 h-1.5 w-full overflow-hidden rounded-full bg-[#e2e8f0]">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    className="h-full rounded-full bg-[#7cc2c8]"
                  />
                </div>

                {/* Dimension + title */}
                <p className="mt-8 font-[Montserrat] text-[11px] font-bold uppercase tracking-[0.18em] text-[#facb60]">
                  {q.dimension}
                </p>
                <h2 className="mt-1 font-serif text-[28px] font-bold text-[#0f172a]">{q.title}</h2>
                <p className="mt-1 text-[13px] text-[#64748b]">
                  Selecciona la frase que mejor se adapte a ti esta última semana:
                </p>

                {/* Options */}
                <div className="mt-8 space-y-3">
                  {q.options.map((opt, i) => (
                    <motion.button
                      key={i}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleAnswer(i)}
                      className="flex w-full items-start gap-4 rounded-full bg-white px-5 py-4 text-left shadow-sm transition hover:shadow-md"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#e2e8f0] text-[12px] font-semibold text-[#64748b]">
                        {i}
                      </span>
                      <span className="text-[14px] leading-snug text-[#0f172a]">{opt}</span>
                    </motion.button>
                  ))}
                </div>

                <p className="mt-10 text-center text-[12px] italic text-[#94a3b8]">
                  La honestidad contigo mismo es clave para un diagnóstico eficaz.
                </p>
              </>
            ) : (
              <ResultsScreen score={score} band={band} onClose={close} />
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ResultsScreen({
  score,
  band,
  onClose,
}: {
  score: number;
  band: { label: string; color: string };
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const severe = score >= 29;
  const needlePct = Math.min(100, Math.max(0, (score / 63) * 100));

  return (
    <div className="relative">
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-sm"
        >
          <X size={16} className="text-[#0f172a]" />
        </button>
      </div>

      <div className="mt-8 text-center">
        <h2 className="font-serif text-[28px] font-bold text-[#0f172a]">Evaluación Completa</h2>
        <p className="mt-1 text-[14px] text-[#64748b]">Depresión (BDI-II)</p>
      </div>

      {/* Score card */}
      <div className="mt-6 rounded-[24px] bg-white p-6 shadow-sm">
        <p className="text-center font-[Montserrat] text-[11px] font-semibold uppercase tracking-[0.18em] text-[#94a3b8]">
          Puntaje total
        </p>
        <p className="mt-2 text-center font-serif text-[56px] font-bold leading-none text-[#0f172a]">{score}</p>

        {/* Thermometer */}
        <div className="mt-7">
          <div className="flex justify-between text-[10px] font-semibold uppercase tracking-wider text-[#94a3b8]">
            <span>Mínimo</span>
            <span>Leve</span>
            <span>Moderado</span>
            <span>Severo</span>
          </div>
          <div className="relative mt-2 h-2.5 w-full overflow-hidden rounded-full">
            <div className="flex h-full w-full">
              <div className="h-full" style={{ width: `${(14 / 64) * 100}%`, background: "#22c55e" }} />
              <div className="h-full" style={{ width: `${(6 / 64) * 100}%`, background: "#eab308" }} />
              <div className="h-full" style={{ width: `${(9 / 64) * 100}%`, background: "#f97316" }} />
              <div className="h-full" style={{ width: `${(35 / 64) * 100}%`, background: "#ef4444" }} />
            </div>
            <motion.div
              initial={{ left: 0, opacity: 0 }}
              animate={{ left: `${needlePct}%`, opacity: 1 }}
              transition={{ type: "spring", stiffness: 120, damping: 18, delay: 0.15 }}
              className="absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-[#0f172a] bg-white shadow-md"
            />
          </div>
          <div className="mt-2 flex justify-between text-[11px] text-[#94a3b8]">
            <span>0</span>
            <span>13</span>
            <span>19</span>
            <span>28</span>
            <span>63</span>
          </div>
        </div>

        <div className="mt-6 flex justify-center">
          <span
            className="rounded-full px-3 py-1 text-[12px] font-bold uppercase tracking-wider"
            style={{ background: `${band.color}1f`, color: band.color }}
          >
            Resultado {band.label}
          </span>
        </div>

        <p className="mt-3 text-center text-[13px] leading-relaxed text-[#64748b]">
          Tu puntaje se sitúa en el baremo <span className="font-semibold text-[#0f172a]">{band.label}</span>. Las
          puntuaciones cambian con el tiempo: lo importante es seguir registrando.
        </p>
      </div>

      {/* Severe protocol */}
      {severe && (
        <div className="mt-5 rounded-[24px] border border-[#facb60]/60 bg-[#fffbeb] p-5">
          <div className="flex items-center gap-2">
            <span>💛</span>
            <p className="font-[Montserrat] text-[11px] font-bold uppercase tracking-[0.18em] text-[#92400e]">
              Soporte médico RESMA
            </p>
          </div>
          <p className="mt-2 text-[13px] leading-snug text-[#78350f]">
            Recordá que <span className="font-semibold">esta puntuación es un estado transitorio, no define tu identidad</span>.
            Estamos acá para acompañarte de forma segura.
          </p>

          <button
            onClick={() => navigate("/mi-proceso/resumen")}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-3 text-[13px] font-semibold text-white"
          >
            <Share2 size={14} />
            Sincronizar con Lic. Claudio
          </button>
          <button
            onClick={() => navigate("/herramientas/mindfulness/respiracion")}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#f59e0b] py-3 text-[13px] font-semibold text-white"
          >
            <Wind size={14} />
            Iniciar Respiración de Rescate
          </button>
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-6 w-full rounded-full border border-[#e2e8f0] bg-white py-3 text-[13px] font-medium text-[#0f172a]"
      >
        Volver a Mi Proceso
      </button>
    </div>
  );
}
