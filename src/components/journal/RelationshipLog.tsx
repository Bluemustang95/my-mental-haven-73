import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConsistentBack } from "@/hooks/useConsistentBack";

const emotionOptions = [
  "Frustración", "Tristeza", "Enojo", "Soledad",
  "Alegría", "Gratitud", "Confusión", "Culpa",
];

export default function RelationshipLog() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useConsistentBack("/diario/herramientas");
  const { user } = useAuth();
  const [person, setPerson] = useState("");
  const [whatHappened, setWhatHappened] = useState("");
  const [whatIWished, setWhatIWished] = useState("");
  const [emotion, setEmotion] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !person.trim() || !whatHappened.trim()) return;
    setSaving(true);
    try {
      await supabase.from("relationship_logs").insert({
        user_id: user.id,
        person: person.trim().slice(0, 100),
        what_happened: whatHappened.trim().slice(0, 1000),
        what_i_wished: whatIWished.trim().slice(0, 1000) || null,
        emotion: emotion || null,
      });
      toast.success("Registro guardado");
      goBack();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const canSave = person.trim() && whatHappened.trim();

  return (
    <div className="flex min-h-screen flex-col bg-resource-mindfulness-bg px-5 pt-14 pb-4 text-resource-mindfulness-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-mindfulness-accent/15 bg-card/75 text-resource-mindfulness-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Vínculos</h1>
          <p className="font-sans text-xs leading-5 text-resource-mindfulness-accent/65">Registrá una interacción importante</p>
        </div>
        <button
          onClick={() => navigate("/diario/vinculos/historial", { state: location.state })}
          className="flex items-center gap-1.5 rounded-full border border-resource-mindfulness-accent/15 bg-card/75 px-3 py-1.5 font-display text-[11px] font-semibold text-resource-mindfulness-accent shadow-sm transition-all active:scale-95"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <div className="flex-1 space-y-5">
        <div>
          <label className="mb-1.5 block font-display text-sm font-semibold text-resource-mindfulness-accent">¿Con quién fue?</label>
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Nombre o relación (ej. mamá, amigo)"
            maxLength={100}
            className="w-full rounded-2xl border border-resource-mindfulness-accent/15 bg-card/75 p-3.5 font-sans text-sm text-resource-mindfulness-accent placeholder:text-resource-mindfulness-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-mindfulness-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-display text-sm font-semibold text-resource-mindfulness-accent">¿Qué pasó?</label>
          <textarea
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            placeholder="Describí la interacción..."
            maxLength={1000}
            rows={4}
            className="w-full resize-none rounded-2xl border border-resource-mindfulness-accent/15 bg-card/75 p-3.5 font-sans text-sm leading-relaxed text-resource-mindfulness-accent placeholder:text-resource-mindfulness-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-mindfulness-accent/20"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-display text-sm font-semibold text-resource-mindfulness-accent">¿Qué me hubiera gustado decir?</label>
          <textarea
            value={whatIWished}
            onChange={(e) => setWhatIWished(e.target.value)}
            placeholder="Lo que quedó sin expresar... (opcional)"
            maxLength={1000}
            rows={3}
            className="w-full resize-none rounded-2xl border border-resource-mindfulness-accent/15 bg-card/75 p-3.5 font-sans text-sm leading-relaxed text-resource-mindfulness-accent placeholder:text-resource-mindfulness-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-mindfulness-accent/20"
          />
        </div>

        <div>
          <label className="mb-2 block font-display text-sm font-semibold text-resource-mindfulness-accent">¿Qué emoción predominó?</label>
          <div className="flex flex-wrap gap-1.5">
            {emotionOptions.map((e) => (
              <button
                key={e}
                onClick={() => setEmotion(emotion === e ? "" : e)}
                className={cn(
                  "rounded-full border px-3 py-1 font-display text-[11px] font-semibold transition-all",
                  emotion === e
                    ? "border-resource-mindfulness-accent bg-resource-mindfulness-accent/15 text-resource-mindfulness-accent"
                    : "border-resource-mindfulness-accent/20 bg-card/55 text-resource-mindfulness-accent/70"
                )}
              >
                {e}
              </button>
            ))}
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={!canSave || saving}
        className={cn(
          "mt-4 w-full rounded-2xl py-3 font-display text-sm font-semibold transition-all",
          canSave ? "bg-resource-mindfulness-accent text-primary-foreground active:scale-[0.98]" : "bg-card/55 text-resource-mindfulness-accent/45"
        )}
      >
        {saving ? "Guardando..." : "Guardar registro"}
      </button>
    </div>
  );
}
