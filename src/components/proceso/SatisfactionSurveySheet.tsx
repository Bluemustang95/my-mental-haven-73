import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Sparkles, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onClose: () => void;
  onCompleted: () => void;
  onDismiss: () => void;
  previewMode?: boolean;
}

const NOT_STARTED_REASONS = [
  "El profesional no se contactó",
  "Tema económico",
  "Horarios no compatibles",
  "Ya no lo necesito / cambié de opinión",
];

const SESSION_OPTIONS = ["0", "1", "2-3", "4+"];
const MODALITY_OPTIONS = ["Sí, la que pedí", "No coincidió", "Cambió y está bien"];

export function SatisfactionSurveySheet({ open, onClose, onCompleted, onDismiss, previewMode = false }: Props) {
  const { user } = useAuth();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [startedTreatment, setStartedTreatment] = useState<boolean | null>(null);
  const [contacted24h, setContacted24h] = useState<boolean | null>(null);
  const [sessionsCount, setSessionsCount] = useState<string>("");
  const [bondRating, setBondRating] = useState<number>(0);
  const [modalityMatch, setModalityMatch] = useState<string>("");
  const [npsScore, setNpsScore] = useState<number>(-1);
  const [reasons, setReasons] = useState<string[]>([]);
  const [otherReason, setOtherReason] = useState("");
  const [finalNps, setFinalNps] = useState<number>(-1);
  const [comment, setComment] = useState("");

  const toggleReason = (r: string) =>
    setReasons((arr) => (arr.includes(r) ? arr.filter((x) => x !== r) : [...arr, r]));

  const handleSave = async () => {
    if (previewMode) {
      toast.message("Modo preview: respuestas no guardadas.");
      setStep(99);
      onCompleted();
      return;
    }
    if (!user) return;
    setSubmitting(true);
    const { error } = await supabase.from("therapy_satisfaction_surveys").insert({
      user_id: user.id,
      started_treatment: startedTreatment,
      contacted_in_24h: startedTreatment ? contacted24h : null,
      sessions_count: startedTreatment ? sessionsCount || null : null,
      bond_rating: startedTreatment && bondRating > 0 ? bondRating : null,
      modality_match: startedTreatment ? modalityMatch || null : null,
      nps_score: startedTreatment && npsScore >= 0 ? npsScore : null,
      not_started_reasons: !startedTreatment ? reasons : null,
      other_reason: !startedTreatment ? otherReason || null : null,
      final_nps: finalNps >= 0 ? finalNps : null,
      comment: comment || null,
      completed_at: new Date().toISOString(),
    });
    if (error) {
      toast.error("No pudimos guardar. Intentá de nuevo.");
      setSubmitting(false);
      return;
    }
    await supabase
      .from("patient_app_profiles")
      .update({ satisfaction_survey_completed_at: new Date().toISOString() })
      .eq("user_id", user.id);
    setSubmitting(false);
    setStep(99);
    onCompleted();
  };

  const handleDismiss = async () => {
    if (!previewMode && user) {
      await supabase
        .from("patient_app_profiles")
        .update({ satisfaction_survey_dismissed_at: new Date().toISOString() })
        .eq("user_id", user.id);
    }
    onDismiss();
    onClose();
  };

  // Step navigation
  const next = () => setStep((s) => s + 1);

  // Compute step sequence:
  // 0: started? → if yes [1..5] → 6 (final NPS) → 7 (closing)
  //              if no [10,11] → 6 → 7
  const renderStep = () => {
    if (step === 0) {
      return (
        <StepCard title="¿Pudiste comenzar tratamiento?" subtitle="Tu respuesta nos ayuda a mejorar.">
          <div className="grid grid-cols-2 gap-3">
            <Choice label="Sí" active={startedTreatment === true} onClick={() => { setStartedTreatment(true); setStep(1); }} />
            <Choice label="No" active={startedTreatment === false} onClick={() => { setStartedTreatment(false); setStep(10); }} />
          </div>
        </StepCard>
      );
    }

    // SI path
    if (step === 1) {
      return (
        <StepCard title="¿Se contactó dentro de las 24 hs hábiles?">
          <div className="grid grid-cols-2 gap-3">
            <Choice label="Sí" active={contacted24h === true} onClick={() => { setContacted24h(true); next(); }} />
            <Choice label="No" active={contacted24h === false} onClick={() => { setContacted24h(false); next(); }} />
          </div>
        </StepCard>
      );
    }
    if (step === 2) {
      return (
        <StepCard title="¿Cuántas sesiones tuviste?">
          <div className="grid grid-cols-4 gap-2">
            {SESSION_OPTIONS.map((s) => (
              <Choice key={s} label={s} active={sessionsCount === s} onClick={() => { setSessionsCount(s); next(); }} />
            ))}
          </div>
        </StepCard>
      );
    }
    if (step === 3) {
      return (
        <StepCard title="¿Cómo te sentís con el profesional?" subtitle="1 = poco cómodo · 5 = excelente vínculo">
          <div className="flex justify-between gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => { setBondRating(n); next(); }}
                className={`h-14 w-14 rounded-2xl font-display text-lg font-bold transition ${
                  bondRating === n ? "bg-[#101927] text-white" : "border border-foreground/15 bg-white text-foreground/70"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </StepCard>
      );
    }
    if (step === 4) {
      return (
        <StepCard title="¿La modalidad fue la que pediste?">
          <div className="space-y-2">
            {MODALITY_OPTIONS.map((m) => (
              <Choice key={m} label={m} active={modalityMatch === m} onClick={() => { setModalityMatch(m); next(); }} fullWidth />
            ))}
          </div>
        </StepCard>
      );
    }
    if (step === 5) {
      return (
        <StepCard title="¿Recomendarías RESMA?" subtitle="0 = no recomendaría · 10 = la recomiendo siempre">
          <NpsScale value={npsScore} onSelect={(n) => { setNpsScore(n); setStep(6); }} />
        </StepCard>
      );
    }

    // NO path
    if (step === 10) {
      return (
        <StepCard title="¿Por qué no pudiste iniciar?" subtitle="Podés elegir más de uno.">
          <div className="space-y-2">
            {NOT_STARTED_REASONS.map((r) => (
              <button
                key={r}
                onClick={() => toggleReason(r)}
                className={`w-full rounded-2xl px-4 py-3 text-left text-sm font-semibold transition ${
                  reasons.includes(r) ? "bg-[#101927] text-white" : "border border-foreground/15 bg-white text-foreground/70"
                }`}
              >
                {r}
              </button>
            ))}
            <textarea
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
              placeholder="Otro motivo (opcional)"
              rows={2}
              className="w-full resize-none rounded-2xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#7cc2c8]"
            />
            <button
              onClick={() => setStep(6)}
              disabled={reasons.length === 0 && !otherReason.trim()}
              className="mt-1 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-3 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
            >
              Continuar <ArrowRight size={16} />
            </button>
          </div>
        </StepCard>
      );
    }

    // Final NPS + comment (común)
    if (step === 6) {
      return (
        <StepCard title="¿Cómo clasificás el servicio de RESMA?" subtitle="0 = pésimo · 10 = excelente">
          <NpsScale value={finalNps} onSelect={setFinalNps} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Dejanos un comentario (opcional)"
            rows={3}
            className="mt-4 w-full resize-none rounded-2xl border border-foreground/15 bg-white px-4 py-3 text-sm outline-none focus:border-[#7cc2c8]"
          />
          <button
            onClick={handleSave}
            disabled={submitting || finalNps < 0}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : "Enviar respuestas"}
          </button>
        </StepCard>
      );
    }

    // Closing
    return (
      <div className="text-center py-4">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
          <Sparkles size={28} />
        </div>
        <h2 className="font-display text-xl font-bold text-foreground">¡Gracias!</h2>
        <p className="mt-2 px-2 text-sm leading-relaxed text-foreground/70">
          Tu respuesta nos ayuda a mejorar el servicio.
          Si querés contactarte nuevamente con nosotros, podés hacerlo cuando lo desees.
        </p>
        <button
          onClick={onClose}
          className="mt-6 w-full rounded-2xl bg-[#101927] py-3.5 text-sm font-bold text-white transition active:scale-[0.98]"
        >
          Cerrar
        </button>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center"
          onClick={handleDismiss}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[32px] border border-white/60 bg-white/95 p-6 backdrop-blur-2xl sm:rounded-[32px]"
          >
            <button
              onClick={handleDismiss}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-foreground/60"
            >
              <X size={18} />
            </button>
            {renderStep()}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function StepCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold uppercase tracking-wider text-[#0e8a92]">Encuesta de experiencia</p>
      <h2 className="mt-1 font-display text-xl font-bold text-foreground">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-foreground/65">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function Choice({ label, active, onClick, fullWidth }: { label: string; active: boolean; onClick: () => void; fullWidth?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`${fullWidth ? "w-full" : ""} rounded-2xl px-4 py-4 text-sm font-bold transition active:scale-[0.98] ${
        active ? "bg-[#101927] text-white" : "border border-foreground/15 bg-white text-foreground/70"
      }`}
    >
      {label}
    </button>
  );
}

function NpsScale({ value, onSelect }: { value: number; onSelect: (n: number) => void }) {
  return (
    <div className="grid grid-cols-11 gap-1">
      {Array.from({ length: 11 }, (_, i) => (
        <button
          key={i}
          onClick={() => onSelect(i)}
          className={`h-10 rounded-lg text-xs font-bold transition ${
            value === i ? "bg-[#101927] text-white" : "border border-foreground/15 bg-white text-foreground/70"
          }`}
        >
          {i}
        </button>
      ))}
    </div>
  );
}
