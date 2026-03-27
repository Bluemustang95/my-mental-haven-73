import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HistoryPanel from "./HistoryPanel";

const emotionOptions = [
  "Frustración", "Tristeza", "Enojo", "Soledad",
  "Alegría", "Gratitud", "Confusión", "Culpa",
];

export default function RelationshipLog() {
  const navigate = useNavigate();
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
      navigate("/diario");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const canSave = person.trim() && whatHappened.trim();

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">Vínculos</h1>
        <HistoryPanel<{ id: string; created_at: string | null; person: string; what_happened: string | null; what_i_wished: string | null; emotion: string | null }>
          tableName="relationship_logs"
          renderItem={(item) => (
            <div>
              <p className="text-xs font-medium text-foreground">{item.person}</p>
              <p className="text-[11px] text-muted-foreground truncate">{item.what_happened || ""}</p>
            </div>
          )}
          renderDetail={(item) => (
            <div className="space-y-3">
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Persona</p>
                <p className="text-sm font-body font-medium">{item.person}</p>
              </div>
              {item.what_happened && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">¿Qué pasó?</p>
                  <p className="text-sm font-body whitespace-pre-wrap">{item.what_happened}</p>
                </div>
              )}
              {item.what_i_wished && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">¿Qué me hubiera gustado decir?</p>
                  <p className="text-sm font-body whitespace-pre-wrap">{item.what_i_wished}</p>
                </div>
              )}
              {item.emotion && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Emoción</p>
                  <span className="rounded-full border border-accent bg-accent/10 px-2.5 py-0.5 font-display text-[11px] text-accent-foreground">{item.emotion}</span>
                </div>
              )}
            </div>
          )}
        />
      </div>

      <div className="flex-1 space-y-5">
        <div>
          <label className="mb-1.5 block font-display text-sm font-medium">¿Con quién fue?</label>
          <input
            value={person}
            onChange={(e) => setPerson(e.target.value)}
            placeholder="Nombre o relación (ej. mamá, amigo)"
            maxLength={100}
            className="w-full rounded-2xl border border-border bg-card p-3.5 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-display text-sm font-medium">¿Qué pasó?</label>
          <textarea
            value={whatHappened}
            onChange={(e) => setWhatHappened(e.target.value)}
            placeholder="Describí la interacción..."
            maxLength={1000}
            className="w-full resize-none rounded-2xl border border-border bg-card p-3.5 text-sm font-body leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={4}
          />
        </div>

        <div>
          <label className="mb-1.5 block font-display text-sm font-medium">¿Qué me hubiera gustado decir?</label>
          <textarea
            value={whatIWished}
            onChange={(e) => setWhatIWished(e.target.value)}
            placeholder="Lo que quedó sin expresar... (opcional)"
            maxLength={1000}
            className="w-full resize-none rounded-2xl border border-border bg-card p-3.5 text-sm font-body leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
        </div>

        <div>
          <label className="mb-2 block font-display text-sm font-medium">¿Qué emoción predominó?</label>
          <div className="flex flex-wrap gap-1.5">
            {emotionOptions.map((e) => (
              <button
                key={e}
                onClick={() => setEmotion(emotion === e ? "" : e)}
                className={cn(
                  "rounded-full border px-3 py-1 font-display text-[11px] transition-all",
                  emotion === e
                    ? "border-accent bg-accent/10 text-accent-foreground"
                    : "border-border text-muted-foreground"
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
          "mt-4 w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
          canSave ? "bg-primary text-primary-foreground active:scale-[0.98]" : "bg-muted text-muted-foreground"
        )}
      >
        {saving ? "Guardando..." : "Guardar registro"}
      </button>
    </div>
  );
}
