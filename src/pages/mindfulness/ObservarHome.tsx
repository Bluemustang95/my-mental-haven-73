import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Cloud, Eye } from "lucide-react";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { CloudsView } from "@/components/mindfulness/observar/CloudsView";
import { SensesView } from "@/components/mindfulness/observar/SensesView";
import { BentoSetupScreen } from "@/components/mindfulness/BentoSetupScreen";
import { TimeSetupScreen } from "@/components/mindfulness/breathing/TimeSetupScreen";
import {
  SessionToolbar,
  nextMusic,
} from "@/components/mindfulness/breathing/SessionToolbar";
import type { MusicTrack } from "@/hooks/useMindfulAudio";

type SubMode = "clouds" | "senses";
type Step = "setup_mode" | "setup_time" | "playing";

const ACCENT = "#60A5FA";

const SUB = {
  clouds: {
    name: "Mira el presente · Nubes pasajeras",
    resourceKey: "mindfulness.observar.clouds",
    subtitle: "Nubes pasajeras",
  },
  senses: {
    name: "Mira el presente · Lupa de los sentidos",
    resourceKey: "mindfulness.observar.senses",
    subtitle: "Lupa de los sentidos · 5-4-3-2-1",
  },
} as const;

export default function ObservarHome() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubMode>("clouds");
  const [minutes, setMinutes] = useState(2);
  const [step, setStep] = useState<Step>("setup_mode");
  const [voice, setVoice] = useState(true);
  const [music, setMusic] = useState<MusicTrack>("silence");

  const close = () => navigate("/herramientas/mindfulness");

  const meta: ExerciseShellMeta = {
    exerciseType: "mindfulness",
    exerciseName: SUB[sub].name,
    resourceKey: SUB[sub].resourceKey,
    subMode: sub,
    voiceEnabled: voice,
    musicTrack: music,
    durationSeconds: sub === "senses" ? undefined : minutes * 60,
  };

  if (step === "setup_mode") {
    return (
      <BentoSetupScreen
        title="¿Cómo querés observar?"
        subtitle="Dos formas de notar lo que aparece, sin engancharte."
        accent={ACCENT}
        onClose={close}
        onPick={(id) => {
          const next = id as SubMode;
          setSub(next);
          setStep(next === "clouds" ? "setup_time" : "playing");
        }}
        options={[
          {
            id: "clouds",
            title: "Nubes pasajeras",
            short: "Mirá pasar tus pensamientos.",
            Icon: Cloud,
            anim: "animate-pulse",
            bg: "bg-sky-400/30",
          },
          {
            id: "senses",
            title: "Lupa de los sentidos",
            short: "5-4-3-2-1 para anclarte al presente.",
            Icon: Eye,
            anim: "animate-[spin_10s_linear_infinite]",
            bg: "bg-violet-500/25",
          },
        ]}
      />
    );
  }

  if (step === "setup_time") {
    return (
      <TimeSetupScreen
        subtitle={SUB[sub].subtitle}
        minutes={minutes}
        onMinutesChange={setMinutes}
        onStart={() => setStep("playing")}
        onClose={close}
        onBack={() => setStep("setup_mode")}
        accent={ACCENT}
      />
    );
  }

  return (
    <ExerciseShell
      meta={meta}
      onExit={() => setStep("setup_mode")}
      renderActivity={({ onComplete, onAbort }) => (
        <div className="relative h-full w-full pb-32">
          {sub === "clouds" ? (
            <CloudsView
              totalSeconds={minutes * 60}
              voiceEnabled={voice}
              music={music}
              onComplete={onComplete}
              onAbort={onAbort}
            />
          ) : (
            <SensesView
              voiceEnabled={voice}
              music={music}
              onComplete={onComplete}
              onAbort={onAbort}
            />
          )}
          <SessionToolbar
            voice={voice}
            onVoiceToggle={() => setVoice((v) => !v)}
            music={music}
            onMusicCycle={() => setMusic((m) => nextMusic(m))}
            onFinish={onAbort}
          />
        </div>
      )}
    />
  );
}
