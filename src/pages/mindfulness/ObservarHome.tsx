import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Cloud, Hand, Volume2, VolumeX, Music, CloudRain, Sparkles, Eye } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WeekStrip } from "@/components/home/WeekStrip";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { CloudsView } from "@/components/mindfulness/observar/CloudsView";
import { SensesView } from "@/components/mindfulness/observar/SensesView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import type { MusicTrack } from "@/hooks/useMindfulAudio";
import { addDays, startOfWeek } from "date-fns";

type SubMode = "clouds" | "senses";

const SUB = {
  clouds: {
    title: "Nubes pasajeras",
    desc: "Escribí los pensamientos que aparecen y mirálos pasar. No tenés que creerles ni resolverlos.",
    icon: Cloud,
    resourceKey: "mindfulness.observar.clouds",
    name: "Observar · Nubes pasajeras",
  },
  senses: {
    title: "Lupa de los sentidos",
    desc: "Anclate al presente con un recorrido 5-4-3-2-1 por lo que tu cuerpo está percibiendo ahora.",
    icon: Hand,
    resourceKey: "mindfulness.observar.senses",
    name: "Observar · Lupa de los sentidos",
  },
} as const;

export default function ObservarHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sub, setSub] = useState<SubMode>("clouds");
  const [minutes, setMinutes] = useState(2);
  const [voice, setVoice] = useState(false);
  const [music, setMusic] = useState<MusicTrack>("silence");
  const [sessionOpen, setSessionOpen] = useState(false);
  const [progressByDate, setProgressByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    (async () => {
      const start = startOfWeek(new Date(), { weekStartsOn: 1 });
      const end = addDays(start, 7);
      const { data } = await supabase
        .from("exercise_sessions")
        .select("created_at, sub_mode")
        .eq("user_id", user.id)
        .eq("exercise_type", "mindfulness")
        .in("sub_mode", ["clouds", "senses"])
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
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="px-5 pt-12">
        <button onClick={() => navigate("/herramientas/mindfulness")} className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#60A5FA] to-[#A78BFA] flex items-center justify-center">
            <Eye size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#101927]">Observar</h1>
            <p className="text-xs text-muted-foreground">Notar sin engancharse</p>
          </div>
        </div>

        <div className="mt-5">
          <WeekStrip progressByDate={progressByDate} onSelectDay={(d) => navigate(`/calendario/${localDateStr(d)}`)} />
        </div>
      </div>

      {/* Sub-mode selector */}
      <div className="mt-6 px-5">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Práctica</div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(SUB) as SubMode[]).map((key) => {
            const item = SUB[key];
            const Icon = item.icon;
            return (
              <button
                key={key}
                onClick={() => setSub(key)}
                className={cn(
                  "rounded-2xl border p-4 text-left flex flex-col gap-2 transition",
                  sub === key ? "border-[#60A5FA] bg-white shadow-sm" : "border-transparent bg-white/60"
                )}
              >
                <Icon size={20} className={sub === key ? "text-[#60A5FA]" : "text-muted-foreground"} />
                <div className="font-display text-sm font-semibold text-[#101927]">{item.title}</div>
              </button>
            );
          })}
        </div>
        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{info.desc}</p>
      </div>

      {/* Duration (only for clouds) */}
      {sub === "clouds" && (
        <div className="mt-5 px-5">
          <div className="mb-2 flex items-center justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
            <span>Duración</span>
            <span className="font-bold text-[#101927]">{minutes} min</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[2, 5, 10].map((m) => (
              <button
                key={m}
                onClick={() => setMinutes(m)}
                className={cn(
                  "rounded-2xl border py-3 text-sm font-semibold transition",
                  minutes === m ? "border-[#60A5FA] bg-white text-[#101927]" : "border-transparent bg-white/60 text-muted-foreground"
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
            className="mt-3 w-full accent-[#60A5FA]"
          />
        </div>
      )}

      {/* Audio toggles */}
      <div className="mt-5 px-5">
        <div className="rounded-2xl bg-white p-3 shadow-sm space-y-2">
          <ToggleRow icon={voice ? Volume2 : VolumeX} label="Voz guía" on={voice} onChange={setVoice} />
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
                    music === t.id ? "border-[#60A5FA] bg-[#60A5FA]/5 text-[#101927]" : "border-transparent bg-[#FDFCFB] text-muted-foreground"
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

      <div className="mt-6 px-5">
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={() => setSessionOpen(true)}
          className="w-full rounded-full bg-[#101927] py-4 font-display text-base font-semibold text-white shadow-lg"
        >
          Comenzar
        </motion.button>
      </div>

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
    </div>
  );
}

function ToggleRow({ icon: Icon, label, on, onChange }: { icon: any; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between py-2">
      <div className="flex items-center gap-2"><Icon size={16} className="text-muted-foreground" /><span className="text-sm">{label}</span></div>
      <div className={cn("relative h-6 w-10 rounded-full transition", on ? "bg-[#60A5FA]" : "bg-black/15")}>
        <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </div>
    </button>
  );
}
