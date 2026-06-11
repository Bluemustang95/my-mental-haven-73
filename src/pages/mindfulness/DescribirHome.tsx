import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Layers, ScanText, HeartPulse, Volume2, VolumeX, Music, CloudRain, Sparkles, MessageSquare } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { WeekStrip } from "@/components/home/WeekStrip";
import { ExerciseShell, type ExerciseShellMeta } from "@/components/exercises/ExerciseShell";
import { HechosJuiciosView } from "@/components/mindfulness/describir/HechosJuiciosView";
import { EscanerNeutralView } from "@/components/mindfulness/describir/EscanerNeutralView";
import { AnatomiaEmocionView } from "@/components/mindfulness/describir/AnatomiaEmocionView";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { localDateStr } from "@/lib/utils";
import type { MusicTrack } from "@/hooks/useMindfulAudio";
import { addDays, startOfWeek } from "date-fns";

type SubMode = "facts" | "scan" | "anatomy";

const SUB = {
  facts: {
    title: "Hechos vs. juicios",
    desc: "10 cartas. Decidí si lo que leés es un dato observable o una etiqueta. Entrena el ojo clínico.",
    icon: Layers,
    resourceKey: "mindfulness.describir.facts",
    name: "Describir · Hechos vs. juicios",
  },
  scan: {
    title: "Escáner neutral",
    desc: "Escribí lo que pasó y la IA te lo devuelve en formato observable, sin etiquetas ni interpretaciones.",
    icon: ScanText,
    resourceKey: "mindfulness.describir.scan",
    name: "Describir · Escáner neutral",
  },
  anatomy: {
    title: "Anatomía de la emoción",
    desc: "Nombrá la emoción, ubicala en el cuerpo, medí su intensidad. Lo que se nombra se puede regular.",
    icon: HeartPulse,
    resourceKey: "mindfulness.describir.anatomy",
    name: "Describir · Anatomía de la emoción",
  },
} as const;

export default function DescribirHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sub, setSub] = useState<SubMode>("facts");
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
        .in("sub_mode", ["facts", "scan", "anatomy"])
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
  };

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-32">
      <div className="px-5 pt-12">
        <button onClick={() => navigate("/herramientas/mindfulness")} className="mb-4 flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-sm">
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-[#A78BFA] to-[#F472B6] flex items-center justify-center">
            <MessageSquare size={22} className="text-white" />
          </div>
          <div>
            <h1 className="font-serif text-3xl font-bold text-[#101927]">Describir</h1>
            <p className="text-xs text-muted-foreground">Poner palabras precisas a lo que pasa</p>
          </div>
        </div>

        <div className="mt-5">
          <WeekStrip progressByDate={progressByDate} onSelectDay={(d) => navigate(`/calendario/${localDateStr(d)}`)} />
        </div>
      </div>

      <div className="mt-6 px-5">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-muted-foreground">Práctica</div>
        <div className="space-y-2">
          {(Object.keys(SUB) as SubMode[]).map((key) => {
            const item = SUB[key];
            const Icon = item.icon;
            const active = sub === key;
            return (
              <button
                key={key}
                onClick={() => setSub(key)}
                className={cn(
                  "w-full rounded-2xl border p-4 text-left flex items-start gap-3 transition",
                  active ? "border-[#A78BFA] bg-white shadow-sm" : "border-transparent bg-white/60"
                )}
              >
                <Icon size={20} className={active ? "text-[#A78BFA] mt-0.5" : "text-muted-foreground mt-0.5"} />
                <div className="flex-1">
                  <div className="font-display text-sm font-semibold text-[#101927]">{item.title}</div>
                  <div className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

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
                    music === t.id ? "border-[#A78BFA] bg-[#A78BFA]/5 text-[#101927]" : "border-transparent bg-[#FDFCFB] text-muted-foreground"
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
          renderActivity={({ onComplete, onAbort }) => {
            if (sub === "facts") return <HechosJuiciosView music={music} onComplete={onComplete} onAbort={onAbort} />;
            if (sub === "scan") return <EscanerNeutralView music={music} onComplete={onComplete} onAbort={onAbort} />;
            return <AnatomiaEmocionView music={music} voiceEnabled={voice} onComplete={onComplete} onAbort={onAbort} />;
          }}
        />
      )}
    </div>
  );
}

function ToggleRow({ icon: Icon, label, on, onChange }: { icon: any; label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!on)} className="flex w-full items-center justify-between py-2">
      <div className="flex items-center gap-2"><Icon size={16} className="text-muted-foreground" /><span className="text-sm">{label}</span></div>
      <div className={cn("relative h-6 w-10 rounded-full transition", on ? "bg-[#A78BFA]" : "bg-black/15")}>
        <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", on ? "left-[18px]" : "left-0.5")} />
      </div>
    </button>
  );
}
