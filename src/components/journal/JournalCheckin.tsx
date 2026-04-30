import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ClockCounterClockwise, Heart } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
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
    <div className="flex min-h-screen flex-col bg-resource-safety-bg px-5 pt-14 pb-4 text-resource-safety-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-safety-accent/15 bg-card/75 text-resource-safety-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Check-in rápido</h1>
          <p className="font-sans text-xs leading-5 text-resource-safety-accent/65">Registro somático</p>
        </div>
        <button
          onClick={() => navigate("/diario/checkin/historial")}
          className="flex items-center gap-1.5 rounded-full border border-resource-safety-accent/15 bg-card/75 px-3 py-1.5 font-display text-[11px] font-semibold text-resource-safety-accent shadow-sm transition-all active:scale-95"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        {/* Body map */}
        <section className="mb-6 rounded-[2.5rem] border border-resource-safety-accent/15 bg-card/75 p-5 shadow-sm">
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-resource-safety-bg">
            <Heart size={20} weight="duotone" />
          </div>
          <p className="font-display text-base font-semibold">¿Dónde sentís tensión o malestar?</p>
          <p className="mb-3 mt-1 font-sans text-xs leading-5 text-resource-safety-accent/65">Tocá las zonas del cuerpo donde notás algo.</p>
          <BodyMapSvg selected={bodyParts} onToggle={toggleBody} />
        </section>

        {/* Note */}
        <section className="mb-6 rounded-[2.5rem] border border-resource-safety-accent/15 bg-card/75 p-5 shadow-sm">
          <p className="mb-2 font-display text-sm font-semibold">¿Querés describir cómo lo sentís?</p>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Opcional — describí la sensación, intensidad, contexto..."
            className="w-full resize-none rounded-[2rem] border border-resource-safety-accent/15 bg-resource-safety-bg/55 p-4 font-sans text-sm text-resource-safety-accent placeholder:text-resource-safety-accent/40 focus:outline-none focus:ring-2 focus:ring-resource-safety-accent/20"
            rows={3}
          />
        </section>

        <button
          onClick={save}
          disabled={bodyParts.length === 0 || saving}
          className={cn(
            "w-full rounded-[3rem] py-4 font-display text-sm font-semibold shadow-lg transition-all",
            bodyParts.length > 0
              ? "bg-resource-safety-accent text-primary-foreground shadow-resource-safety-accent/20 active:scale-[0.98]"
              : "bg-card/70 text-resource-safety-accent/40 shadow-transparent"
          )}
        >
          {saving ? "Guardando..." : "Registrar check-in"}
        </button>
      </motion.div>
    </div>
  );
}
