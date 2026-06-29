import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ChartLineUp, ArrowRight } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { CrisisModal } from "@/components/CrisisModal";

/**
 * Scoring corrections per test id.
 * - PSS-10: items 4,5,7,8 (0-indexed 3,4,6,7) son inversos (0-4 → 4-v).
 * - Rosenberg: items 3,5,8,9,10 (0-indexed 2,4,7,8,9) son inversos (0-3 → 3-v).
 */
const REVERSE_PSS10 = new Set([3, 4, 6, 7]);
const REVERSE_ROSENBERG = new Set([2, 4, 7, 8, 9]);

function computeScore(testId: string, answers: number[]): number {
  if (testId === "PSS-10") {
    return answers.reduce((acc, v, i) => acc + (REVERSE_PSS10.has(i) ? 4 - v : v), 0);
  }
  if (testId === "Rosenberg") {
    return answers.reduce((acc, v, i) => acc + (REVERSE_ROSENBERG.has(i) ? 3 - v : v), 0);
  }
  return answers.reduce((a, b) => a + b, 0);
}

type TestDef = {
  id: string;
  name: string;
  humanLabel: string;
  description: string;
  questions: string[];
  options: { label: string; value: number }[];
  preamble: string;
  interpret: (score: number) => { severity: string; color: string; message: string };
};

const freq4Options = [
  { label: "Nunca", value: 0 },
  { label: "Varios días", value: 1 },
  { label: "Más de la mitad de los días", value: 2 },
  { label: "Casi todos los días", value: 3 },
];

const freq5Options = [
  { label: "Nunca", value: 0 },
  { label: "Casi nunca", value: 1 },
  { label: "A veces", value: 2 },
  { label: "Frecuentemente", value: 3 },
  { label: "Muy frecuentemente", value: 4 },
];

const agree4Options = [
  { label: "Muy en desacuerdo", value: 0 },
  { label: "En desacuerdo", value: 1 },
  { label: "De acuerdo", value: 2 },
  { label: "Muy de acuerdo", value: 3 },
];

