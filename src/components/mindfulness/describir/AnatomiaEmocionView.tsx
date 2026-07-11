import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useMindfulAudio, type MusicTrack } from "@/hooks/useMindfulAudio";
import { useMindfulScript } from "@/hooks/useMindfulScript";
import { toast } from "@/hooks/use-toast";
import { ExerciseTopBar } from "@/components/exercises/ExerciseTopBar";

interface Props {
  music: MusicTrack;
  voiceEnabled: boolean;
  onComplete: () => void;
  onAbort: () => void;
}

const ACCENT = "#A78BFA";

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

const STEP_LABEL: Record<Step, string> = {
  emotion: "Paso 1 de 4 · Emoción",
  location: "Paso 2 de 4 · Ubicación",
  intensity: "Paso 3 de 4 · Intensidad",
  note: "Paso 4 de 4 · Sensación",
};

export function AnatomiaEmocionView({ music, voiceEnabled, onComplete, onAbort }: Props) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [music]);

  // Intro única al arrancar; después la interfaz habla por sí sola.
  const intro = useMindfulScript("anatomiaEmocion", { voiceEnabled, loopTimes: 0 });
  const introRef = useRef(false);
  useEffect(() => {
    if (!voiceEnabled || introRef.current) return;
    introRef.current = true;
    intro.start();
    return () => intro.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [voiceEnabled]);

  function togglePart(id: string) {
    setParts((p) => p.includes(id) ? p.filter((x) => x !== id) : [...p, id]);
  }

  async function save(alsoJournal = false) {
    if (!user || !emotion || parts.length === 0) return;
    setSaving(true);
    const rows = parts.map((p) => ({
      user_id: user.id,
      body_part: p,
      intensity,
      note: `${emotion.label}${note ? " · " + note : ""}`,
    }));
    const { error } = await supabase.from("body_map_entries").insert(rows);

    if (alsoJournal) {
      const zonas = parts
        .map((id) => PARTS.find((p) => p.id === id)?.label)
        .filter(Boolean)
        .join(", ");
      const content = `Anatomía de la emoción\n\nEmoción: ${emotion.label}\nIntensidad: ${intensity}/10\nDónde la siento: ${zonas}${note ? `\n\nSensación: ${note}` : ""}`;
      const today = new Date();
      const yyyy = today.getFullYear();
      const mm = String(today.getMonth() + 1).padStart(2, "0");
      const dd = String(today.getDate()).padStart(2, "0");
      const { error: jErr } = await supabase.from("journal_entries").insert({
        user_id: user.id,
        entry_date: `${yyyy}-${mm}-${dd}`,
        content,
        prompt: "Anatomía de la emoción",
        emotion_tags: [emotion.id],
      } as any);
      if (jErr) {
        toast({
          title: "Mapa guardado, pero no se pudo crear la entrada de Diario",
          description: jErr.message,
          variant: "destructive",
        });
      } else {
        toast({ title: "Guardado en tu Diario ✓" });
      }
    }

    setSaving(false);
    if (error) {
      toast({ title: "No se pudo guardar el mapa", description: error.message, variant: "destructive" });
    }
    onComplete();
  }

  const accent = emotion?.color ?? ACCENT;

  return (
    <div className="absolute inset-0 flex flex-col px-5 pt-12 pb-8 overflow-y-auto">
      <ExerciseTopBar
        title="Anatomía de la Emoción"
        subtitle={STEP_LABEL[step]}
        onAbort={onAbort}
      />

      <AnimatePresence mode="wait">
        {step === "emotion" && (
          <Frame key="e">
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold text-white">¿Qué emoción estás sintiendo?</h2>
              <p className="mt-1 text-sm text-white/55">Elegí la que más se acerque.</p>
            </div>
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
            <div className="flex items-center justify-center gap-2 text-xs text-white/60">
              <div className="h-2 w-2 rounded-full" style={{ background: emotion.color }} />
              {emotion.label}
            </div>
            <div className="flex justify-center">
              <svg viewBox="0 0 200 300" className="h-[320px] w-auto">
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
            <PrimaryBtn
              onClick={() => setStep("intensity")}
              disabled={parts.length === 0}
              accent={accent}
            >
              Continuar
            </PrimaryBtn>
          </Frame>
        )}

        {step === "intensity" && (
          <Frame key="i">
            <div className="text-center">
              <div className="font-display text-7xl font-bold tabular-nums" style={{ color: accent }}>{intensity}</div>
              <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-white/50">Intensidad</div>
            </div>
            <input
              type="range" min={0} max={10} value={intensity}
              onChange={(e) => setIntensity(Number(e.target.value))}
              className="w-full h-2"
              style={{ accentColor: accent }}
            />
            <div className="flex justify-between text-[10px] uppercase tracking-wider text-white/40">
              <span>Apenas</span>
              <span>Máximo</span>
            </div>
            <PrimaryBtn onClick={() => setStep("note")} accent={accent}>
              Continuar
            </PrimaryBtn>
          </Frame>
        )}

        {step === "note" && (
          <Frame key="n">
            <div className="text-center">
              <h2 className="font-serif text-2xl font-bold text-white">¿Cómo se siente?</h2>
              <p className="mt-1 text-sm text-white/55">Punzante, opresiva, cálida… (opcional)</p>
            </div>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Describí la sensación…"
              maxLength={200}
              className="min-h-[140px] w-full rounded-2xl border border-white/10 bg-white/5 p-4 font-serif text-sm text-white placeholder:text-white/30 focus:outline-none"
              style={{ borderColor: undefined }}
            />
            <PrimaryBtn onClick={() => save(false)} disabled={saving} accent={accent}>
              {saving ? "Guardando…" : "Guardar mapa"}
            </PrimaryBtn>
            <button
              onClick={() => save(true)}
              disabled={saving}
              className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 py-3 text-sm font-medium text-white/85 disabled:opacity-40"
            >
              Guardar y enviar al Diario
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

function PrimaryBtn({ children, onClick, disabled, accent }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; accent: string }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="mt-2 rounded-2xl py-4 font-display text-sm font-bold text-white disabled:opacity-40"
      style={{ background: accent, boxShadow: disabled ? undefined : `0 12px 30px ${accent}55` }}
    >
      {children}
    </button>
  );
}
