import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, ScanText, HeartPulse } from "lucide-react";

import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { HechosJuiciosView } from "@/components/mindfulness/describir/HechosJuiciosView";
import { EscanerNeutralView } from "@/components/mindfulness/describir/EscanerNeutralView";
import { AnatomiaEmocionView } from "@/components/mindfulness/describir/AnatomiaEmocionView";
import { BentoSetupScreen } from "@/components/mindfulness/BentoSetupScreen";
import {
  SessionToolbar,
  nextMusic,
} from "@/components/mindfulness/breathing/SessionToolbar";
import type { MusicTrack } from "@/hooks/useMindfulAudio";

type SubMode = "facts" | "scan" | "anatomy";
type Step = "setup_mode" | "playing";

const ACCENT = "#A78BFA";

const SUB = {
  facts: {
    name: "Ver los hechos · Hechos vs. juicios",
    resourceKey: "mindfulness.describir.facts",
  },
  scan: {
    name: "Ver los hechos · Escáner neutral",
    resourceKey: "mindfulness.describir.scan",
  },
  anatomy: {
    name: "Ver los hechos · Anatomía de la emoción",
    resourceKey: "mindfulness.describir.anatomy",
  },
} as const;

export default function DescribirHome() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubMode>("facts");
  const [step, setStep] = useState<Step>("setup_mode");
  const [voice, setVoice] = useState(false);
  const [music, setMusic] = useState<MusicTrack>("silence");

  const close = () => navigate("/herramientas/mindfulness");

  const meta: ExerciseShellMeta = {
    exerciseType: "mindfulness",
    exerciseName: SUB[sub].name,
    resourceKey: SUB[sub].resourceKey,
    subMode: sub,
    voiceEnabled: voice,
    musicTrack: music,
  };

  if (step === "setup_mode") {
    return (
      <BentoSetupScreen
        title="Poner palabras"
        subtitle="Tres formas de describir lo que pasa sin etiquetarlo."
        accent={ACCENT}
        layout="stack"
        onClose={close}
        onPick={(id) => {
          setSub(id as SubMode);
          setStep("playing");
        }}
        options={[
          {
            id: "facts",
            title: "Hechos vs. juicios",
            short: "10 cartas para entrenar el ojo clínico.",
            Icon: Layers,
            anim: "animate-pulse",
            bg: "bg-violet-500/25",
          },
          {
            id: "scan",
            title: "Escáner neutral",
            short: "La IA reescribe lo que contaste, sin etiquetas.",
            Icon: ScanText,
            anim: "animate-[spin_12s_linear_infinite]",
            bg: "bg-fuchsia-500/25",
          },
          {
            id: "anatomy",
            title: "Anatomía de la emoción",
            short: "Nombrala, ubicala, medí su intensidad.",
            Icon: HeartPulse,
            anim: "animate-bounce",
            bg: "bg-rose-500/25",
          },
        ]}
      />
    );
  }

  return (
    <ExerciseShell
      meta={meta}
      onExit={() => setStep("setup_mode")}
      renderActivity={({ onComplete, onAbort }) => (
        <div className="relative h-full w-full pb-32">
          {sub === "facts" && (
            <HechosJuiciosView music={music} onComplete={onComplete} onAbort={onAbort} />
          )}
          {sub === "scan" && (
            <EscanerNeutralView music={music} onComplete={onComplete} onAbort={onAbort} />
          )}
          {sub === "anatomy" && (
            <AnatomiaEmocionView
              music={music}
              voiceEnabled={voice}
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
