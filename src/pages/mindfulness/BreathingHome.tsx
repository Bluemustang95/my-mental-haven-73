import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Volume2, VolumeX, Vibrate, Music, Zap, Wind, CloudRain, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WeekStrip } from "@/components/home/WeekStrip";
import { BREATHING_PATTERNS, getPattern } from "@/lib/breathingPatterns";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { OrbView } from "@/components/mindfulness/breathing/OrbView";
import { BodyScanView } from "@/components/mindfulness/breathing/BodyScanView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import type { MusicTrack } from "@/hooks/useMindfulAudio";
import { addDays, startOfWeek } from "date-fns";

type Visual = "orb" | "bodyscan";

export default function BreathingHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [patternId, setPatternId] = useState("box");
  const [visual, setVisual] = useState<Visual>("orb");
  const [minutes, setMinutes] = useState(3);
  const [voice, setVoice] = useState(false);
  const [haptics, setHaptics] = useState(true);
  const [music, setMusic] = useState<MusicTrack>("silence");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [progressByDate, setProgressByDate] = useState<Record<string, number>>({});

  // Load week's mindfulness sessions
  useEffect(() => {
    if (!user) return;
    (async () => {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = addDays(start, 7);
      const { data } = await supabase
        .from("exercise_sessions")
        .select("created_at")
        .eq("user_id", user.id)
        .eq("exercise_type", "mindfulness")
        .gte("created_at", start.toISOString())
        .lt("created_at", end.toISOString());
      const map: Record<string, number> = {};
      (data ?? []).forEach((r: any) => {
        const k = localDateStr(new Date(r.created_at));
        map[k] = Math.min(4, (map[k] ?? 0) + 1);
      });
      setProgressByDate(map);
    })();
  }, [user, sessionOpen]);

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

  function startExpress() {
    setPatternId("478");
    setMinutes(1);
    setVisual("orb");
    setSessionOpen(true);
  }

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      {/* Header */}
      <div className="px-5 pt-12">
        <button onClick={() => navigate("/herramientas/mindfulness")} className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#FB923C] to-[#FCD34D] flex items-center justify-center">
            <Wind size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#101927]">Mindfulness</h1>
            <p className="text-xs text-muted-foreground">Respiración guiada</p>
          </div>
        </div>

        <div className="mt-5">
          <WeekStrip progressByDate={progressByDate} onSelectDay={(d) => navigate(`/calendario/${localDateStr(d)}`)} />
        </div>
      </div>

      {/* Express button */}
      <div className="mt-6 px-5">
        <button onClick={startExpress} className="w-full rounded-2xl border border-[#FB923C]/30 bg-white p-4 flex items-center gap-3 text-left shadow-sm hover:bg-[#FB923C]/5 transition">
          <div className="h-10 w-10 rounded-xl bg-[#FB923C]/10 flex items-center justify-center">
            <Zap size={18} className="text-[#FB923C]" />
          </div>
          <div className="flex-1">
            <div className="font-display text-sm font-semibold text-[#101927]">Respiro de 1 minuto</div>
            <div className="text-xs text-muted-foreground">Salta el chequeo y empezá ya</div>
          </div>
        </button>
      </div>

      {/* Pattern selector */}
      <div className="mt-6 px-5">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Patrón</div>
        <div className="grid grid-cols-2 gap-2">
          {BREATHING_PATTERNS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPatternId(p.id)}
              className={cn(
                "rounded-2xl border p-3 text-left transition",
                patternId === p.id
                  ? "border-[#FB923C] bg-white shadow-sm"
                  : "border-transparent bg-white/60"
              )}
            >
              <div className="font-display text-sm font-semibold text-[#101927]">{p.name}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">{p.short}</div>
            </button>
          ))}
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">{pattern.description}</p>
      </div>

      {/* Duration */}
      <div className="mt-5 px-5">
        <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
          <span>Duración</span>
          <span className="font-bold text-[#101927]">{minutes} min</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[1, 3, 5].map((m) => (
            <button
              key={m}
              onClick={() => setMinutes(m)}
              className={cn(
                "rounded-2xl border py-3 text-sm font-semibold transition",
                minutes === m ? "border-[#FB923C] bg-white text-[#101927]" : "border-transparent bg-white/60 text-muted-foreground"
              )}
            >
              {m} min
            </button>
          ))}
        </div>
        <input
          type="range"
          min={1}
          max={20}
          value={minutes}
          onChange={(e) => setMinutes(Number(e.target.value))}
          className="mt-3 w-full accent-[#FB923C]"
        />
      </div>

      {/* Visual */}
      <div className="mt-5 px-5">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Visual</div>
        <div className="grid grid-cols-2 gap-2">
          <VisualCard active={visual === "orb"} onClick={() => setVisual("orb")} icon={Sparkles} label="Orbe luminoso" />
          <VisualCard active={visual === "bodyscan"} onClick={() => setVisual("bodyscan")} icon={Wind} label="Escáner corporal" />
        </div>
      </div>

      {/* Toggles */}
      <div className="mt-5 px-5">
        <div className="rounded-2xl bg-white p-3 shadow-sm space-y-2">
          <ToggleRow icon={voice ? Volume2 : VolumeX} label="Voz guía" on={voice} onChange={setVoice} />
          <ToggleRow icon={Vibrate} label="Vibración" on={haptics} onChange={setHaptics} />
          <div className="pt-2 border-t border-black/5">
            <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground"><Music size={14} /> Sonido ambiente</div>
            <div className="grid grid-cols-3 gap-2">
              {([
                { id: "silence", label: "Silencio", icon: VolumeX },
                { id: "rain", label: "Lluvia", icon: CloudRain },
                { id: "ambient", label: "Ambient", icon: Sparkles },
              ] as const).map((t) => (
                <button
                  key={t.id}
                  onClick={() => setMusic(t.id)}
                  className={cn(
                    "rounded-xl border py-2 text-[11px] font-medium transition flex flex-col items-center gap-1",
                    music === t.id ? "border-[#FB923C] bg-[#FB923C]/5 text-[#101927]" : "border-transparent bg-[#FDFCFB] text-muted-foreground"
                  )}
                >
                  <t.icon size={14} />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Start */}
      <div className="mt-6 px-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setSessionOpen(true)}
          className="w-full rounded-full bg-[#101927] py-4 font-display text-base font-semibold text-white shadow-lg"
        >
          Comenzar sesión
        </motion.button>
      </div>

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
                hapticsEnabled={haptics}
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
    </div>
  );
}

function VisualCard({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: any; label: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-2xl border p-4 flex flex-col items-center gap-2 transition",
        active ? "border-[#FB923C] bg-white shadow-sm" : "border-transparent bg-white/60"
      )}
    >
      <Icon size={20} className={active ? "text-[#FB923C]" : "text-muted-foreground"} />
      <span className="font-display text-xs font-semibold text-[#101927]">{label}</span>
    </button>
  );
}

function ToggleRow({ icon: Icon, label, on, onChange }: { icon: any; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between py-2">
      <div className="flex items-center gap-2"><Icon size={16} className="text-muted-foreground" /><span className="text-sm">{label}</span></div>
      <div className={cn("relative h-6 w-10 rounded-full transition", on ? "bg-[#FB923C]" : "bg-black/15")}>
        <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </div>
    </button>
  );
}
