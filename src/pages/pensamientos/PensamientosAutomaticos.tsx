import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/sonner";
import WizardShell from "@/components/pensamientos/shell/WizardShell";
import Step1FiltroMental from "@/components/pensamientos/steps/Step1FiltroMental";
import Step2Captura from "@/components/pensamientos/steps/Step2Captura";
import Step3HechosVsPensamientos from "@/components/pensamientos/steps/Step3HechosVsPensamientos";
import Step4Balanza from "@/components/pensamientos/steps/Step4Balanza";
import Step5Tratamiento from "@/components/pensamientos/steps/Step5Tratamiento";
import { useThoughtDraft } from "@/lib/pensamientos/state";
import { detectDistortion } from "@/lib/pensamientos/distortionDetector";

const TOTAL = 5;

export default function PensamientosAutomaticos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { draft, patch, reset } = useThoughtDraft();

  const step = Math.min(Math.max(draft.step, 1), TOTAL);

  const canContinue = useMemo(() => {
    switch (step) {
      case 1: return !!draft.caminoElegido;
      case 2:
        return !!draft.emotion &&
          (draft.emotion !== "otro" || draft.emotionOther.trim().length > 0) &&
          draft.triggerEvent.trim().length >= 4 &&
          draft.automaticThought.trim().length >= 8;
      case 3: return true;
      case 4: return draft.evidenceFor.length + draft.evidenceAgainst.length >= 1;
      case 5:
        if (draft.isRealProblem) return draft.actionPlan.some((r) => r.what.trim() && r.when.trim());
        return draft.alternativeThought.trim().length >= 8;
      default: return false;
    }
  }, [step, draft]);

  const goNext = async () => {
    if (step === 4) {
      // Compute distortion + routing
      const d = detectDistortion(draft.automaticThought);
      const isReal = draft.evidenceFor.length >= draft.evidenceAgainst.length;
      patch({
        step: 5,
        distortionKey: d?.key ?? null,
        distortionLabel: d?.label ?? null,
        isRealProblem: isReal,
        intensityFinal: draft.intensityInitial,
      });
      return;
    }
    if (step === 5) return finish();
    patch({ step: step + 1 });
  };

  const goBack = () => {
    if (step === 1) {
      navigate("/diario-inteligente/gestion-pensamientos");
      return;
    }
    patch({ step: step - 1 });
  };

  const finish = async () => {
    if (!user) {
      toast.error("Iniciá sesión para guardar tu sesión.");
      return;
    }
    const { error } = await supabase.from("thought_records").insert({
      user_id: user.id,
      situation: draft.triggerEvent || "(sin descripción)",
      automatic_thought: draft.automaticThought || null,
      emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
      emotion_other: draft.emotion === "otro" ? draft.emotionOther : null,
      emotion_intensity: draft.intensityInitial,
      evidence_for: draft.evidenceFor.join(" • ") || null,
      evidence_against: draft.evidenceAgainst.join(" • ") || null,
      evidence_for_json: draft.evidenceFor,
      evidence_against_json: draft.evidenceAgainst,
      alternative_thought: draft.alternativeThought || null,
      new_emotion: draft.emotion === "otro" ? draft.emotionOther : draft.emotion,
      new_emotion_intensity: draft.intensityFinal,
      distortion_key: draft.distortionKey,
      distortion_label: draft.distortionLabel,
      is_real_problem: draft.isRealProblem,
      brainstorm: draft.brainstorm || null,
      action_plan: draft.actionPlan,
      trainer_score: draft.trainerCompleted ? draft.trainerScore : null,
      completed_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("No pudimos guardar tu sesión. Probá de nuevo.");
      return;
    }
    toast.success("Sesión guardada. Gran trabajo.");
    reset();
    navigate("/diario-inteligente/gestion-pensamientos");
  };

  return (
    <WizardShell
      step={step}
      totalSteps={TOTAL}
      onBack={goBack}
      onNext={goNext}
      onReset={() => reset()}
      canContinue={canContinue}
      nextLabel={step === 5 ? "Finalizar sesión" : "Guardar y Continuar"}
    >
      {step === 1 && <Step1FiltroMental draft={draft} patch={patch} />}
      {step === 2 && <Step2Captura draft={draft} patch={patch} />}
      {step === 3 && <Step3HechosVsPensamientos draft={draft} patch={patch} />}
      {step === 4 && <Step4Balanza draft={draft} patch={patch} />}
      {step === 5 && <Step5Tratamiento draft={draft} patch={patch} />}
    </WizardShell>
  );
}
