import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { BREATHING_PATTERNS, getPattern } from "@/lib/breathingPatterns";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { PracticeConfigScreen } from "@/components/exercises/PracticeConfigScreen";
import { OrbView } from "@/components/mindfulness/breathing/OrbView";
import { BodyScanView } from "@/components/mindfulness/breathing/BodyScanView";
import type { MusicTrack } from "@/hooks/useMindfulAudio";

type Visual = "orb" | "bodyscan";

const ACCENT = "#7C5CFF";

export default function BreathingHome() {
  const navigate = useNavigate();
  const [patternId, setPatternId] = useState("box");
  const [visual, setVisual] = useState<Visual>("orb");
  const [minutes, setMinutes] = useState(1);
  const [voice, setVoice] = useState(true);
  const [music, setMusic] = useState<MusicTrack>("silence");
  const [sessionOpen, setSessionOpen] = useState(false);

  const pattern = getPattern(patternId);

  const meta: ExerciseShellMeta = {
    exerciseType: "mindfulness",
    exerciseName: `Respiración · ${pattern.name}`,
    resourceKey: `mindfulness.breathing.${pattern.id}`,
    subMode: visual,
    pattern: pattern.id,
    voiceEnabled: voice,
    musicTrack: music,
    durationSeconds: minutes * 60,
  };

  return (
    <>
      <PracticeConfigScreen
        title="Configurar Práctica"
        description={pattern.description}
        accent={ACCENT}
        subTabs={[
          { id: "orb", label: "Orbe Luminoso" },
          { id: "bodyscan", label: "Body Scan" },
        ]}
        activeSubTab={visual}
        onSubTabChange={(id) => setVisual(id as Visual)}
        minutes={minutes}
        onMinutesChange={setMinutes}
        durationOptions={[1, 3, 5]}
        voice={voice}
        onVoiceChange={setVoice}
        music={music}
        onMusicChange={setMusic}
        onClose={() => navigate("/herramientas/mindfulness")}
        onStart={() => setSessionOpen(true)}
        extraSlot={
          <div>
            <div className="text-center text-[10px] uppercase tracking-[0.22em] text-white/45">
              Patrón
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {BREATHING_PATTERNS.map((p) => {
                const active = patternId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setPatternId(p.id)}
                    className={cn(
                      "rounded-2xl border p-3 text-left transition",
                      active
                        ? "text-white"
                        : "border-white/[0.06] bg-white/[0.03] text-white/70"
                    )}
                    style={
                      active
                        ? { background: `${ACCENT}1f`, borderColor: `${ACCENT}80` }
                        : undefined
                    }
                  >
                    <div className="font-display text-sm font-semibold">{p.name}</div>
                    <div className="mt-0.5 text-[11px] text-white/50">{p.short}</div>
                  </button>
                );
              })}
            </div>
          </div>
        }
      />

      {sessionOpen && (
        <ExerciseShell
          meta={meta}
          onExit={() => setSessionOpen(false)}
          renderActivity={({ onComplete, onAbort }) =>
            visual === "orb" ? (
              <OrbView
                pattern={pattern}
                totalSeconds={minutes * 60}
                voiceEnabled={voice}
                hapticsEnabled={true}
                music={music}
                onComplete={onComplete}
                onAbort={onAbort}
              />
            ) : (
              <BodyScanView
                totalSeconds={minutes * 60}
                voiceEnabled={voice}
                music={music}
                onComplete={onComplete}
              />
            )
          }
        />
      )}
    </>
  );
}
