import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useHapticPulse } from "@/hooks/useHaptics";
import { toast } from "sonner";

import { useChangeResponseFlow, draftHasProgress } from "@/hooks/useChangeResponseFlow";
import { ResumeSessionBanner } from "@/components/dbt/ResumeSessionBanner";
import {
  EMOTIONS, FICHA_8A, OPPOSITE_ACTIONS, BODY_PLAN_FALLBACK,
  EMOTION_TINT, type DbtEmotion,
} from "@/lib/dbt/data";
import {
  WorkspaceHeader, FichaCallout, WizardFooter, ProgressIndicator,
  AiAssistButton, WiseMindCard, DbtTextarea, ConfirmModal, Ic,
} from "@/components/dbt/shared";
import { AiResponseModal } from "@/components/dbt/AiResponseModal";
import { Ficha8AModal } from "@/components/dbt/Ficha8AModal";
import { SaveIndicator } from "@/components/dbt/SaveIndicator";
import { SessionTimeline } from "@/components/dbt/SessionTimeline";
import { DecisionTreeSVG } from "@/components/dbt/DecisionTreeSVG";
import { BeforeAfterCompare } from "@/components/dbt/BeforeAfterCompare";
import type { Stage } from "@/hooks/useChangeResponseFlow";
import { EmotionWheelSVG } from "@/components/dbt/EmotionWheelSVG";
import { JudgmentHighlightPanel } from "@/components/dbt/JudgmentHighlightPanel";
import { SocraticDrawer } from "@/components/dbt/SocraticDrawer";





type AiTask = "separate-facts" | "evaluate-fit" | "evaluate-effectiveness" | "suggest-solutions" | "body-plan";

