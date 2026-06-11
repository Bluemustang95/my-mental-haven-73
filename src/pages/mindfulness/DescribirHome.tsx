import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Layers, ScanText, HeartPulse } from "lucide-react";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { PracticeConfigScreen } from "@/components/exercises/PracticeConfigScreen";
import { HechosJuiciosView } from "@/components/mindfulness/describir/HechosJuiciosView";
import { EscanerNeutralView } from "@/components/mindfulness/describir/EscanerNeutralView";
import { AnatomiaEmocionView } from "@/components/mindfulness/describir/AnatomiaEmocionView";
import type { MusicTrack } from "@/hooks/useMindfulAudio";

type SubMode = "facts" | "scan" | "anatomy";

const ACCENT = "#A78BFA";

const SUB = {
  facts: {
    title: "Hechos vs. Juicios",
    short: "Hechos",
    desc: "10 cartas. Decidí si lo que leés es un dato observable o una etiqueta. Entrena el ojo clínico.",
    icon: Layers,
    resourceKey: "mindfulness.describir.facts",
    name: "Describir · Hechos vs. juicios",
  },
  scan: {
    title: "Escáner Neutral",
    short: "Escáner",
    desc: "Escribí lo que pasó y la IA te lo devuelve en formato observable, sin etiquetas ni interpretaciones.",
    icon: ScanText,
    resourceKey: "mindfulness.describir.scan",
    name: "Describir · Escáner neutral",
  },
  anatomy: {
    title: "Anatomía de la Emoción",
    short: "Anatomía",
    desc: "Nombrá la emoción, ubicala en el cuerpo, medí su intensidad. Lo que se nombra se puede regular.",
    icon: HeartPulse,
    resourceKey: "mindfulness.describir.anatomy",
    name: "Describir · Anatomía de la emoción",
  },
} as const;

export default function DescribirHome() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubMode>("facts");
  const [voice, setVoice] = useState(false);
  const [music, setMusic] = useState<MusicTrack>("silence");
  const [sessionOpen, setSessionOpen] = useState(false);

  const info = SUB[sub];

  const meta: ExerciseShellMeta = {
    exerciseType: "mindfulness",
    exerciseName: info.name,
    resourceKey: info.resourceKey,
    subMode: sub,
    voiceEnabled: voice,
    musicTrack: music,
  };

  return (
    <>
      <PracticeConfigScreen
        title={info.title}
        description={info.desc}
        accent={ACCENT}
        subTabs={(Object.keys(SUB) as SubMode[]).map((k) => ({ id: k, label: SUB[k].short }))}
        activeSubTab={sub}
        onSubTabChange={(id) => setSub(id as SubMode)}
        voice={voice}
        onVoiceChange={setVoice}
        music={music}
        onMusicChange={setMusic}
        onClose={() => navigate("/herramientas/mindfulness")}
        onStart={() => setSessionOpen(true)}
        extraSlot={
          <div className="flex justify-center">
            <div
              className="h-20 w-20 rounded-3xl flex items-center justify-center"
              style={{ background: `${ACCENT}1f`, border: `1px solid ${ACCENT}66` }}
            >
              <info.icon size={32} style={{ color: ACCENT }} />
            </div>
          </div>
        }
      />

      {sessionOpen && (
        <ExerciseShell
          meta={meta}
          onExit={() => setSessionOpen(false)}
          renderActivity={({ onComplete, onAbort }) => {
            if (sub === "facts") return <HechosJuiciosView music={music} onComplete={onComplete} onAbort={onAbort} />;
            if (sub === "scan") return <EscanerNeutralView music={music} onComplete={onComplete} onAbort={onAbort} />;
            return <AnatomiaEmocionView music={music} voiceEnabled={voice} onComplete={onComplete} onAbort={onAbort} />;
          }}
        />
      )}
    </>
  );
}
