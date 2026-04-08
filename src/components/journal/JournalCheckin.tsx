import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "@phosphor-icons/react";
import { cn, localDateStr } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { BodyMapSvg } from "./BodyMapSvg";
import { motion } from "framer-motion";
import { toast } from "sonner";

export default function JournalCheckin() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [bodyParts, setBodyParts] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);

  const toggleBody = (part: string) => {
    setBodyParts((prev) =>
      prev.includes(part) ? prev.filter((p) => p !== part) : [...prev, part]
    );
  };

  const save = async () => {
    if (!user || bodyParts.length === 0) return;
    setSaving(true);

    try {
      const entries = bodyParts.map((part) => ({
        user_id: user.id,
        body_part: part,
        note: note || null,
      }));
      await supabase.from("body_map_entries").insert(entries);

      toast.success("Registro somático guardado");
      navigate("/");
    } catch {
      toast.error("Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-display text-lg font-semibold">Check-in rápido</h1>
          <p className="text-[11px] text-muted-foreground">Registro somático</p>
        </div>
        <button
          onClick={() => navigate("/diario/checkin/historial")}
          className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 font-display text-[11px] text-muted-foreground transition-all active:bg-muted/60"
        >
          Historial
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Body map */}
        <section className="mb-6">
          <p className="mb-2 font-display text-base font-medium">¿Dónde sentís tensión o malestar?</p>
          <p className="mb-3 text-xs text-muted-foreground">Tocá las zonas del cuerpo donde notás algo.</p>
          <BodyMapSvg selected={bodyParts} onToggle={toggleBody} />
        </section>

        <div className="mb-6 h-px bg-border" />

        {/* Note */}
        <section className="mb-6">
          <p className="mb-2 font-display text-sm font-medium">¿Querés describir cómo lo sentís?</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional — describí la sensación, intensidad, contexto..."
            className="w-full resize-none rounded-2xl border border-border bg-card p-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            rows={3}
          />
        </section>

        <button
          onClick={save}
          disabled={bodyParts.length === 0 || saving}
          className={cn(
            "w-full rounded-2xl py-3 font-display text-sm font-medium transition-all",
            bodyParts.length > 0
              ? "bg-primary text-primary-foreground active:scale-[0.98]"
              : "bg-muted text-muted-foreground"
          )}
        >
          {saving ? "Guardando..." : "Registrar check-in"}
        </button>
      </motion.div>
    </div>
  );
}
