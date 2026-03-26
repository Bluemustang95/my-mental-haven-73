import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

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
    // TODO: save to Supabase thought_records
    setSaved(true);
    setTimeout(() => navigate("/diario"), 1500);
  };

  if (saved) {
    return (
      <div className="flex min-h-screen items-center justify-center px-5 safe-area-top">
        <div className="text-center">
          <p className="font-display text-sm font-medium text-success">Registro guardado ✓</p>
          <p className="mt-1 text-xs text-muted-foreground">Buen trabajo explorando tus pensamientos.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      {/* Header */}
      <div className="mb-4 flex items-center gap-3">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold">Registro de Pensamientos</h1>
      </div>

      {/* Progress */}
      <div className="mb-6 flex gap-1">
        {steps.map((_, i) => (
          <div key={i} className={cn("h-1 flex-1 rounded-full transition-colors", i <= step ? "bg-accent" : "bg-border")} />
        ))}
      </div>

      {/* Step content */}
      <div className="flex-1">
        <h2 className="mb-1 font-display text-base font-medium">{current.label}</h2>
        <p className="mb-4 text-xs text-muted-foreground">Paso {step + 1} de {steps.length}</p>

        {current.field === "textarea" && (
          <textarea
            value={value as string}
            onChange={(e) => update(e.target.value)}
            placeholder={current.placeholder}
            className="min-h-[140px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm font-body leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        )}

        {current.field === "input" && (
          <input
            type="text"
            value={value as string}
            onChange={(e) => update(e.target.value)}
            placeholder={current.placeholder}
            className="w-full rounded-2xl border border-border bg-card p-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            autoFocus
          />
        )}

        {current.field === "slider" && (
          <div className="mt-4">
            <div className="mb-4 text-center font-display text-4xl font-light">{value || 5}</div>
            <input
              type="range"
              min="1"
              max="10"
              value={value as number || 5}
              onChange={(e) => update(parseInt(e.target.value))}
              className="w-full accent-accent"
            />
            <div className="mt-2 flex justify-between text-[10px] text-muted-foreground font-display">
              <span>Baja</span>
              <span>Alta</span>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : navigate("/diario")}
          className="font-display text-sm text-muted-foreground"
        >
          Atrás
        </button>
        <button
          onClick={() => step < steps.length - 1 ? setStep(step + 1) : save()}
          disabled={!canNext()}
          className={cn(
            "flex items-center gap-2 rounded-2xl px-6 py-2.5 font-display text-sm font-medium transition-all",
            canNext() ? "bg-primary text-primary-foreground active:scale-95" : "bg-muted text-muted-foreground"
          )}
        >
          {step === steps.length - 1 ? "Guardar" : "Siguiente"}
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
}
