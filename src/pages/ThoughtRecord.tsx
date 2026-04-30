import { useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import HistoryPanel from "@/components/journal/HistoryPanel";
import { useConsistentBack } from "@/hooks/useConsistentBack";
import { useNavigate } from "react-router-dom";

const steps = [
  { key: "situation", label: "Situación", placeholder: "¿Qué pasó? Describí el contexto brevemente.", field: "textarea" },
  { key: "automatic_thought", label: "Pensamiento automático", placeholder: "¿Qué pensaste en ese momento?", field: "textarea" },
  { key: "emotion", label: "Emoción", placeholder: "¿Qué emoción sentiste? (ej: ansiedad, tristeza, enojo)", field: "input" },
  { key: "emotion_intensity", label: "Intensidad de la emoción", placeholder: "", field: "slider" },
  { key: "evidence_for", label: "Evidencia a favor", placeholder: "¿Qué datos respaldan ese pensamiento?", field: "textarea" },
  { key: "evidence_against", label: "Evidencia en contra", placeholder: "¿Qué datos contradicen ese pensamiento?", field: "textarea" },
  { key: "alternative_thought", label: "Pensamiento alternativo", placeholder: "¿Hay una forma más equilibrada de verlo?", field: "textarea" },
  { key: "new_emotion", label: "Nueva emoción", placeholder: "¿Qué sentís ahora con esta nueva perspectiva?", field: "input" },
  { key: "new_emotion_intensity", label: "Nueva intensidad", placeholder: "", field: "slider" },
];

export default function ThoughtRecord() {
  const navigate = useNavigate();
  const goBack = useConsistentBack("/diario/herramientas");
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Record<string, string | number>>({
    emotion_intensity: 5,
    new_emotion_intensity: 5,
  });
  const [saved, setSaved] = useState(false);

  const current = steps[step];
  const value = data[current.key] ?? "";

  const update = (val: string | number) => setData({ ...data, [current.key]: val });

  const canNext = () => {
    if (current.field === "slider") return true;
    return typeof value === "string" && value.trim().length > 0;
  };

  const save = () => {
    setSaved(true);
    setTimeout(() => goBack(), 1500);
  };

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-resource-psycho-bg px-5 text-resource-psycho-accent safe-area-top">
        <div className="text-center">
          <p className="font-mindful text-2xl">Registro guardado ✓</p>
          <p className="mt-1 font-sans text-xs text-resource-psycho-accent/65">Buen trabajo explorando tus pensamientos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-resource-psycho-bg px-5 pt-14 pb-4 text-resource-psycho-accent safe-area-top">
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => (step > 0 ? setStep(step - 1) : goBack())} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-psycho-accent/15 bg-card/75 text-resource-psycho-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-2xl leading-tight">Pensamientos</h1>
          <p className="font-sans text-xs leading-5 text-resource-psycho-accent/65">Reestructurá con perspectiva</p>
        </div>
        <HistoryPanel<{ id: string; created_at: string | null; situation: string; automatic_thought: string | null; emotion: string | null; emotion_intensity: number | null; evidence_for: string | null; evidence_against: string | null; alternative_thought: string | null; new_emotion: string | null; new_emotion_intensity: number | null }>
          tableName="thought_records"
          renderItem={(item) => (
            <div>
              <p className="text-xs font-medium text-foreground truncate">{item.situation.slice(0, 50)}</p>
              {item.emotion && <p className="text-[11px] text-muted-foreground">{item.emotion}</p>}
            </div>
          )}
          renderDetail={(item) => (
            <div className="space-y-3">
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Situación</p>
                <p className="text-sm font-body">{item.situation}</p>
              </div>
              {item.automatic_thought && (
                <div><p className="font-display text-xs text-muted-foreground mb-1">Pensamiento automático</p><p className="text-sm font-body">{item.automatic_thought}</p></div>
              )}
              {item.emotion && (
                <div><p className="font-display text-xs text-muted-foreground mb-1">Emoción ({item.emotion_intensity}/10)</p><p className="text-sm font-body">{item.emotion}</p></div>
              )}
              {item.evidence_for && (<div><p className="font-display text-xs text-muted-foreground mb-1">Evidencia a favor</p><p className="text-sm font-body">{item.evidence_for}</p></div>)}
              {item.evidence_against && (<div><p className="font-display text-xs text-muted-foreground mb-1">Evidencia en contra</p><p className="text-sm font-body">{item.evidence_against}</p></div>)}
              {item.alternative_thought && (<div><p className="font-display text-xs text-muted-foreground mb-1">Pensamiento alternativo</p><p className="text-sm font-body">{item.alternative_thought}</p></div>)}
              {item.new_emotion && (<div><p className="font-display text-xs text-muted-foreground mb-1">Nueva emoción ({item.new_emotion_intensity}/10)</p><p className="text-sm font-body">{item.new_emotion}</p></div>)}
            </div>
          )}
        />
      </div>

      <div className="mb-6 flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-resource-psycho-accent" : "bg-resource-psycho-accent/15")} />
        ))}
      </div>

      <div className="flex-1">
        <h2 className="mb-1 font-mindful text-xl">{current.label}</h2>
        <p className="mb-4 font-sans text-xs text-resource-psycho-accent/65">Paso {step + 1} de {steps.length}</p>

        {current.field === "textarea" && (
          <textarea
            value={value as string}
            onChange={(e) => update(e.target.value)}
            placeholder={current.placeholder}
            autoFocus
            className="min-h-[140px] w-full resize-none rounded-2xl border border-resource-psycho-accent/15 bg-card/75 p-4 font-sans text-sm leading-relaxed text-resource-psycho-accent placeholder:text-resource-psycho-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-psycho-accent/20"
          />
        )}

        {current.field === "input" && (
          <input
            type="text"
            value={value as string}
            onChange={(e) => update(e.target.value)}
            placeholder={current.placeholder}
            autoFocus
            className="w-full rounded-2xl border border-resource-psycho-accent/15 bg-card/75 p-4 font-sans text-sm text-resource-psycho-accent placeholder:text-resource-psycho-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-psycho-accent/20"
          />
        )}

        {current.field === "slider" && (
          <div className="mt-4">
            <div className="mb-4 text-center font-mindful text-5xl">{value || 5}</div>
            <input
              type="range"
              min="1"
              max="10"
              value={(value as number) || 5}
              onChange={(e) => update(parseInt(e.target.value))}
              className="w-full accent-resource-psycho-accent"
            />
            <div className="mt-2 flex justify-between font-display text-[10px] text-resource-psycho-accent/65">
              <span>Baja</span>
              <span>Alta</span>
            </div>
          </div>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          onClick={() => (step > 0 ? setStep(step - 1) : goBack())}
          className="font-display text-sm font-semibold text-resource-psycho-accent/70"
        >
          Atrás
        </button>
        <button
          onClick={() => (step < steps.length - 1 ? setStep(step + 1) : save())}
          disabled={!canNext()}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-6 py-2.5 font-display text-sm font-semibold transition-all",
            canNext() ? "bg-resource-psycho-accent text-primary-foreground active:scale-95" : "bg-card/55 text-resource-psycho-accent/45"
          )}
        >
          {step === steps.length - 1 ? "Guardar" : "Siguiente"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
