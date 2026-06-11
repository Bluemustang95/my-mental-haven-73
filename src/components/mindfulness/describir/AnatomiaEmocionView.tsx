import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Heart } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { toast } from "@/hooks/use-toast";

interface Props {
  music: MusicTrack;
  voiceEnabled: boolean;
  onComplete: () => void;
  onAbort: () => void;
}

const EMOTIONS = [
  { id: "ansiedad", label: "Ansiedad", color: "#F59E0B" },
  { id: "tristeza", label: "Tristeza", color: "#60A5FA" },
  { id: "enojo", label: "Enojo", color: "#F87171" },
  { id: "miedo", label: "Miedo", color: "#A78BFA" },
  { id: "vergüenza", label: "Vergüenza", color: "#F472B6" },
  { id: "calma", label: "Calma", color: "#34D399" },
];

const PARTS = [
  { id: "head", label: "Cabeza", cx: 100, cy: 30, rx: 18, ry: 22 },
  { id: "neck", label: "Cuello", cx: 100, cy: 60, rx: 10, ry: 9 },
  { id: "chest", label: "Pecho", cx: 100, cy: 95, rx: 30, ry: 22 },
  { id: "stomach", label: "Estómago", cx: 100, cy: 130, rx: 26, ry: 18 },
  { id: "shoulders", label: "Hombros", cx: 100, cy: 78, rx: 42, ry: 8 },
  { id: "arms", label: "Brazos", cx: 100, cy: 120, rx: 60, ry: 7 },
  { id: "pelvis", label: "Pelvis", cx: 100, cy: 160, rx: 26, ry: 14 },
  { id: "legs", label: "Piernas", cx: 100, cy: 220, rx: 36, ry: 35 },
];

type Step = "emotion" | "location" | "intensity" | "note";

export function AnatomiaEmocionView({ music, voiceEnabled, onComplete }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState<Step>("emotion");
  const [emotion, setEmotion] = useState<typeof EMOTIONS[number] | null>(null);
  const [parts, setParts] = useState<string[]>([]);
  const [intensity, setIntensity] = useState(5);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const audio = useMindfulAudio();
  useEffect(() => {
    audio.playMusic(music);
    return () => { audio.stopMusic(); audio.stopSpeech(); };
  }, [music]);

  useEffect(() => {
    if (!voiceEnabled) return;
    const lines: Record<Step, string> = {
      emotion: "Elegí la emoción que estás explorando ahora.",
      location: "¿Dónde, en tu cuerpo, sentís esa emoción? Tocá las zonas.",
      intensity: "¿Qué tan intensa es la sensación, del cero al diez?",
      note: "Si querés, describí la sensación. Punzante, opresiva, cálida.",
    };
    audio.speak(lines[step]);
  }, [step, voiceEnabled]);

  function togglePart(id: string) {
    setParts((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function save() {
    if (!user || !emotion || parts.length === 0) return;
    setSaving(true);
    const rows = parts.map((p) => ({
      user_id: user.id,
      body_part: p,
      intensity,
      note: `${emotion.label}${note ? " · " + note : ""}`,
    }));
    const { error } = await supabase.from("body_map_entries").insert(rows);
    setSaving(false);
    if (error) {
      toast({ title: "No se pudo guardar el mapa", description: error.message, variant: "destructive" });
    }
    onComplete();
  }

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-12 pb-8 overflow-y-auto">
      <h2 className="font-display text-2xl font-semibold text-white">Anatomía de la emoción</h2>
      <p className="mt-1 text-sm text-white/60">Nombrar y ubicar la emoción la vuelve manejable.</p>

      <AnimatePresence mode="wait">
        {step === "emotion" && (
          <Frame key="e">
            <div className="grid grid-cols-2 gap-2">
              {EMOTIONS.map((e) => (
                <button
                  key={e.id}
                  onClick={() => { setEmotion(e); setStep("location"); }}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:bg-white/10"
                >
                  <div className="h-3 w-3 rounded-full" style={{ background: e.color }} />
                  <div className="mt-2 font-display text-base font-semibold text-white">{e.label}</div>
                </button>
              ))}
            </div>
          </Frame>
        )}

        {step === "location" && emotion && (
          <Frame key="l">
            <div className="flex items-center gap-2 text-xs text-white/60">
              <div className="h-2 w-2 rounded-full" style={{ background: emotion.color }} />
              {emotion.label}
            </div>
            <div className="flex justify-center">
              <svg viewBox="0 0 200 300" className="h-[340px] w-auto">
                <ellipse cx="100" cy="30" rx="20" ry="24" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                <line x1="100" y1="54" x2="100" y2="70" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                <ellipse cx="100" cy="110" rx="35" ry="45" fill="none" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                <line x1="65" y1="85" x2="35" y2="150" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                <line x1="135" y1="85" x2="165" y2="150" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                <line x1="85" y1="155" x2="80" y2="275" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                <line x1="115" y1="155" x2="120" y2="275" stroke="white" strokeOpacity="0.18" strokeWidth="1.5" />
                {PARTS.map((p) => {
                  const sel = parts.includes(p.id);
                  return (
                    <ellipse
                      key={p.id}
                      cx={p.cx} cy={p.cy} rx={p.rx} ry={p.ry}
                      onClick={() => togglePart(p.id)}
                      style={{ cursor: "pointer", transition: "all 0.2s" }}
                      fill={sel ? emotion.color : "rgba(255,255,255,0.04)"}
                      fillOpacity={sel ? 0.55 : 1}
                      stroke={sel ? emotion.color : "rgba(255,255,255,0.12)"}
                      strokeWidth={1.5}
                    />
                  );
                })}
              </svg>
            </div>
            {parts.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5">
                {parts.map((id) => (
                  <span key={id} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[11px] text-white/85">{PARTS.find((p) => p.id === id)?.label}</span>
                ))}
              </div>
            )}
            <button
              onClick={() => setStep("intensity")}
              disabled={parts.length === 0}
              className="mt-2 rounded-full bg-[#FB923C] py-4 font-display text-sm font-semibold text-[#0F172A] disabled:opacity-40"
            >
              Continuar
            </button>
          </Frame>
        )}

        {step === "intensity" && (
          <Frame key="i">
            <div className="text-center">
              <div className="font-display text-6xl font-bold tabular-nums" style={{ color: emotion?.color }}>{intensity}</div>
              <div className="mt-1 text-[10px] uppercase tracking-wider text-white/50">Intensidad</div>
            </div>
            <input
              type="range" min={0} max={10} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full accent-[#FB923C]"
              style={{ accentColor: emotion?.color }}
            />
            <button onClick={() => setStep("note")} className="rounded-full bg-[#FB923C] py-4 font-display text-sm font-semibold text-[#0F172A]">
              Continuar
            </button>
          </Frame>
        )}

        {step === "note" && (
          <Frame key="n">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="¿Cómo se siente? (opcional)"
              maxLength={200}
              className="min-h-[120px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-serif text-sm text-white placeholder:text-white/30 focus:border-[#FB923C] focus:outline-none"
            />
            <button
              onClick={save}
              disabled={saving}
              className="rounded-full bg-[#FB923C] py-4 font-display text-sm font-semibold text-[#0F172A] disabled:opacity-50"
            >
              {saving ? "Guardando…" : "Guardar mapa"}
            </button>
          </Frame>
        )}
      </AnimatePresence>
    </div>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.25 }}
      className="mt-6 flex flex-col gap-5"
    >
      {children}
    </motion.div>
  );
}
