import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getPattern } from "@/lib/breathingPatterns";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { OrbView } from "@/components/mindfulness/breathing/OrbView";
import { BodyScanView } from "@/components/mindfulness/breathing/BodyScanView";
import { IntentionSetupScreen, intentionToPattern } from "@/components/mindfulness/breathing/IntentionSetupScreen";
import { TimeSetupScreen } from "@/components/mindfulness/breathing/TimeSetupScreen";
import { BreathingOnboarding } from "@/components/mindfulness/breathing/BreathingOnboarding";
import { primeAudio } from "@/lib/elevenLabsTTS";
import { primeAmbientAudio } from "@/hooks/useAmbientPlayer";
import { supabase } from "@/integrations/supabase/client";

const PATTERN_TO_SUBKEY: Record<string, string> = {
  "478": "dormir",
  sigh: "ansiedad",
  box: "concentrarme",
  coherence: "equilibrar",
};

type Visual = "orb" | "bodyscan";
type Step = "setup_intention" | "setup_time" | "playing";

const ACCENT = "#7C5CFF";
const ONBOARDED_KEY = "mindfulness:breathing:onboarded";

export default function BreathingHome() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Pre-cargar desde URL si viene de Home/Recomendado
  const urlIntention = searchParams.get("intention");
  const urlMinutes = parseInt(searchParams.get("minutes") ?? "", 10);

  const [patternId, setPatternId] = useState(
    urlIntention ? intentionToPattern(urlIntention) : "box"
  );
  const [visual, setVisual] = useState<Visual>("orb");
  const [minutes, setMinutes] = useState(
    Number.isFinite(urlMinutes) && urlMinutes >= 1 ? urlMinutes : 3
  );
  const [step, setStep] = useState<Step>(urlIntention ? "setup_time" : "setup_intention");
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(ONBOARDED_KEY)) setShowOnboarding(true);
    } catch {}
  }, []);

  function finishOnboarding() {
    try {
      localStorage.setItem(ONBOARDED_KEY, "1");
    } catch {}
    setShowOnboarding(false);
  }

  const pattern = getPattern(patternId);
  const close = () => navigate("/herramientas/mindfulness");

  const handleVisualChange = (v: Visual) => {
    setVisual(v);
    if (v === "bodyscan") setStep("setup_time");
  };

  const meta: ExerciseShellMeta = {
    exerciseType: "mindfulness",
    exerciseName:
      visual === "orb" ? `Respiración · ${pattern.name}` : "Respiración · Body Scan",
    resourceKey:
      visual === "orb"
        ? `mindfulness.breathing.${pattern.id}`
        : "mindfulness.breathing.bodyscan",
    subMode: visual,
    pattern: pattern.id,
    voiceEnabled: true,
    musicTrack: "silence",
    durationSeconds: minutes * 60,
  };

  if (showOnboarding) {
    return <BreathingOnboarding onDone={finishOnboarding} />;
  }

  if (step === "setup_intention" && visual === "orb") {
    return (
      <IntentionSetupScreen
        visual={visual}
        onVisualChange={handleVisualChange}
        onPickIntention={(_, pid) => {
          setPatternId(pid);
          setStep("setup_time");
        }}
        onPickAdvanced={(pid) => {
          setPatternId(pid);
          setStep("setup_time");
        }}
        onClose={close}
        accent={ACCENT}
      />
    );
  }

  if (step === "setup_time" || (step === "setup_intention" && visual === "bodyscan")) {
    return (
      <TimeSetupScreen
        subtitle={
          visual === "orb" ? `Respiración · ${pattern.name}` : "Escáner corporal guiado"
        }
        minutes={minutes}
        onMinutesChange={setMinutes}
        onStart={() => { primeAudio(); primeAmbientAudio(); setStep("playing"); }}
        onClose={close}
        onBack={visual === "orb" ? () => setStep("setup_intention") : undefined}
        accent={ACCENT}
      />
    );
  }

  return (
    <ExerciseShell
      meta={meta}
      onExit={() => setStep(visual === "orb" ? "setup_intention" : "setup_time")}
      renderActivity={({ onComplete, onAbort }) =>
        visual === "orb" ? (
          <OrbView
            pattern={pattern}
            totalSeconds={minutes * 60}
            initialVoice
            initialMusic="rain_soft"
            hapticsEnabled
            onComplete={onComplete}
            onAbort={onAbort}
          />
        ) : (
          <BodyScanView
            totalSeconds={minutes * 60}
            initialVoice
            initialMusic="rain_soft"
            onComplete={onComplete}
            onAbort={onAbort}
          />
        )
      }
    />
  );
}
