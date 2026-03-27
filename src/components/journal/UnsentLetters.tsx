import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Wind, FloppyDisk } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import HistoryPanel from "./HistoryPanel";

export default function UnsentLetters() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [recipient, setRecipient] = useState("");
  const [content, setContent] = useState("");
  const [releasing, setReleasing] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleAction = async (action: "released" | "saved") => {
    if (!user || !content.trim()) return;

    if (action === "released") {
      setReleasing(true);
      // Wait for animation before saving
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

      if (action === "released") {
        toast.success("Carta soltada");
      } else {
        toast.success("Carta guardada para tu proceso");
      }
      setTimeout(() => navigate("/diario"), 500);
    } catch {
      toast.error("Error al guardar");
    } finally {
      setReleasing(false);
      setSaving(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col px-5 pt-14 pb-4 safe-area-top">
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => navigate("/diario")} className="text-muted-foreground">
          <ArrowLeft size={20} />
        </button>
        <h1 className="flex-1 font-display text-lg font-semibold">Cartas que no voy a enviar</h1>
        <HistoryPanel<{ id: string; created_at: string | null; recipient: string | null; content: string; action: string | null }>
          tableName="unsent_letters"
          renderItem={(item) => (
            <div>
              <p className="text-xs font-medium text-foreground">{item.recipient || "Sin destinatario"}</p>
              <p className="text-[11px] text-muted-foreground truncate">{item.content.slice(0, 60)}...</p>
            </div>
          )}
          renderDetail={(item) => (
            <div className="space-y-3">
              {item.recipient && (
                <div>
                  <p className="font-display text-xs text-muted-foreground mb-1">Para</p>
                  <p className="text-sm font-body font-medium">{item.recipient}</p>
                </div>
              )}
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Carta</p>
                <p className="text-sm font-body whitespace-pre-wrap leading-relaxed">{item.content}</p>
              </div>
              <div>
                <p className="font-display text-xs text-muted-foreground mb-1">Acción</p>
                <span className="rounded-full border border-border px-2.5 py-0.5 font-display text-[11px] text-muted-foreground">
                  {item.action === "released" ? "Soltada" : "Guardada"}
                </span>
              </div>
            </div>
          )}
        />
      </div>

      <p className="mb-4 text-xs text-muted-foreground italic">
        Escribí lo que necesitás decir. Después elegí si soltarlo o guardarlo para tu proceso.
      </p>

      <AnimatePresence>
        {!releasing ? (
          <motion.div
            className="flex-1 flex flex-col"
            exit={{ opacity: 0, scale: 0.9, filter: "blur(8px)" }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          >
            <div className="mb-4">
              <label className="mb-1.5 block font-display text-sm font-medium">Para...</label>
              <input
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="¿A quién le escribís? (opcional)"
                maxLength={100}
                className="w-full rounded-2xl border border-border bg-card p-3 text-sm font-body placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              />
            </div>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escribí todo lo que necesites soltar..."
              maxLength={5000}
              className="mb-4 min-h-[220px] flex-1 resize-none rounded-2xl border border-border bg-card p-4 text-sm font-body leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
              autoFocus
            />

            <div className="flex gap-3">
              <button
                onClick={() => handleAction("released")}
                disabled={!content.trim() || saving}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm font-medium transition-all",
                  content.trim()
                    ? "border-2 border-accent bg-accent/10 text-accent-foreground active:scale-[0.98]"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Wind size={16} weight="duotone" />
                Soltar
              </button>
              <button
                onClick={() => handleAction("saved")}
                disabled={!content.trim() || saving}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 rounded-2xl py-3 font-display text-sm font-medium transition-all",
                  content.trim()
                    ? "bg-primary text-primary-foreground active:scale-[0.98]"
                    : "bg-muted text-muted-foreground"
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
              <Wind size={48} weight="duotone" className="mx-auto mb-3 text-accent" />
              <p className="font-display text-sm font-medium text-muted-foreground">Soltando...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
