import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, ClockCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useConsistentBack } from "@/hooks/useConsistentBack";

export default function InternalDialogue() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useConsistentBack("/diario/herramientas");
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
      goBack();
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  const canSave = critical.trim() && compassionate.trim();

  return (
    <div className="flex min-h-screen flex-col bg-resource-selfcare-bg px-5 pt-14 pb-4 text-resource-selfcare-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-selfcare-accent/15 bg-card/75 text-resource-selfcare-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Diálogo interno</h1>
          <p className="font-sans text-xs leading-5 text-resource-selfcare-accent/65">Las dos voces que conviven en vos</p>
        </div>
        <button
          onClick={() => navigate("/diario/dialogo/historial", { state: location.state })}
          className="flex items-center gap-1.5 rounded-full border border-resource-selfcare-accent/15 bg-card/75 px-3 py-1.5 font-display text-[11px] font-semibold text-resource-selfcare-accent shadow-sm transition-all active:scale-95"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <p className="mb-5 font-sans text-xs leading-relaxed text-resource-selfcare-accent/70">
        Escuchá al yo crítico y respondele desde la compasión.
      </p>

      <div className="flex-1 space-y-4">
        <div>
          <label className="mb-1.5 block font-display text-sm font-semibold">Situación (opcional)</label>
          <input
            value={situation}
            onChange={(e) => setSituation(e.target.value)}
            placeholder="¿Qué disparó este diálogo?"
            maxLength={500}
            className="w-full rounded-2xl border border-resource-selfcare-accent/15 bg-card/75 p-3 font-sans text-sm text-resource-selfcare-accent placeholder:text-resource-selfcare-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-selfcare-accent/20"
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-resource-selfcare-accent/20 bg-card/75 p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-resource-selfcare-accent" />
              <span className="font-display text-xs font-semibold uppercase tracking-wider">Yo crítico</span>
            </div>
            <textarea
              value={critical}
              onChange={(e) => setCritical(e.target.value)}
              placeholder="¿Qué te dice esa voz dura?"
              maxLength={1000}
              rows={5}
              className="w-full resize-none rounded-xl border-0 bg-transparent p-0 font-sans text-sm leading-relaxed text-resource-selfcare-accent placeholder:text-resource-selfcare-accent/40 focus:outline-none"
            />
          </div>

          <div className="rounded-2xl border border-resource-selfcare-accent/15 bg-resource-selfcare-bg/55 p-4 shadow-sm">
            <div className="mb-2 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-resource-selfcare-accent/60" />
              <span className="font-display text-xs font-semibold uppercase tracking-wider">Yo compasivo</span>
            </div>
            <textarea
              value={compassionate}
              onChange={(e) => setCompassionate(e.target.value)}
              placeholder="¿Qué le responderías con amabilidad?"
              maxLength={1000}
              rows={5}
              className="w-full resize-none rounded-xl border-0 bg-transparent p-0 font-sans text-sm leading-relaxed text-resource-selfcare-accent placeholder:text-resource-selfcare-accent/40 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <button
        onClick={save}
        disabled={!canSave || saving}
        className={cn(
          "mt-4 w-full rounded-2xl py-3 font-display text-sm font-semibold transition-all",
          canSave ? "bg-resource-selfcare-accent text-primary-foreground active:scale-[0.98]" : "bg-card/55 text-resource-selfcare-accent/45"
        )}
      >
        {saving ? "Guardando..." : "Guardar diálogo"}
      </button>
    </div>
  );
}