const tests: TestDef[] = [
  {
    id: "PHQ-9",
    name: "Depresión",
    humanLabel: "¿Cómo viene tu ánimo?",
    description: "Estado de ánimo en las últimas 2 semanas.",
    preamble: "En las últimas 2 semanas, ¿con qué frecuencia te ha molestado...",
    questions: [
      "Poco interés o placer en hacer cosas",
      "Sentirse desanimado/a, deprimido/a o sin esperanza",
      "Problemas para dormir, o dormir demasiado",
      "Sentirse cansado/a o con poca energía",
      "Poco apetito o comer en exceso",
      "Sentirse mal consigo mismo/a, o sentir que es un fracaso",
      "Dificultad para concentrarse en cosas como leer o ver TV",
      "Moverse o hablar tan lento que otros lo notaron, o lo contrario",
      "Pensamientos de que estaría mejor muerto/a o de hacerse daño",
    ],
    options: freq4Options,
    interpret: (score) => {
      if (score <= 4) return { severity: "Mínima", color: "text-success", message: "Tu puntaje sugiere síntomas mínimos." };
      if (score <= 9) return { severity: "Leve", color: "text-accent", message: "Hay algo que podríamos trabajar juntos." };
      if (score <= 14) return { severity: "Moderada", color: "text-accent-foreground", message: "Te recomendamos hablar con un profesional." };
      if (score <= 19) return { severity: "Significativa", color: "text-destructive", message: "Es importante buscar ayuda profesional." };
      return { severity: "Severa", color: "text-destructive", message: "Te recomendamos contactar a un profesional lo antes posible." };
    },
  },
  {
    id: "GAD-7",
    name: "Ansiedad",
    humanLabel: "¿Cómo estás con la ansiedad?",
    description: "Ansiedad generalizada en las últimas 2 semanas.",
    preamble: "En las últimas 2 semanas, ¿con qué frecuencia te ha molestado...",
    questions: [
      "Sentirse nervioso/a, ansioso/a o con los nervios de punta",
      "No poder dejar de preocuparse o no poder controlar la preocupación",
      "Preocuparse demasiado por diferentes cosas",
      "Dificultad para relajarse",
      "Estar tan inquieto/a que es difícil quedarse quieto/a",
      "Enojarse o irritarse fácilmente",
      "Sentir miedo como si algo terrible pudiera pasar",
    ],
    options: freq4Options,
    interpret: (score) => {
      if (score <= 4) return { severity: "Mínima", color: "text-success", message: "Tu ansiedad está en niveles bajos." };
      if (score <= 9) return { severity: "Leve", color: "text-accent", message: "Respiración y mindfulness pueden ayudarte." };
      if (score <= 14) return { severity: "Moderada", color: "text-accent-foreground", message: "Te recomendamos hablar con un profesional." };
      return { severity: "Severa", color: "text-destructive", message: "Es importante buscar ayuda profesional." };
    },
  },
  {
    id: "PSS-10",
    name: "Estrés",
    humanLabel: "¿Cómo manejás el estrés?",
    description: "Nivel de estrés percibido en el último mes.",
    preamble: "En el último mes, ¿con qué frecuencia...",
    questions: [
      "¿Te sentiste afectado/a por algo que ocurrió inesperadamente?",
      "¿Sentiste que no podías controlar las cosas importantes de tu vida?",
      "¿Te sentiste nervioso/a o estresado/a?",
      "¿Sentiste confianza en tu capacidad de manejar tus problemas personales?",
      "¿Sentiste que las cosas iban bien?",
      "¿Sentiste que no podías afrontar todas las cosas que tenías que hacer?",
      "¿Pudiste controlar las dificultades de tu vida?",
      "¿Sentiste que tenías todo bajo control?",
      "¿Te enojaste por cosas que estaban fuera de tu control?",
      "¿Sentiste que las dificultades se acumulaban tanto que no podías superarlas?",
    ],
    options: freq5Options,
    interpret: (score) => {
      if (score <= 13) return { severity: "Bajo", color: "text-success", message: "Tu nivel de estrés percibido es bajo." };
      if (score <= 26) return { severity: "Moderado", color: "text-accent", message: "Las herramientas de la app pueden ayudarte." };
      return { severity: "Alto", color: "text-destructive", message: "Te recomendamos hablar con un profesional." };
    },
  },
  {
    id: "ISI",
    name: "Insomnio",
    humanLabel: "¿Cómo estás descansando?",
    description: "Severidad del insomnio en las últimas 2 semanas.",
    preamble: "En las últimas 2 semanas...",
    questions: [
      "¿Qué tan difícil te resultó quedarte dormido/a?",
      "¿Qué tan difícil te resultó mantener el sueño durante la noche?",
      "¿Te despertaste demasiado temprano?",
      "¿Qué tan satisfecho/a estás con tu patrón de sueño actual?",
      "¿Cuánto notás que tu problema de sueño interfiere con tu funcionamiento diario?",
      "¿Qué tanto se nota para otros que tu calidad de sueño afecta tu calidad de vida?",
      "¿Qué tan preocupado/a estás por tu problema de sueño actual?",
    ],
    options: [
      { label: "Nada", value: 0 },
      { label: "Leve", value: 1 },
      { label: "Moderado", value: 2 },
      { label: "Severo", value: 3 },
      { label: "Muy severo", value: 4 },
    ],
    interpret: (score) => {
      if (score <= 7) return { severity: "Buen descanso", color: "text-success", message: "Tu sueño parece estar dentro de rangos normales." };
      if (score <= 14) return { severity: "Podría mejorar", color: "text-accent", message: "Podrías beneficiarte de mejorar tu higiene del sueño." };
      if (score <= 21) return { severity: "Moderado", color: "text-accent-foreground", message: "Te recomendamos consultar con un profesional sobre tu sueño." };
      return { severity: "Necesita atención", color: "text-destructive", message: "Es importante buscar ayuda profesional para tu problema de sueño." };
    },
  },
  {
    id: "Rosenberg",
    name: "Autoestima",
    humanLabel: "¿Cómo te sentís con vos?",
    description: "Escala de autoestima global.",
    preamble: "¿Qué tan de acuerdo estás con las siguientes afirmaciones?",
    questions: [
      "Siento que soy una persona digna de aprecio, al menos en igual medida que los demás",
      "Siento que tengo cualidades positivas",
      "En general, me inclino a pensar que soy un fracaso",
      "Soy capaz de hacer las cosas tan bien como la mayoría de la gente",
      "Siento que no tengo mucho de lo que estar orgulloso/a",
      "Tengo una actitud positiva hacia mí mismo/a",
      "En general, estoy satisfecho/a conmigo mismo/a",
      "Desearía poder tener más respeto por mí mismo/a",
      "A veces me siento verdaderamente inútil",
      "A veces pienso que no sirvo para nada",
    ],
    options: agree4Options,
    interpret: (score) => {
      if (score >= 25) return { severity: "Saludable", color: "text-success", message: "Tu autoestima parece saludable." };
      if (score >= 15) return { severity: "Normal", color: "text-accent", message: "Siempre podés trabajar en fortalecerla." };
      return { severity: "Necesita atención", color: "text-destructive", message: "Tu autoestima podría beneficiarse de trabajo terapéutico." };
    },
  },
];

