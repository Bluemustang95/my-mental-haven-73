import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import WizardShell from "@/components/pensamientos/shell/WizardShell";
import Step1Situacion from "@/components/pensamientos/steps/Step1Situacion";
import Step2Pensamiento from "@/components/pensamientos/steps/Step2Pensamiento";
import Step3Emociones from "@/components/pensamientos/steps/Step3Emociones";
import Step4Conducta from "@/components/pensamientos/steps/Step4Conducta";
import Step5Sensaciones from "@/components/pensamientos/steps/Step5Sensaciones";
import Step6Balanza from "@/components/pensamientos/steps/Step6Balanza";
import Step7Distorsiones from "@/components/pensamientos/steps/Step7Distorsiones";
import Step8Resolucion from "@/components/pensamientos/steps/Step8Resolucion";
import PsicoeducacionModal from "@/components/pensamientos/shell/PsicoeducacionModal";
import PasosDrawer from "@/components/pensamientos/shell/PasosDrawer";
// AiCompanionDrawer eliminado: ahora se usa Resmita global (FAB amarillo)
import FollowupPromptModal from "@/components/pensamientos/FollowupPromptModal";
import { STEP_TITLES, STEP_HELP } from "@/lib/pensamientos/stepHelp";
import { getResolutionMode, useThoughtDraft, type ThoughtDraft } from "@/lib/pensamientos/state";
import { usePublishResmitaStep } from "@/hooks/useResmitaStep";

const TOTAL = 8;
const HUB = "/herramientas/mente-emocion";

function isStepDone(d: ThoughtDraft, step: number): boolean {
  switch (step) {
    case 1: return d.triggerEvent.trim().length >= 4;
    case 2: return d.automaticThought.trim().length >= 4;
    case 3: return !!d.emotion;
    case 4: return d.behavior.trim().length >= 3;
    case 5: return d.bodySensations.length > 0;
    case 6: return d.evidenceFor.length + d.evidenceAgainst.length >= 1;
    case 7: return d.distortions.length > 0;
    case 8:
      return getResolutionMode(d) === "abordaje"
        ? d.resolutionPlan.trim().length >= 5
        : d.alternativeThought.trim().length >= 5;
    default: return false;
  }
}

export default function PensamientosAutomaticos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, patch, reset } = useThoughtDraft();
  const [helpOpen, setHelpOpen] = useState(false);
  const [pasosOpen, setPasosOpen] = useState(false);
  const [followupOpen, setFollowupOpen] = useState(false);
  const [savedRecordId, setSavedRecordId] = useState<string | null>(null);
  const [finishedMode, setFinishedMode] = useState<"reestructuracion" | "abordaje">("reestructuracion");

  const step = Math.min(Math.max(draft.step, 1), TOTAL);
  const canContinue = isStepDone(draft, step);

  const stepTitle = useMemo(() => {
    if (step !== 8) return STEP_TITLES[step - 1];
    return getResolutionMode(draft) === "abordaje" ? "Abordaje del Problema" : "Reestructuración";
  }, [step, draft]);

  // Publica el paso actual para que Resmita adapte su contexto al paso del wizard.
  const help = STEP_HELP[step];
  usePublishResmitaStep({
    stepTitle: `Pensamientos · ${stepTitle}`,
    purpose: help?.body?.[0] ?? `El usuario está en el paso "${stepTitle}" del wizard CBT de pensamientos automáticos.`,
    welcome: help?.llave
      ? `Estamos en "${stepTitle}". Guía: ${help.llave}`
      : `Estamos en "${stepTitle}". ¿Te ayudo con este paso?`,
  });

  const goNext = () => {
    if (step === TOTAL) return finish();
    patch({ step: step + 1 });
  };

  const goBack = () => {
    if (step === 1) { navigate(HUB); return; }
    patch({ step: step - 1 });
  };

  const finish = async () => {
    if (!user) {
      toast.error("Iniciá sesión para guardar tu sesión.");
      return;
    }
    const mode = getResolutionMode(draft);
    const { data, error } = await supabase.from("thought_records").insert({
      user_id: user.id,
      situation: draft.triggerEvent || "(sin descripción)",
      automatic_thought: draft.automaticThought || null,
      emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
      emotion_other: draft.emotion === "otro" ? draft.emotionOther : null,
      emotion_intensity: draft.intensityInitial,
      sub_emotions: draft.subEmotions,
      behavior: draft.behavior || null,
      body_sensations: draft.bodySensations,
      evidence_for: draft.evidenceFor.join(" • ") || null,
      evidence_against: draft.evidenceAgainst.join(" • ") || null,
      evidence_for_json: draft.evidenceFor,
      evidence_against_json: draft.evidenceAgainst,
      distortions: draft.distortions,
      distortion_key: draft.distortions[0]?.key ?? null,
      distortion_label: draft.distortions[0]?.label ?? null,
      alternative_thought: mode === "reestructuracion" ? draft.alternativeThought : null,
      resolution_mode: mode,
      resolution_plan: mode === "abordaje" ? draft.resolutionPlan : null,
      is_real_problem: mode === "abordaje",
      new_emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
      new_emotion_intensity: draft.intensityFinal,
      completed_at: new Date().toISOString(),
    } as any).select("id").maybeSingle();
    if (error) {
      console.error(error);
      toast.error("No pudimos guardar tu sesión. Probá de nuevo.");
      return;
    }
    toast.success("Sesión guardada. Gran trabajo.");
    setSavedRecordId((data as any)?.id ?? null);
    setFinishedMode(mode);
    setFollowupOpen(true);
  };

  const closeFollowup = () => {
    setFollowupOpen(false);
    reset();
    navigate(HUB);
  };

  return (
    <>
      <WizardShell
        step={step}
        totalSteps={TOTAL}
        stepTitle={stepTitle}
        onBack={goBack}
        onNext={goNext}
        onHelp={() => setHelpOpen(true)}
        onOpenSteps={() => setPasosOpen(true)}
        canContinue={canContinue}
        nextLabel={step === TOTAL ? "Terminar" : "Siguiente"}
      >
        {step === 1 && <Step1Situacion draft={draft} patch={patch} />}
        {step === 2 && <Step2Pensamiento draft={draft} patch={patch} />}
        {step === 3 && <Step3Emociones draft={draft} patch={patch} />}
        {step === 4 && <Step4Conducta draft={draft} patch={patch} />}
        {step === 5 && <Step5Sensaciones draft={draft} patch={patch} />}
        {step === 6 && <Step6Balanza draft={draft} patch={patch} />}
        {step === 7 && <Step7Distorsiones draft={draft} patch={patch} />}
        {step === 8 && <Step8Resolucion draft={draft} patch={patch} />}
      </WizardShell>

      {/* Resmita global (FAB amarillo) reemplaza al AiCompanionDrawer celeste */}

      <PsicoeducacionModal open={helpOpen} step={step} onClose={() => setHelpOpen(false)} />

      <PasosDrawer
        open={pasosOpen}
        currentStep={step}
        draft={draft}
        isStepComplete={(s) => isStepDone(draft, s)}
        onJump={(s) => patch({ step: s })}
        onClose={() => setPasosOpen(false)}
      />

      <FollowupPromptModal
        open={followupOpen}
        thoughtRecordId={savedRecordId}
        userId={user?.id ?? null}
        mode={finishedMode}
        defaultTitle={finishedMode === "abordaje" ? "Ejecutá tu plan de acción" : "Practicá tu pensamiento alternativo"}
        onClose={closeFollowup}
      />
    </>
  );
}
