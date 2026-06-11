import { useEffect, useMemo, useState } from "react";
import { X, ArrowDown, ArrowUp, ArrowRight } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SudsSlider } from "./SudsSlider";
import { SessionSparkline } from "./SessionSparkline";
import { PsychoCard } from "./PsychoCard";
import { toast } from "@/hooks/use-toast";

type Phase = "pre" | "active" | "post" | "summary";

export interface ExerciseShellMeta {
  exerciseType: string;       // e.g. "mindfulness"
  exerciseName: string;       // e.g. "Respiración · Box 4-4-4-4"
  resourceKey: string;        // e.g. "mindfulness.breathing.box"
  subMode?: string;
  pattern?: string;
  voiceEnabled?: boolean;
  musicTrack?: string;
  durationSeconds?: number;
}

interface Props {
  meta: ExerciseShellMeta;
  /** Renders the actual exercise. Call `onComplete` when finished. */
  renderActivity: (api: { onComplete: () => void; onAbort: () => void }) => React.ReactNode;
  onExit: () => void;
}

export function ExerciseShell({ meta, renderActivity, onExit }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("pre");
  const [preScore, setPreScore] = useState<number | null>(null);
  const [postScore, setPostScore] = useState<number | null>(null);
  const [tempScore, setTempScore] = useState(5);
  const [history, setHistory] = useState<{ pre: number | null; post: number | null }[]>([]);

  // Block browser back during active exercise
  useEffect(() => {
    if (phase !== "active") return;
    const onPop = (e: PopStateEvent) => {
      e.preventDefault();
      window.history.pushState(null, "", window.location.href);
    };
    window.history.pushState(null, "", window.location.href);
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [phase]);

  // Load sparkline history when entering summary
  useEffect(() => {
    if (phase !== "summary" || !user) return;
    (async () => {
      const { data } = await supabase
        .from("exercise_sessions")
        .select("mood_before, mood_after, created_at")
        .eq("user_id", user.id)
        .eq("exercise_type", meta.exerciseType)
        .order("created_at", { ascending: false })
        .limit(5);
      const list = (data ?? []).reverse().map((r: any) => ({ pre: r.mood_before, post: r.mood_after }));
      setHistory(list);
    })();
  }, [phase, user, meta.exerciseType]);

  async function save() {
    if (!user) return;
    const { error } = await supabase.from("exercise_sessions").insert({
      user_id: user.id,
      exercise_type: meta.exerciseType,
      exercise_name: meta.exerciseName,
      duration_seconds: meta.durationSeconds ?? null,
      mood_before: preScore,
      mood_after: postScore,
      sub_mode: meta.subMode ?? null,
      pattern: meta.pattern ?? null,
      voice_enabled: meta.voiceEnabled ?? false,
      music_track: meta.musicTrack ?? null,
      completed: true,
    } as any);
    if (error) {
      toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sesión guardada ✓" });
    }
    onExit();
  }

  const delta = useMemo(() => {
    if (preScore == null || postScore == null) return null;
    return preScore - postScore;
  }, [preScore, postScore]);

  return (
    <div className="fixed inset-0 z-50 bg-[#0F172A] text-white overflow-hidden">
      {phase === "active" && renderActivity({
        onComplete: () => setPhase("post"),
        onAbort: () => onExit(),
      })}

      <AnimatePresence>
        {phase === "pre" && (
          <BottomSheet onClose={onExit}>
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold">Antes de empezar</h2>
              <p className="mt-2 text-sm text-white/65">¿Qué tan intenso sentís el malestar ahora mismo?</p>
            </div>
            <SudsSlider value={tempScore} onChange={setTempScore} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setPreScore(null); setPhase("active"); }} className="rounded-full bg-white/10 py-3 text-sm font-medium text-white/75">Omitir</button>
              <button onClick={() => { setPreScore(tempScore); setTempScore(5); setPhase("active"); }} className="rounded-full bg-[#FB923C] py-3 text-sm font-semibold text-[#0F172A]">Empezar</button>
            </div>
          </BottomSheet>
        )}

        {phase === "post" && (
          <BottomSheet onClose={() => setPhase("summary")}>
            <div className="text-center">
              <h2 className="font-display text-2xl font-semibold">¡Ejercicio completado!</h2>
              <p className="mt-2 text-sm text-white/65">¿Cómo te sentís ahora?</p>
            </div>
            <SudsSlider value={tempScore} onChange={setTempScore} />
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => { setPostScore(null); setPhase("summary"); }} className="rounded-full bg-white/10 py-3 text-sm font-medium text-white/75">Omitir</button>
              <button onClick={() => { setPostScore(tempScore); setPhase("summary"); }} className="rounded-full bg-[#FB923C] py-3 text-sm font-semibold text-[#0F172A]">Continuar</button>
            </div>
          </BottomSheet>
        )}

        {phase === "summary" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col px-5 pt-12 pb-8 overflow-y-auto">
            <button onClick={onExit} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Cerrar">
              <X size={18} />
            </button>
            <h1 className="font-display text-3xl font-bold">Tu sesión</h1>
            <p className="mt-1 text-sm text-white/60">{meta.exerciseName}</p>

            {preScore != null && postScore != null ? (
              <div className="mt-6 flex items-center justify-around rounded-3xl border border-white/10 bg-white/5 p-6">
                <ScoreCol label="Antes" value={preScore} color="#FB923C" />
                <DeltaArrow delta={delta!} />
                <ScoreCol label="Ahora" value={postScore} color="#60A5FA" />
              </div>
            ) : (
              <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-6 text-center text-sm text-white/55">
                Sesión completada. Próxima vez podés registrar tu malestar para ver tu progreso.
              </div>
            )}

            <div className="mt-4">
              <SessionSparkline data={history} current={{ pre: preScore, post: postScore }} />
            </div>

            <div className="mt-4">
              <PsychoCard resourceKey={meta.resourceKey} />
            </div>

            <button onClick={save} className="mt-auto pt-6 sticky bottom-0">
              <span className="block w-full rounded-full bg-[#FB923C] py-4 text-base font-semibold text-[#0F172A]">Finalizar y guardar</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BottomSheet({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 30, stiffness: 280 }}
      className="absolute inset-x-0 bottom-0 rounded-t-[2rem] bg-[#0F172A]/95 backdrop-blur-xl border-t border-white/10 px-5 pt-4 pb-8 max-h-[92vh] overflow-y-auto"
    >
      <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-white/20" />
      <button onClick={onClose} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10" aria-label="Cerrar">
        <X size={16} />
      </button>
      <div className="space-y-5">{children}</div>
    </motion.div>
  );
}

function ScoreCol({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="text-center">
      <div className="text-[10px] uppercase tracking-wider text-white/50">{label}</div>
      <div className="font-display text-5xl font-bold tabular-nums" style={{ color }}>{value}</div>
    </div>
  );
}

function DeltaArrow({ delta }: { delta: number }) {
  if (delta > 0) return <div className="flex flex-col items-center text-[#34C759]"><ArrowDown size={28} strokeWidth={2.5} /><span className="text-xs font-semibold">-{delta}</span></div>;
  if (delta < 0) return <div className="flex flex-col items-center text-[#F87171]"><ArrowUp size={28} strokeWidth={2.5} /><span className="text-xs font-semibold">+{Math.abs(delta)}</span></div>;
  return <div className="flex flex-col items-center text-[#F59E0B]"><ArrowRight size={28} strokeWidth={2.5} /><span className="text-xs font-semibold">igual</span></div>;
}
