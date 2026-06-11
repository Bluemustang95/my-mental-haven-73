import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { PracticeConfigScreen } from "@/components/exercises/PracticeConfigScreen";
import { CloudsView } from "@/components/mindfulness/observar/CloudsView";
import { SensesView } from "@/components/mindfulness/observar/SensesView";
import type { MusicTrack } from "@/hooks/useMindfulAudio";

type SubMode = "clouds" | "senses";

const ACCENT = "#60A5FA";

const SUB = {
  clouds: {
    title: "Nubes Pasajeras",
    desc: "Escribí los pensamientos que aparecen y mirálos pasar. No tenés que creerles ni resolverlos.",
    resourceKey: "mindfulness.observar.clouds",
    name: "Observar · Nubes pasajeras",
  },
  senses: {
    title: "Lupa de los Sentidos",
    desc: "Anclate al presente con un recorrido 5-4-3-2-1 por lo que tu cuerpo está percibiendo ahora.",
    resourceKey: "mindfulness.observar.senses",
    name: "Observar · Lupa de los sentidos",
  },
} as const;

export default function ObservarHome() {
  const navigate = useNavigate();
  const [sub, setSub] = useState<SubMode>("clouds");
  const [minutes, setMinutes] = useState(2);
  const [voice, setVoice] = useState(true);
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
    durationSeconds: sub === "senses" ? undefined : minutes * 60,
  };

  return (
    <>
      <PracticeConfigScreen
        title={info.title}
        description={info.desc}
        accent={ACCENT}
        subTabs={[
          { id: "clouds", label: "Nubes" },
          { id: "senses", label: "Sentidos" },
        ]}
        activeSubTab={sub}
        onSubTabChange={(id) => setSub(id as SubMode)}
        minutes={sub === "clouds" ? minutes : undefined}
        onMinutesChange={sub === "clouds" ? setMinutes : undefined}
        durationOptions={sub === "clouds" ? [2, 5, 10] : undefined}
        voice={voice}
        onVoiceChange={setVoice}
        music={music}
        onMusicChange={setMusic}
        onClose={() => navigate("/herramientas/mindfulness")}
        onStart={() => setSessionOpen(true)}
      />

      {sessionOpen && (
        <ExerciseShell
          meta={meta}
          onExit={() => setSessionOpen(false)}
          renderActivity={({ onComplete, onAbort }) =>
            sub === "clouds" ? (
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
            )
          }
        />
      )}
    </>
  );
}
