import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { PsychoCard } from "./PsychoCard";
import { toast } from "@/hooks/use-toast";

type Phase = "active" | "summary";

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

const DRAFT_KEY = "mindfulness-current-draft";
const TAKEAWAY_CHIPS = ["calma", "claridad", "presencia", "ninguna"];

export function ExerciseShell({ meta, renderActivity, onExit }: Props) {
  const { user } = useAuth();
  const [phase, setPhase] = useState<Phase>("active");
  const [takeaway, setTakeaway] = useState("");

  // Persist a lightweight draft while the exercise is active so the Hub
  // can show "sesiones abiertas" if the user leaves mid-practice.
  useEffect(() => {
    if (phase !== "active") return;
    try {
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({
          exerciseType: meta.exerciseType,
          exerciseName: meta.exerciseName,
          resourceKey: meta.resourceKey,
          subMode: meta.subMode ?? null,
          returnPath: window.location.pathname,
          startedAt: Date.now(),
        })
      );
    } catch {}
  }, [phase, meta.exerciseType, meta.exerciseName, meta.resourceKey, meta.subMode]);

  const clearDraft = () => {
    try { localStorage.removeItem(DRAFT_KEY); } catch {}
  };

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

  async function save() {
    clearDraft();
    if (!user) { onExit(); return; }
    const { error } = await supabase.from("exercise_sessions").insert({
      user_id: user.id,
      exercise_type: meta.exerciseType,
      exercise_name: meta.exerciseName,
      duration_seconds: meta.durationSeconds ?? null,
      mood_before: null,
      mood_after: null,
      sub_mode: meta.subMode ?? null,
      pattern: meta.pattern ?? null,
      voice_enabled: meta.voiceEnabled ?? false,
      music_track: meta.musicTrack ?? null,
      takeaway: takeaway.trim() || null,
      completed: true,
    } as any);
    if (error) {
      toast({ title: "No se pudo guardar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Sesión guardada ✓" });
    }
    onExit();
  }

  const handleExit = () => {
    clearDraft();
    onExit();
  };

  return (
    <div className="fixed inset-0 z-[100] bg-[#0F172A] text-white overflow-hidden">
      {phase === "active" && renderActivity({
        onComplete: () => setPhase("summary"),
        onAbort: () => handleExit(),
      })}

      <AnimatePresence>
        {phase === "summary" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 flex flex-col px-5 pt-12 pb-8 overflow-y-auto">
            <button onClick={handleExit} className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10" aria-label="Cerrar">
              <X size={18} />
            </button>
            <h1 className="font-display text-3xl font-bold">Tu sesión</h1>
            <p className="mt-1 text-sm text-white/60">{meta.exerciseName}</p>

            <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="font-serif text-lg text-white/90">¿Qué te llevás de esta práctica?</p>
              <p className="mt-1 text-xs text-white/55">Opcional. Una palabra alcanza.</p>

              <div className="mt-3 flex flex-wrap gap-2">
                {TAKEAWAY_CHIPS.map((chip) => {
                  const active = takeaway.trim().toLowerCase() === chip;
                  return (
                    <button
                      key={chip}
                      onClick={() => setTakeaway(active ? "" : chip)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        active ? "bg-[#FB923C] text-[#0F172A]" : "bg-white/10 text-white/75"
                      }`}
                    >
                      {chip}
                    </button>
                  );
                })}
              </div>

              <input
                value={takeaway}
                onChange={(e) => setTakeaway(e.target.value)}
                placeholder="O escribí lo tuyo…"
                maxLength={80}
                className="mt-3 w-full rounded-xl bg-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:bg-white/15"
              />
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
