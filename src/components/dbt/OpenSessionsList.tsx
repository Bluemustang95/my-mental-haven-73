import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Check, ArrowRight, Clock } from "lucide-react";
import { readDraft, draftHasProgress, type FlowState } from "@/hooks/useChangeResponseFlow";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

function stageLabel(s: FlowState["stage"]) {
  switch (s) {
    case "wizard8": return "Verificar los hechos";
    case "decision9": return "Mente Sabia";
    case "problem12": return "Resolver el problema";
    case "opposite10": return "Acción Opuesta";
    case "done": return "Finalizada";
  }
}

function relTime(ts: number) {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins} min`;
  const h = Math.round(mins / 60);
  if (h < 24) return `hace ${h} h`;
  const d = Math.round(h / 24);
  return `hace ${d} d`;
}

interface Props {
  onChanged?: () => void;
}

export function OpenSessionsList({ onChanged }: Props) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [draft, setDraft] = useState<FlowState | null>(null);
  const [open, setOpen] = useState(true);
  const [completing, setCompleting] = useState(false);

  useEffect(() => {
    const d = readDraft();
    if (d && draftHasProgress(d) && d.stage !== "done") setDraft(d);
    else setDraft(null);
  }, []);

  const hasOpen = !!draft;

  const markComplete = async () => {
    if (!user || !draft) return;
    setCompleting(true);
    try {
      const path =
        draft.stage === "problem12"
          ? "problem"
          : draft.stage === "opposite10"
          ? "opposite"
          : draft.fitsFacts && draft.isEffective
          ? "problem"
          : "opposite";
      const { error } = await supabase.from("dbt_emotion_sessions").insert({
        user_id: user.id,
        emotion: draft.selectedEmotion,
        event_description: draft.eventDescription,
        interpretations: draft.interpretations,
        threat: draft.threat,
        catastrophe_coping: draft.catastropheCoping,
        fits_facts: draft.fitsFacts,
        is_effective: draft.isEffective,
        path,
        problem_payload: path === "problem" ? draft.problem : null,
        opposite_payload: path === "opposite" ? draft.opposite : null,
      });
      if (error) throw error;
      localStorage.removeItem("dbt-change-response-draft");
      setDraft(null);
      toast.success("¡Sesión marcada como completada!");
      onChanged?.();
    } catch (e: any) {
      toast.error(e?.message || "No se pudo completar la sesión");
    } finally {
      setCompleting(false);
    }
  };

  if (!hasOpen) return null;

  return (
    <div className="rounded-2xl bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3"
      >
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[#facb60]" />
          <span className="font-display text-sm font-semibold text-[#101927]">
            Sesiones abiertas · 1
          </span>
        </div>
        <motion.div animate={{ rotate: open ? 180 : 0 }}>
          <ChevronDown size={18} className="text-[#101927]/60" />
        </motion.div>
      </button>

      <AnimatePresence initial={false}>
        {open && draft && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-1 space-y-3 border-t border-[#101927]/5">
              <div>
                <p className="font-display text-base font-bold text-[#101927]">
                  {draft.selectedEmotion ?? "Sesión sin emoción"}
                </p>
                <p className="text-[12px] text-muted-foreground mt-0.5">
                  Etapa: {stageLabel(draft.stage)}
                </p>
                {draft.updatedAt > 0 && (
                  <p className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground/80">
                    <Clock size={11} /> {relTime(draft.updatedAt)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => navigate("/herramientas/cambiar-respuestas")}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#101927] py-2.5 font-display text-[12px] font-semibold text-white active:scale-[0.97]"
                >
                  Continuar <ArrowRight size={14} />
                </button>
                <button
                  onClick={markComplete}
                  disabled={completing}
                  className="flex items-center justify-center gap-1 rounded-xl bg-[#7cc2c8] py-2.5 font-display text-[12px] font-semibold text-white active:scale-[0.97] disabled:opacity-50"
                >
                  <Check size={14} /> Ya lo hice
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
