import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ArrowLeft, Wind, FloppyDisk, ClockCounterClockwise } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { useConsistentBack } from "@/hooks/useConsistentBack";

export default function UnsentLetters() {
  const navigate = useNavigate();
  const location = useLocation();
  const goBack = useConsistentBack("/diario/herramientas");
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAction = async (action: "released" | "saved") => {
    if (!user || !content.trim()) return;

    if (action === "released") {
      setReleasing(true);
      await new Promise((r) => setTimeout(r, 1500));
    } else {
      setSaving(true);
    }

    try {
      await supabase.from("unsent_letters").insert({
        user_id: user.id,
        recipient: recipient.trim().slice(0, 100) || null,
        content: content.trim().slice(0, 5000),
        action,
      });

      if (action === "released") toast.success("Carta soltada");
      else toast.success("Carta guardada para tu proceso");
      setTimeout(() => goBack(), 500);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setReleasing(false);
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-resource-eating-bg px-5 pt-14 pb-4 text-resource-eating-accent safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={goBack} className="flex h-10 w-10 items-center justify-center rounded-full border border-resource-eating-accent/15 bg-card/75 text-resource-eating-accent shadow-sm">
          <ArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="font-mindful text-3xl leading-tight">Cartas sin enviar</h1>
          <p className="font-sans text-xs leading-5 text-resource-eating-accent/65">Lo que necesitás decir</p>
        </div>
        <button
          onClick={() => navigate("/diario/cartas/historial", { state: location.state })}
          className="flex items-center gap-1.5 rounded-full border border-resource-eating-accent/15 bg-card/75 px-3 py-1.5 font-display text-[11px] font-semibold text-resource-eating-accent shadow-sm transition-all active:scale-95"
        >
          <ClockCounterClockwise size={13} weight="duotone" />
          Historial
        </button>
      </div>

      <p className="mb-4 font-sans text-xs italic leading-relaxed text-resource-eating-accent/70">
        Escribí lo que necesitás decir. Después elegí si soltarlo o guardarlo.
      </p>

      <AnimatePresence>
        {!releasing ? (
          <motion.div
            className="flex flex-1 flex-col"
            exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="mb-4">
              <label className="mb-1.5 block font-display text-sm font-semibold">Para...</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="¿A quién le escribís? (opcional)"
                maxLength={100}
                className="w-full rounded-2xl border border-resource-eating-accent/15 bg-card/75 p-3 font-sans text-sm text-resource-eating-accent placeholder:text-resource-eating-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-eating-accent/20"
              />
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribí todo lo que necesites soltar..."
              maxLength={5000}
              autoFocus
              className="mb-4 min-h-[220px] flex-1 resize-none rounded-2xl border border-resource-eating-accent/15 bg-card/75 p-4 font-sans text-sm leading-relaxed text-resource-eating-accent placeholder:text-resource-eating-accent/45 shadow-sm focus:outline-none focus:ring-2 focus:ring-resource-eating-accent/20"
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleAction("released")}
                disabled={!content.trim() || saving}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm font-semibold transition-all",
                  content.trim()
                    ? "border-2 border-resource-eating-accent bg-card/55 text-resource-eating-accent active:scale-[0.98]"
                    : "bg-card/55 text-resource-eating-accent/45"
                )}
              >
                <Wind size={16} weight="duotone" />
                Soltar
              </button>
              <button
                onClick={() => handleAction("saved")}
                disabled={!content.trim() || saving}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm font-semibold transition-all",
                  content.trim()
                    ? "bg-resource-eating-accent text-primary-foreground active:scale-[0.98]"
                    : "bg-card/55 text-resource-eating-accent/45"
                )}
              >
                <FloppyDisk size={16} />
                {saving ? "Guardando..." : "Guardar"}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 1 }}
            animate={{ opacity: 0, y: -40, filter: "blur(12px)" }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="flex flex-1 items-center justify-center"
          >
            <div className="text-center">
              <Wind size={48} weight="duotone" className="mx-auto mb-3 text-resource-eating-accent" />
              <p className="font-display text-sm font-semibold text-resource-eating-accent/70">Soltando...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
