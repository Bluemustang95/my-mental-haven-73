import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import HistoryPanel from "./HistoryPanel";

export default function InternalDialogue() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [situation, setSituation] = useState("");
  const [critical, setCritical] = useState("");
  const [compassionate, setCompassionate] = useState("");
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user || !critical.trim() || !compassionate.trim()) return;
    setSaving(true);
    try {
      await supabase.from("internal_dialogues").insert({
        user_id: user.id,
        situation: situation.trim().slice(0, 500) || null,
        critical_voice: critical.trim().slice(0, 1000),
        compassionate_voice: compassionate.trim().slice(0, 1000),
      });
      toast.success("Diálogo registrado");
      navigate("/diario");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const canSave = critical.trim() && compassionate.trim();

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">Diálogo interno</h1>
        <HistoryPanel<{ id: string; created_at: string | null; situation: string | null; critical_voice: string; compassionate_voice: string }>
          tableName="internal_dialogues"
          renderItem={(item) => (
            <p className="text-xs text-foreground truncate">{item.situation || item.critical_voice.slice(0, 50)}</p>
          )}
          renderDetail={(item) => (
            <div className="space-y-3">
              {item.situation && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Situación</p>
                  <p className="text-sm font-body">{item.situation}</p>
                </div>
              )}
              <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-3">
                <p className="font-display text-xs text-destructive mb-1">Yo crítico</p>
                <p className="text-sm font-body whitespace-pre-wrap">{item.critical_voice}</p>
              </div>
              <div className="rounded-xl border border-success/20 bg-success/5 p-3">
                <p className="font-display text-xs text-success mb-1">Yo compasivo</p>
                <p className="text-sm font-body whitespace-pre-wrap">{item.compassionate_voice}</p>
              </div>
            </div>
          )}
        />
      </div>

      <p className="mb-5 text-xs text-muted-foreground">
        Poné en palabras las dos voces que conviven en vos. Escuchá al yo crítico y después respondele desde la compasión.
      </p>

      <div className="flex-1 space-y-4">
        {/* Situation */}
        <div>
          <label className="mb-1.5 block font-display text-sm font-medium">Situación (opcional)</label>
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="¿Qué disparó este diálogo?"
            maxLength={500}
            className="w-full rounded-2xl border border-border bg-card p-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
          />
        </div>

        {/* Two columns on desktop, stacked on mobile */}
        <div className="grid gap-4 md:grid-cols-2">
          {/* Critical voice */}
          <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-destructive" />
              <span className="font-display text-xs font-medium text-destructive">Yo crítico</span>
            </div>
            <textarea
              value={critical}
              onChange={(e) => setCritical(e.target.value)}
              placeholder="¿Qué te dice esa voz dura?&#10;Ej: 'No servís para nada', 'Siempre hacés todo mal'"
              maxLength={1000}
              className="w-full resize-none rounded-xl border-0 bg-transparent p-0 text-sm font-body leading-relaxed placeholder:text-destructive/40 focus:outline-none"
              rows={5}
            />
          </div>

          {/* Compassionate voice */}
          <div className="rounded-2xl border border-success/20 bg-success/5 p-4">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-success" />
              <span className="font-display text-xs font-medium text-success">Yo compasivo</span>
            </div>
            <textarea
              value={compassionate}
              onChange={(e) => setCompassionate(e.target.value)}
              placeholder="¿Qué le responderías con amabilidad?&#10;Ej: 'Estás haciendo lo mejor que podés', 'Tenés derecho a equivocarte'"
              maxLength={1000}
              className="w-full resize-none rounded-xl border-0 bg-transparent p-0 text-sm font-body leading-relaxed placeholder:text-success/40 focus:outline-none"
              rows={5}
            />
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
        {saving ? "Guardando..." : "Guardar diálogo"}
      </button>
    </div>
  );
}