export default function Tests() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  // If a testId is passed via query param, start that test directly
  const initialTestId = searchParams.get("test");
  const initialTest = initialTestId ? tests.find((t) => t.id === initialTestId) ?? null : null;

  const [activeTest, setActiveTest] = useState<TestDef | null>(initialTest);
  const [questionIdx, setQuestionIdx] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [result, setResult] = useState<{ score: number; severity: string; color: string; message: string } | null>(null);
  const [crisisOpen, setCrisisOpen] = useState(false);

  const startTest = (test: TestDef) => {
    setActiveTest(test);
    setQuestionIdx(0);
    setAnswers([]);
    setResult(null);
  };

  const answer = async (value: number) => {
    const newAnswers = [...answers, value];
    setAnswers(newAnswers);

    // PHQ-9 Q9 (ideación) → activar protocolo en cuanto se responde, sin esperar al final.
    if (activeTest?.id === "PHQ-9" && questionIdx === 8 && value >= 1) {
      setCrisisOpen(true);
    }

    if (activeTest && questionIdx < activeTest.questions.length - 1) {
      setQuestionIdx(questionIdx + 1);
    } else if (activeTest) {
      const score = computeScore(activeTest.id, newAnswers);
      const interp = activeTest.interpret(score);
      setResult({ score, ...interp });

      if (user) {
        await supabase.from("test_results").insert({
          user_id: user.id,
          test_type: activeTest.id,
          score,
          answers: newAnswers,
          severity: interp.severity,
        });
      }
    }
  };

  const backToList = () => {
    setActiveTest(null);
    setResult(null);
  };

  // Test list
  if (!activeTest) {
    return (
      <div className="px-5 pt-14 pb-4 safe-area-top">
        <button onClick={() => navigate("/mi-proceso")} className="mb-4 flex items-center gap-1.5 text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Mi Proceso
        </button>
        <h1 className="mb-2 font-display text-xl font-semibold">Indicadores de bienestar</h1>
        <p className="mb-6 text-sm text-muted-foreground">Elegí el indicador que querés evaluar.</p>

        <div className="space-y-3">
          {tests.map((test) => (
            <button
              key={test.id}
              onClick={() => startTest(test)}
              className="flex w-full items-center gap-4 rounded-2xl bg-card p-4 text-left shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] active:bg-muted transition-colors"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[hsl(var(--accent))]/10">
                <ChartLineUp size={22} weight="duotone" className="text-foreground" />
              </div>
              <div className="flex-1">
                <p className="font-display text-sm font-medium">{test.humanLabel}</p>
                <p className="text-xs text-muted-foreground">{test.description}</p>
              </div>
              <ArrowRight size={14} className="text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="mt-6 h-px bg-border" />
        <p className="mt-4 text-center text-[10px] text-muted-foreground">
          Estos indicadores son orientativos y no constituyen un diagnóstico clínico.
        </p>
      </div>
    );
  }

  // Result
  if (result) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-5 safe-area-top">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-sm text-center">
          <p className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">{activeTest.humanLabel}</p>
          <div className="mb-4 font-display text-5xl font-light">{result.score}</div>
          <div className={cn("mb-2 inline-block rounded-full border px-4 py-1 font-display text-sm font-medium", result.color)}>
            {result.severity}
          </div>
          <p className="mb-8 text-sm text-muted-foreground">{result.message}</p>

          <div className="space-y-3">
            <button onClick={backToList} className="w-full rounded-2xl bg-primary py-3 font-display text-sm font-medium text-primary-foreground">
              Volver a indicadores
            </button>
            {(result.score > 9) && (
              <button onClick={() => navigate("/tratamiento")} className="w-full rounded-2xl border border-accent/30 bg-accent/5 py-3 font-display text-sm font-medium">
                Solicitar tratamiento
              </button>
            )}
          </div>

          <p className="mt-6 text-[10px] text-muted-foreground">
            Este resultado no reemplaza una evaluación profesional.
          </p>
        </motion.div>
      </div>
    );
  }

  // Question
  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={backToList} className="flex items-center gap-1.5 font-display text-sm text-muted-foreground">
          <ArrowLeft size={16} /> Cancelar
        </button>
      </div>

      <div className="mb-2 flex gap-1">
        {activeTest.questions.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= questionIdx ? "bg-accent" : "bg-border")} />
        ))}
      </div>
      <p className="mb-6 text-right font-display text-[10px] text-muted-foreground">
        {questionIdx + 1}/{activeTest.questions.length}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={questionIdx}
          initial={{ x: 40, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -40, opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1"
        >
          <p className="mb-2 font-display text-xs uppercase tracking-wider text-muted-foreground">
            {activeTest.preamble}
          </p>
          <h2 className="mb-8 font-display text-lg font-medium leading-snug">
            {activeTest.questions[questionIdx]}
          </h2>

          <div className="space-y-2.5">
            {activeTest.options.map((opt) => (
              <button
                key={opt.value}
                onClick={() => answer(opt.value)}
                className="w-full rounded-2xl bg-card p-4 text-left font-display text-sm shadow-[0_2px_12px_hsl(var(--foreground)/0.04)] transition-all active:bg-muted active:ring-1 active:ring-accent"
              >
                {opt.label}
              </button>
            ))}
          </div>
        </motion.div>
      </AnimatePresence>
      <CrisisModal open={crisisOpen} onAcknowledge={() => setCrisisOpen(false)} />
    </div>
  );
}
