import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getPattern } from "@/lib/breathingPatterns";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { OrbView } from "@/components/mindfulness/breathing/OrbView";
import { BodyScanView } from "@/components/mindfulness/breathing/BodyScanView";
import { PatternSetupScreen } from "@/components/mindfulness/breathing/PatternSetupScreen";
import { TimeSetupScreen } from "@/components/mindfulness/breathing/TimeSetupScreen";

type Visual = "orb" | "bodyscan";
type Step = "setup_pattern" | "setup_time" | "playing";

const ACCENT = "#7C5CFF";

export default function BreathingHome() {
  const navigate = useNavigate();
  const [patternId, setPatternId] = useState("box");
  const [visual, setVisual] = useState<Visual>("orb");
  const [minutes, setMinutes] = useState(3);
  const [step, setStep] = useState<Step>("setup_pattern");

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

  if (step === "setup_pattern" && visual === "orb") {
    return (
      <PatternSetupScreen
        visual={visual}
        onVisualChange={handleVisualChange}
        onPick={(id) => {
          setPatternId(id);
          setStep("setup_time");
        }}
        onClose={close}
        accent={ACCENT}
      />
    );
  }

  if (step === "setup_time" || (step === "setup_pattern" && visual === "bodyscan")) {
    return (
      <TimeSetupScreen
        subtitle={
          visual === "orb" ? `Respiración · ${pattern.name}` : "Escáner corporal guiado"
        }
        minutes={minutes}
        onMinutesChange={setMinutes}
        onStart={() => setStep("playing")}
        onClose={close}
        onBack={visual === "orb" ? () => setStep("setup_pattern") : undefined}
        accent={ACCENT}
      />
    );
  }

  return (
    <ExerciseShell
      meta={meta}
      onExit={() => setStep(visual === "orb" ? "setup_pattern" : "setup_time")}
      renderActivity={({ onComplete, onAbort }) =>
        visual === "orb" ? (
          <OrbView
            pattern={pattern}
            totalSeconds={minutes * 60}
            initialVoice
            initialMusic="silence"
            hapticsEnabled
            onComplete={onComplete}
            onAbort={onAbort}
          />
        ) : (
          <BodyScanView
            totalSeconds={minutes * 60}
            initialVoice
            initialMusic="silence"
            onComplete={onComplete}
            onAbort={onAbort}
          />
        )
      }
    />
  );
}