export default function CambiarRespuestas() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { state, dispatch, clearDraft } = useChangeResponseFlow();
  const haptic = useHapticPulse();
  const [showFicha8A, setShowFicha8A] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveTick, setSaveTick] = useState(0);
  const [visited, setVisited] = useState<Set<Stage>>(() => new Set([state.stage]));
  const [socraticOpen, setSocraticOpen] = useState(false);
  const [resumeBanner, setResumeBanner] = useState<{ open: boolean; hoursAgo: number }>({ open: false, hoursAgo: 0 });
  const resumePromptedRef = useRef(false);
  const [aiModal, setAiModal] = useState<{ open: boolean; title: string; loading: boolean; content?: string; error?: string; onApply?: (t: string) => void }>({ open: false, title: "", loading: false });

  // Resume detection: once hydrated, if draft is >2h old and has progress, prompt.
  useEffect(() => {
    if (resumePromptedRef.current) return;
    if (!state.updatedAt) return;
    resumePromptedRef.current = true;
    const hoursAgo = (Date.now() - state.updatedAt) / 3_600_000;
    if (hoursAgo >= 2 && draftHasProgress(state)) {
      setResumeBanner({ open: true, hoursAgo });
    }
  }, [state]);


  // Contexto enviado a la guía socrática según etapa/paso.
  const socraticContext = useMemo(() => {
    const e = state.selectedEmotion || "—";
    if (state.stage === "wizard8") {
      const stepMap: Record<number, string> = {
        1: `El usuario está eligiendo qué emoción quiere trabajar (Ficha 8 · paso 1). Emoción tentativa: ${e}.`,
        2: `Ficha 8 · paso 2: el usuario describe el evento como una cámara (hechos sin juicios). Emoción: ${e}.`,
        3: `Ficha 8 · paso 3: el usuario registra sus interpretaciones y suposiciones sobre el evento. Emoción: ${e}.`,
        4: `Ficha 8 · paso 4: el usuario evalúa amenazas físicas o sociales percibidas. Emoción: ${e}.`,
        5: `Ficha 8 · paso 5: el usuario imagina la peor catástrofe y cómo afrontarla con Mente Sabia. Emoción: ${e}.`,
        6: `Ficha 8 · paso 6: el usuario decide si su emoción se ajusta a los hechos. Emoción: ${e}.`,
      };
      return stepMap[state.step] || `Ficha 8. Emoción: ${e}.`;
    }
    if (state.stage === "decision9") return `Ficha 9 · Mente Sabia: el usuario evalúa si actuar bajo su impulso es efectivo. Emoción: ${e}. Se ajusta a los hechos: ${state.fitsFacts ? "sí" : "no"}.`;
    if (state.stage === "problem12") return `Ficha 12 · Resolución de Problemas: el usuario está en el paso ${state.step}. Objetivo declarado: "${state.problem.goal}".`;
    if (state.stage === "opposite10") return `Fichas 10 y 13 · Acción Opuesta para ${e}, paso ${state.step}.`;
    return "Sesión DBT finalizada.";
  }, [state]);

  const socraticDraft = useMemo(() => {
    if (state.stage === "wizard8") {
      return [state.eventDescription, state.interpretations, state.threat, state.catastropheCoping][state.step - 2] || "";
    }
    if (state.stage === "problem12") return [state.problem.goal, state.problem.brainstorm, state.problem.chosenSolution].join(" · ");
    if (state.stage === "opposite10") return [state.opposite.impulses, state.opposite.bodyPlan].join(" · ");
    return "";
  }, [state]);


  // Track visited stages for the timeline back-navigation.
  useEffect(() => {
    setVisited((prev) => {
      if (prev.has(state.stage)) return prev;
      const next = new Set(prev);
      next.add(state.stage);
      return next;
    });
  }, [state.stage]);

  const chosenPath: "problem" | "opposite" | null =
    state.stage === "problem12"
      ? "problem"
      : state.stage === "opposite10"
        ? "opposite"
        : state.fitsFacts !== null && state.isEffective !== null
          ? (state.fitsFacts && state.isEffective ? "problem" : "opposite")
          : null;

  const handleTimelineJump = (s: Stage) => {
    haptic("tick");
    dispatch({ type: "GOTO", stage: s, step: 1 });
  };

  // Auto-save indicator: pulse whenever the persisted state changes (debounced via key).
  const stateKey = `${state.stage}:${state.step}`;
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    setSaveTick(Date.now());
  }, [stateKey]);

  // Celebrate when reaching the final stage: gold pulse + confetti + haptic.
  useEffect(() => {
    if (state.stage !== "done") return;
    haptic("celebrate");
    let cancelled = false;
    import("canvas-confetti").then((m) => {
      if (cancelled) return;
      const confetti = m.default;
      confetti({
        particleCount: 80,
        spread: 70,
        startVelocity: 35,
        ticks: 200,
        origin: { y: 0.35 },
        colors: ["#facb60", "#7cc2c8", "#101927"],
      });
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [state.stage, haptic]);


  const subtitleByStage = useMemo(() => {
    switch (state.stage) {
      case "wizard8": return "Verificar los hechos";
      case "decision9": return "Mente Sabia";
      case "problem12": return "Resolver el problema";
      case "opposite10": return "Acción Opuesta";
      case "done": return "Sesión guardada";
    }
  }, [state.stage]);

  const callAi = useCallback(async (task: AiTask, payload: Record<string, string>, opts: { title: string; onApply?: (t: string) => void }) => {
    setAiModal({ open: true, title: opts.title, loading: true, onApply: opts.onApply });
    try {
      const { data, error } = await supabase.functions.invoke("dbt-ai", { body: { task, payload } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAiModal((m) => ({ ...m, loading: false, content: data?.result || "Sin respuesta." }));
    } catch (e: any) {
      setAiModal((m) => ({ ...m, loading: false, error: e?.message || "Error consultando la IA." }));
    }
  }, []);

  const reset = () => { clearDraft(); dispatch({ type: "RESET" }); setConfirmReset(false); };

  const handleBack = () => {
    if (state.step > 1) dispatch({ type: "PREV" });
    else if (state.stage === "wizard8") navigate("/herramientas/regulacion-emocional");
    else if (state.stage === "decision9") dispatch({ type: "GOTO", stage: "wizard8", step: 6 });
    else if (state.stage === "problem12" || state.stage === "opposite10") dispatch({ type: "GOTO", stage: "decision9", step: 1 });
    else navigate("/herramientas/regulacion-emocional");
  };

  const saveSession = useCallback(async () => {
    if (!user || !state.selectedEmotion) return;
    try {
      const { error } = await supabase.from("dbt_emotion_sessions").insert({
        user_id: user.id,
        emotion: state.selectedEmotion,
        event_description: state.eventDescription,
        interpretations: state.interpretations,
        threat: state.threat,
        catastrophe_coping: state.catastropheCoping,
        fits_facts: state.fitsFacts,
        is_effective: state.isEffective,
        path: state.stage === "problem12" ? "problem" : "opposite",
        problem_payload: state.stage === "problem12" ? state.problem : null,
        opposite_payload: state.stage === "opposite10" ? state.opposite : null,
      });
      if (error) throw error;
      clearDraft();
      dispatch({ type: "GOTO", stage: "done", step: 1 });
      toast.success("Sesión guardada");
    } catch (e: any) {
      toast.error(e?.message || "No se pudo guardar la sesión");
    }
  }, [user, state, clearDraft, dispatch]);

  // ============ STAGE: wizard8 (6 pasos) ============
  const renderWizard8 = () => {
    const step = state.step;
    return (
      <motion.section key={`w8-${step}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.25 }} className="px-4 pb-32 pt-4 space-y-5">
        <ProgressIndicator step={step} total={6} />

        {step === 1 && (<>
          <FichaCallout label="Paso 1 · Empezamos">Empezamos identificando con claridad qué emoción querés trabajar hoy.</FichaCallout>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">1. ¿Cuál es la emoción que querés cambiar?</h2>
          <EmotionWheelSVG
            selected={state.selectedEmotion}
            onSelect={(em, nuance) => {
              haptic("tick");
              dispatch({ type: "PATCH", patch: { selectedEmotion: em, emotionNuance: nuance ?? null } });
            }}
          />
          {state.selectedEmotion && (
            <div className="text-center font-body text-[13px] text-[#101927]/70">
              Trabajando con <strong className="text-[#101927]">{state.selectedEmotion}</strong>
              {state.emotionNuance && <> · <em>{state.emotionNuance}</em></>}
            </div>
          )}
        </>)}


        {step === 2 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">2. ¿Cuál es el evento que provoca tu emoción?</h2>
          <p className="font-body text-[14px] leading-6 text-[#101927]/70">Describí los hechos como los registraría una cámara: qué, quién, cuándo, dónde. Sin juicios.</p>
          <DbtTextarea value={state.eventDescription} onChange={(v) => dispatch({ type: "PATCH", patch: { eventDescription: v } })}
            placeholder="¿Qué pasó concretamente? Sé factual (en blanco y negro)." />
          <JudgmentHighlightPanel
            text={state.eventDescription}
            enabled={state.eventDescription.trim().length > 24}
            onApplyReformulation={(t) => {
              haptic("confirm");
              dispatch({ type: "PATCH", patch: { eventDescription: t } });
            }}
          />
          <AiAssistButton label="¿Querés que te ayude a separar hechos de juicios?" onClick={() => callAi("separate-facts", { text: state.eventDescription }, {
            title: "Hechos vs. juicios",
            onApply: (t) => dispatch({ type: "PATCH", patch: { eventDescription: t } }),
          })} />
        </>)}


        {step === 3 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">3. ¿Qué interpretaciones, suposiciones y conclusiones tenés?</h2>
          {state.eventDescription.trim() && (
            <div className="rounded-[20px] bg-[#f7f7f8] border border-[#101927]/5 p-4">
              <p className="font-display text-[10px] uppercase tracking-wide text-[#101927]/45 mb-1">Tu evento</p>
              <p className="font-body text-[14px] leading-6 text-[#101927]/80">{state.eventDescription}</p>
            </div>
          )}
          <p className="font-body text-[14px] leading-6 text-[#101927]/70">Registrá tus pensamientos subjetivos sobre el evento.</p>
          <DbtTextarea value={state.interpretations} onChange={(v) => dispatch({ type: "PATCH", patch: { interpretations: v } })}
            placeholder="¿Qué pensás que pasa? ¿Qué leés entre líneas? ¿Qué asumís?" />
        </>)}

        {step === 4 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">4. ¿Asumís una amenaza física o social?</h2>
          <p className="font-body text-[14px] leading-6 text-[#101927]/70">¿Qué creés que va a pasar si no hacés nada? ¿Qué temés perder?</p>
          <DbtTextarea value={state.threat} onChange={(v) => dispatch({ type: "PATCH", patch: { threat: v } })}
            placeholder="Describí la amenaza percibida y calculá qué tan probable es realmente…" />
        </>)}

        {step === 5 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">5. ¿Cuál es la peor catástrofe que podría pasar?</h2>
          <p className="font-body text-[14px] leading-6 text-[#101927]/70">Planificá cómo afrontarla: aceptación radical o resolución del problema.</p>
          <DbtTextarea value={state.catastropheCoping} onChange={(v) => dispatch({ type: "PATCH", patch: { catastropheCoping: v } })}
            placeholder="Imaginá lo peor. ¿Cómo lo afrontarías con Mente Sabia?" />
        </>)}

        {step === 6 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">6. ¿Tu emoción y su intensidad se ajustan a los hechos?</h2>
          <p className="font-body text-[14px] leading-6 text-[#101927]/70">Consultá los hechos objetivos. Preguntale a tu Mente Sabia si la intensidad se justifica.</p>
          <button onClick={() => setShowFicha8A(true)} className="w-full rounded-[20px] border border-[#7cc2c8]/30 bg-[#7cc2c8]/5 px-4 py-3 flex items-center justify-center gap-2 font-display text-[13px] font-semibold text-[#7cc2c8] active:scale-[0.98]">
            <Ic.Info /> Ver ejemplo de {state.selectedEmotion ?? "tu emoción"}
          </button>
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            {[{ v: true, l: "Sí se ajusta" }, { v: false, l: "No se ajusta" }].map((opt) => {
              const active = state.fitsFacts === opt.v;
              return (
                <button key={String(opt.v)} onClick={() => dispatch({ type: "PATCH", patch: { fitsFacts: opt.v } })}
                  className={`min-h-[64px] rounded-[24px] border px-4 py-3 flex flex-col items-center justify-center gap-1 font-display text-sm font-semibold transition ${active ? "bg-[#7cc2c8]/10 border-[#7cc2c8]" : "bg-white border-[#d8d9db]"}`}>
                  {opt.v ? <Ic.Check /> : <Ic.X />}
                  <span className="text-[#101927]">{opt.l}</span>
                </button>
              );
            })}
          </div>
          <AiAssistButton label="No sé si se ajusta, ayudame con IA" onClick={() => callAi("evaluate-fit", {
            emotion: state.selectedEmotion || "",
            event: state.eventDescription,
            interpretations: state.interpretations,
            threat: state.threat,
            catastrophe: state.catastropheCoping,
          }, { title: "Evaluación clínica" })} />
        </>)}
      </motion.section>
    );
  };

  const canAdvanceW8 = () => {
    switch (state.step) {
      case 1: return !!state.selectedEmotion;
      case 2: return state.eventDescription.trim().length > 3;
      case 3: return state.interpretations.trim().length > 0;
      case 4: return state.threat.trim().length > 0;
      case 5: return state.catastropheCoping.trim().length > 0;
      case 6: return state.fitsFacts !== null;
      default: return true;
    }
  };

  const advanceW8 = () => {
    haptic("confirm");
    if (state.step < 6) dispatch({ type: "NEXT" });
    else dispatch({ type: "GOTO", stage: "decision9", step: 1 });
  };


  // ============ STAGE: decision9 ============
  const renderDecision9 = () => {
    const next = () => {
      if (state.isEffective === null) return;
      haptic("confirm");
      const path: "problem" | "opposite" = (state.fitsFacts && state.isEffective) ? "problem" : "opposite";
      dispatch({ type: "GOTO", stage: path === "problem" ? "problem12" : "opposite10", step: 1 });
    };

    return (
      <motion.section key="d9" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="px-4 pb-32 pt-4 space-y-5">
        <FichaCallout label="Mente Sabia">Ya verificaste los hechos. Ahora decidimos el camino: ¿actuar bajo este impulso te acerca a lo que querés?</FichaCallout>

        <div className="rounded-[24px] bg-[#f7f7f8] p-4 space-y-2">
          <div className="flex items-center justify-between text-[12px]">
            <span className="font-display font-semibold text-[#101927]/60">¿Se ajusta a los hechos?</span>
            <span className={`rounded-full px-2.5 py-1 font-display text-[11px] font-bold ${state.fitsFacts ? "bg-[#7cc2c8]/20 text-[#7cc2c8]" : "bg-red-100 text-red-700"}`}>{state.fitsFacts ? "Sí" : "No"}</span>
          </div>
          <p className="font-body text-[13px] text-[#101927]/75"><strong>{state.selectedEmotion}:</strong> {state.eventDescription.slice(0, 110)}{state.eventDescription.length > 110 ? "…" : ""}</p>
        </div>

        <DecisionTreeSVG fitsFacts={state.fitsFacts} isEffective={state.isEffective} />


        <h2 className="font-display text-[18px] font-bold text-[#101927]">¿Actuar según esta emoción es efectivo?</h2>

        <WiseMindCard title="Criterios de efectividad (DBT)" tone="gold">
          Una acción es <strong>efectiva</strong> cuando te acerca a tus objetivos a largo plazo, no destruye vínculos importantes, no te perjudica y no empeora la situación. Si actuar bajo el impulso hace cualquiera de estas cosas, <strong>no es efectivo</strong>.
        </WiseMindCard>

        <div className="grid grid-cols-2 gap-2.5">
          {[{ v: true, l: "Sí es efectivo" }, { v: false, l: "No es efectivo" }].map((opt) => {
            const active = state.isEffective === opt.v;
            return (
              <button key={String(opt.v)} onClick={() => dispatch({ type: "PATCH", patch: { isEffective: opt.v } })}
                className={`min-h-[64px] rounded-[24px] border px-4 py-3 flex flex-col items-center justify-center gap-1 font-display text-sm font-semibold transition ${active ? "bg-[#7cc2c8]/10 border-[#7cc2c8]" : "bg-white border-[#d8d9db]"}`}>
                {opt.v ? <Ic.Check /> : <Ic.X />}
                <span className="text-[#101927]">{opt.l}</span>
              </button>
            );
          })}
        </div>

        <AiAssistButton label="¿Querés que la IA evalúe la efectividad?" onClick={() => callAi("evaluate-effectiveness", {
          emotion: state.selectedEmotion || "",
          event: state.eventDescription,
          threat: state.threat,
        }, { title: "Evaluación de efectividad" })} />

        <button onClick={next} disabled={state.isEffective === null}
          className="w-full mt-4 rounded-[24px] bg-[#101927] py-4 font-display text-sm font-semibold text-white active:scale-[0.97] disabled:opacity-40">
          {state.fitsFacts && state.isEffective ? "Iniciar · Resolver el problema" : "Iniciar · Acción Opuesta"}
        </button>
      </motion.section>
    );
  };

  // ============ STAGE: problem12 (7 pasos) ============
  const renderProblem12 = () => {
    const step = state.step;
    const advance = () => { haptic("confirm"); if (step < 7) dispatch({ type: "NEXT" }); else saveSession(); };

    const canAdv = () => {
      switch (step) {
        case 3: return state.problem.goal.trim().length > 0;
        case 4: return state.problem.brainstorm.trim().length > 0;
        case 5: return state.problem.chosenSolution.trim().length > 0 && state.problem.prosCons.trim().length > 0;
        case 7: return state.problem.outcome !== null;
        default: return true;
      }
    };
    const goToStep5 = () => dispatch({ type: "GOTO", stage: "problem12", step: 5 });

    return (
      <motion.section key={`p12-${step}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="px-4 pb-32 pt-4 space-y-5">
        <ProgressIndicator step={step} total={7} />

        {step === 1 && (<>
          <FichaCallout label="Descubrir">Vas a resolver esta situación con un plan estructurado. Tu emoción se ajusta a los hechos y actuar es efectivo.</FichaCallout>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">Situación que vas a resolver</h2>
          <div className="rounded-[24px] bg-[#f2f2f2] p-5 font-body text-[15px] leading-7 text-[#101927]">{state.eventDescription}</div>
        </>)}

        {step === 2 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">Verificar los hechos</h2>
          <p className="font-body text-[14px] text-[#101927]/70">Estos son los hechos objetivos que registraste.</p>
          <div className="rounded-[24px] bg-[#f2f2f2] p-5 font-body text-[14px] leading-7 text-[#101927]">{state.eventDescription}</div>
          <div className="rounded-[24px] bg-[#f2f2f2] p-5 font-body text-[13px] leading-6 text-[#101927]/70">
            <p className="font-display text-[11px] uppercase tracking-wide text-[#101927]/50 mb-1">Tus interpretaciones</p>
            {state.interpretations}
          </div>
        </>)}

        {step === 3 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">3. ¿Cuál es tu objetivo?</h2>
          <p className="font-body text-[14px] text-[#101927]/70">Simple, realista, a corto plazo.</p>
          <DbtTextarea value={state.problem.goal} onChange={(v) => dispatch({ type: "PATCH_PROBLEM", patch: { goal: v } })} placeholder="¿Qué querés lograr concretamente?" minHeight={120} />
        </>)}

        {step === 4 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">4. ¿Qué soluciones se te ocurren?</h2>
          <p className="font-body text-[14px] text-[#101927]/70">Lluvia de ideas libre. Después elegís.</p>
          <DbtTextarea value={state.problem.brainstorm} onChange={(v) => dispatch({ type: "PATCH_PROBLEM", patch: { brainstorm: v } })} placeholder="Anotá todas las opciones que se te ocurran…" />
          <AiAssistButton label="Sugerir soluciones con IA clínica" onClick={() => callAi("suggest-solutions", {
            emotion: state.selectedEmotion || "",
            event: state.eventDescription,
            goal: state.problem.goal,
          }, { title: "Soluciones sugeridas", onApply: (t) => dispatch({ type: "PATCH_PROBLEM", patch: { brainstorm: (state.problem.brainstorm ? state.problem.brainstorm + "\n\n" : "") + t } }) })} />
        </>)}

        {step === 5 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">5. Elección y pros/contras</h2>
          <input value={state.problem.chosenSolution} onChange={(e) => dispatch({ type: "PATCH_PROBLEM", patch: { chosenSolution: e.target.value } })}
            placeholder="¿Cuál solución elegís?"
            className="w-full rounded-[24px] border border-[#d8d9db] bg-white px-5 py-4 font-body text-[15px] text-[#101927] placeholder:text-[#101927]/35 focus:outline-none focus:border-[#7cc2c8] focus:ring-4 focus:ring-[#7cc2c8]/15" />
          <DbtTextarea value={state.problem.prosCons} onChange={(v) => dispatch({ type: "PATCH_PROBLEM", patch: { prosCons: v } })} placeholder="¿Qué ganás? ¿Qué perdés? ¿Qué te genera esta opción?" />
        </>)}

        {step === 6 && (<>
          <WiseMindCard title="Momento de Mente Sabia">
            Ya tenés un plan. El siguiente paso no pasa acá: pasa en el mundo real. <strong>Tomá acción. Volvé cuando lo hayas hecho.</strong>
          </WiseMindCard>
        </>)}

        {step === 7 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">7. ¿Funcionó?</h2>
          <div className="grid grid-cols-2 gap-2.5">
            {[{ v: "success" as const, l: "Sí, funcionó", icon: <Ic.Check /> }, { v: "failed" as const, l: "No funcionó", icon: <Ic.X /> }].map((opt) => {
              const active = state.problem.outcome === opt.v;
              return (
                <button key={opt.v} onClick={() => dispatch({ type: "PATCH_PROBLEM", patch: { outcome: opt.v } })}
                  className={`min-h-[64px] rounded-[24px] border px-4 py-3 flex flex-col items-center justify-center gap-1 font-display text-sm font-semibold transition ${active ? "bg-[#7cc2c8]/10 border-[#7cc2c8]" : "bg-white border-[#d8d9db]"}`}>
                  {opt.icon}<span className="text-[#101927]">{opt.l}</span>
                </button>
              );
            })}
          </div>
          {state.problem.outcome === "failed" && (
            <div className="rounded-[24px] bg-[#facb60]/10 border border-[#facb60]/30 p-4 space-y-3">
              <p className="font-body text-[14px] leading-6 text-[#101927]/80">No pasa nada. La resolución de problemas es iterativa. Volvé al paso 5 y probá con otra opción.</p>
              <button onClick={goToStep5} className="w-full rounded-[24px] bg-[#101927] py-3 font-display text-sm font-semibold text-white">Volver al Paso 5</button>
            </div>
          )}
        </>)}

        <WizardFooter
          onPrev={step > 1 ? () => dispatch({ type: "PREV" }) : undefined}
          onNext={advance}
          nextLabel={step === 6 ? "Ya actué, pasar a evaluar" : step === 7 ? "Guardar sesión" : "Siguiente"}
          canNext={canAdv()}
        />
      </motion.section>
    );
  };

  // ============ STAGE: opposite10 (7 pasos) ============
  const renderOpposite10 = () => {
    const step = state.step;
    const emotion = (state.selectedEmotion || "Tristeza") as DbtEmotion;
    const oa = OPPOSITE_ACTIONS[emotion];
    const tint = EMOTION_TINT[emotion];
    const advance = () => { haptic("confirm"); if (step < 7) dispatch({ type: "NEXT" }); else saveSession(); };
    const canAdv = () => {
      if (step === 3) return state.opposite.impulses.trim().length > 0;
      if (step === 6) return state.opposite.bodyPlan.trim().length > 0;
      if (step === 7) return state.opposite.actionTaken === true;
      return true;
    };
    const applyFallback = () => {
      const plan = BODY_PLAN_FALLBACK[emotion].map((b) => `• ${b}`).join("\n");
      dispatch({ type: "PATCH_OPPOSITE", patch: { bodyPlan: plan } });
    };

    return (
      <motion.section key={`o10-${step}`} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="px-4 pb-32 pt-4 space-y-5">
        <ProgressIndicator step={step} total={7} />

        {step === 1 && (
          <div className="rounded-[32px] p-6 text-center" style={{ background: `${tint}18`, border: `1px solid ${tint}55` }}>
            <p className="font-display text-[11px] tracking-wide uppercase text-[#101927]/60 mb-1">Vas a regular</p>
            <p className="font-display text-4xl font-bold text-[#101927]">{emotion}</p>
            <p className="font-body text-[14px] leading-6 text-[#101927]/70 mt-3">Esta herramienta te ayuda a actuar de forma opuesta a tu impulso emocional.</p>
          </div>
        )}

        {step === 2 && (
          <FichaCallout label="Justificación">
            Las emociones generan impulsos. Actuar sobre el impulso refuerza la emoción. La <strong>Acción Opuesta</strong> interrumpe ese circuito. Es una intervención clínica DBT validada.
          </FichaCallout>
        )}

        {step === 3 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">3. ¿Qué impulsos sentís ganas de hacer o decir?</h2>
          <DbtTextarea value={state.opposite.impulses} onChange={(v) => dispatch({ type: "PATCH_OPPOSITE", patch: { impulses: v } })}
            placeholder="Describí exactamente qué hacés o decís cuando sentís esta emoción…" />
        </>)}

        {step === 4 && (
          <WiseMindCard title="Mente Sabia">
            Cuando sentís <strong>{emotion.toLowerCase()}</strong>, tu impulso natural es <strong>{oa.impulse}</strong>. Si actuás así, la emoción se refuerza. La <strong>Acción Opuesta</strong> te abre otra puerta.
          </WiseMindCard>
        )}

        {step === 5 && (
          <div className="rounded-[32px] bg-[#7cc2c8]/8 border border-[#7cc2c8]/30 p-6 space-y-4">
            <div>
              <p className="font-display text-[10px] tracking-[0.12em] uppercase text-[#7cc2c8] font-bold mb-1">Acción opuesta sugerida</p>
              <p className="font-display text-xl font-bold text-[#101927]">{emotion}</p>
            </div>
            <div className="space-y-3">
              <div>
                <p className="font-display text-[11px] uppercase tracking-wide text-[#101927]/50 mb-1">Impulso típico</p>
                <p className="font-body text-[14px] leading-6 text-[#101927]/80">{oa.impulse}</p>
              </div>
              <div className="border-t border-[#7cc2c8]/20 pt-3">
                <p className="font-display text-[11px] uppercase tracking-wide text-[#7cc2c8] mb-1">Hacé lo opuesto</p>
                <p className="font-body text-[15px] leading-7 text-[#101927]">{oa.action}</p>
              </div>
            </div>
          </div>
        )}

        {step === 6 && (<>
          <h2 className="font-display text-[18px] font-bold text-[#101927]">6. Tu cuerpo también necesita cambiar</h2>
          <p className="font-body text-[14px] leading-6 text-[#101927]/70">El cambio emocional pasa por el cuerpo. Planificá gestos y postura opuesta.</p>
          <DbtTextarea value={state.opposite.bodyPlan} onChange={(v) => dispatch({ type: "PATCH_OPPOSITE", patch: { bodyPlan: v } })}
            placeholder="Postura, expresión facial, tono de voz, respiración…" />
          <AiAssistButton label="Planificar gestos y postura con IA" onClick={() => callAi("body-plan", {
            emotion,
            impulses: state.opposite.impulses,
          }, { title: "Plan corporal", onApply: (t) => dispatch({ type: "PATCH_OPPOSITE", patch: { bodyPlan: t } }) })} />
          <button onClick={applyFallback} className="w-full rounded-[20px] border border-[#7cc2c8]/30 bg-white px-4 py-2.5 font-display text-[12px] font-semibold text-[#7cc2c8] active:scale-[0.98]">
            Usar plan corporal de referencia
          </button>
        </>)}

        {step === 7 && (<>
          <div className="rounded-[24px] bg-[#facb60]/10 border border-[#facb60]/40 p-5 space-y-3">
            <p className="font-display text-[10px] uppercase tracking-[0.12em] text-[#facb60] font-bold">Tu tarea</p>
            <p className="font-display text-base font-bold text-[#101927]">Practicá la Acción Opuesta para {emotion.toLowerCase()}</p>
            <div className="rounded-[18px] bg-white/70 p-3">
              <p className="font-display text-[10px] uppercase tracking-wide text-[#101927]/45 mb-1">Hacé lo opuesto</p>
              <p className="font-body text-[14px] leading-6 text-[#101927]/85">{oa.action}</p>
            </div>
            {state.opposite.bodyPlan.trim() && (
              <div className="rounded-[18px] bg-white/70 p-3">
                <p className="font-display text-[10px] uppercase tracking-wide text-[#101927]/45 mb-1">Tu plan corporal</p>
                <p className="font-body text-[13px] leading-6 text-[#101927]/80 whitespace-pre-line">{state.opposite.bodyPlan}</p>
              </div>
            )}
            <button
              onClick={() => { haptic("confirm"); dispatch({ type: "PATCH_OPPOSITE", patch: { actionTaken: !state.opposite.actionTaken } }); }}
              className={`w-full rounded-[20px] py-3 font-display text-sm font-semibold flex items-center justify-center gap-2 transition ${state.opposite.actionTaken ? "bg-[#7cc2c8] text-white" : "bg-[#101927] text-white"} active:scale-[0.97]`}
            >
              {state.opposite.actionTaken ? <><Ic.Check color="#fff" size={16} /> ¡Listo, ya lo hice!</> : "Listo, ya lo hice"}
            </button>
          </div>
          <WiseMindCard title="La plasticidad neuronal está de tu lado" tone="gold">
            Tu amígdala aprendió a reaccionar así con repeticiones pasadas. Para reprogramarla, repetí la Acción Opuesta una y otra vez. No es magia: es neurociencia. <strong>Sostené la acción opuesta hasta que la emoción baje.</strong>
          </WiseMindCard>
        </>)}

        <WizardFooter
          onPrev={step > 1 ? () => dispatch({ type: "PREV" }) : undefined}
          onNext={advance}
          nextLabel={step === 7 ? "Guardar sesión" : "Siguiente"}
          canNext={canAdv()}
        />
      </motion.section>
    );
  };

  // ============ STAGE: done ============
  const renderDone = () => (
    <motion.section key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="px-4 pb-32 pt-12 space-y-6 text-center relative">
      <motion.div
        aria-hidden
        initial={{ scale: 0.4, opacity: 0.55 }}
        animate={{ scale: 2.4, opacity: 0 }}
        transition={{ duration: 1.4, ease: "easeOut" }}
        className="pointer-events-none absolute left-1/2 top-16 -translate-x-1/2 h-32 w-32 rounded-full"
        style={{ background: "radial-gradient(closest-side, rgba(250,203,96,0.55), rgba(250,203,96,0))" }}
      />
      <div className="relative mx-auto h-20 w-20 rounded-full bg-[#7cc2c8]/15 flex items-center justify-center">
        <Ic.Check size={36} color="#7cc2c8" />
      </div>
      <div>
        <h2 className="font-display text-2xl font-bold text-[#101927]">¡Sesión guardada!</h2>
        <p className="font-body text-[15px] leading-7 text-[#101927]/70 mt-2 px-4">Tu recorrido de Regulación Emocional quedó registrado. Podés volver a revisarlo cuando quieras.</p>
      </div>

      <div className="text-left">
        <BeforeAfterCompare
          emotion={state.selectedEmotion || "Tu emoción"}
          before={[state.eventDescription, state.opposite.impulses].filter(Boolean).join(" · ")}
          afterLabel={state.problem.chosenSolution ? "Plan · Resolver" : "Acción Opuesta"}
          after={state.problem.chosenSolution || state.opposite.bodyPlan}
        />
      </div>

      <div className="space-y-2 px-2">
        <button onClick={() => navigate("/")} className="w-full rounded-[24px] bg-[#101927] py-4 font-display text-sm font-semibold text-white active:scale-[0.97]">Volver al inicio</button>
        <button onClick={reset} className="w-full rounded-[24px] bg-[#f2f2f2] py-4 font-display text-sm font-semibold text-[#101927] active:scale-[0.97]">Hacer otra sesión</button>
      </div>

    </motion.section>
  );


  return (
    <main className="min-h-screen bg-white text-[#101927]" style={{ backgroundImage: "linear-gradient(180deg, rgba(124,194,200,0.04) 0%, rgba(255,255,255,1) 30%)" }}>
      <WorkspaceHeader subtitle={subtitleByStage} onReset={() => setConfirmReset(true)} onBack={handleBack} />
      <SessionTimeline stage={state.stage} path={chosenPath} visited={visited} onJump={handleTimelineJump} />

      <div className="mx-auto max-w-md">
        <ResumeSessionBanner
          open={resumeBanner.open}
          hoursAgo={resumeBanner.hoursAgo}
          emotion={state.selectedEmotion}
          stageLabel={subtitleByStage}
          onResume={() => setResumeBanner((b) => ({ ...b, open: false }))}
          onDiscard={() => { setResumeBanner((b) => ({ ...b, open: false })); reset(); }}
        />



        <AnimatePresence mode="wait">
          {state.stage === "wizard8" && renderWizard8()}
          {state.stage === "decision9" && renderDecision9()}
          {state.stage === "problem12" && renderProblem12()}
          {state.stage === "opposite10" && renderOpposite10()}
          {state.stage === "done" && renderDone()}
        </AnimatePresence>
      </div>

      {state.stage === "wizard8" && (
        <WizardFooter
          onPrev={state.step > 1 ? () => dispatch({ type: "PREV" }) : undefined}
          onNext={advanceW8}
          nextLabel={state.step === 6 ? "Continuar a Mente Sabia" : "Siguiente"}
          canNext={canAdvanceW8()}
        />
      )}

      <Ficha8AModal open={showFicha8A} onClose={() => setShowFicha8A(false)} emotion={state.selectedEmotion} />
      <AiResponseModal
        open={aiModal.open}
        title={aiModal.title}
        loading={aiModal.loading}
        content={aiModal.content}
        error={aiModal.error}
        onApply={aiModal.onApply}
        onClose={() => setAiModal({ open: false, title: "", loading: false })}
      />
      <ConfirmModal
        open={confirmReset}
        title="¿Reiniciar la sesión?"
        message="Vas a perder todo lo que escribiste hasta ahora. Esta acción no se puede deshacer."
        confirmLabel="Reiniciar"
        onConfirm={reset}
        onCancel={() => setConfirmReset(false)}
      />
      <SaveIndicator trigger={saveTick} />

      {state.stage !== "done" && (
        <button
          onClick={() => { haptic("tick"); setSocraticOpen(true); }}
          aria-label="Hablar con la guía socrática"
          className="fixed right-4 bottom-24 z-40 h-12 w-12 rounded-full bg-[#facb60] shadow-lg shadow-[#facb60]/40 flex items-center justify-center active:scale-95"
        >
          <Ic.Bulb size={20} />
        </button>
      )}

      <SocraticDrawer
        open={socraticOpen}
        onClose={() => setSocraticOpen(false)}
        context={socraticContext}
        draftText={socraticDraft}
      />

    </main>
  );
}
