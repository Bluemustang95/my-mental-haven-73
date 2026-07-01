import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageCircle, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useHideBottomNav } from "@/hooks/useUiChrome";


const WHATSAPP_NUMBER = "5491138940804";

interface Props {
  open: boolean;
  phone: string;
  onClose: () => void;
  onConfirmed: () => void;
}

export function ContactConfirmDialog({ open, phone, onClose, onConfirmed }: Props) {
  const [busy, setBusy] = useState(false);
  useHideBottomNav(open);


  const handleYes = async () => {
    setBusy(true);
    try {
      const { error } = await supabase.functions.invoke("bridge-proxy", {
        body: { action: "confirm-contact", payload: { phone } },
      });
      if (error) throw error;
      toast.success("¡Genial! Quedó registrado.");
      onConfirmed();
      onClose();
    } catch (e: any) {
      toast.error("No pudimos registrarlo. Intentá de nuevo.");
    } finally {
      setBusy(false);
    }
  };

  const handleNo = () => {
    const msg = encodeURIComponent(
      "Hola RESMA, el profesional aún no me contactó. ¿Pueden ayudarme?",
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${msg}`, "_blank");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-[32px] border border-white/60 bg-white/95 p-6 backdrop-blur-2xl sm:rounded-[32px]"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-foreground/60"
            >
              <X size={18} />
            </button>
            <h3 className="font-display text-xl font-bold text-foreground">
              ¿Ya te contactó el profesional?
            </h3>
            <p className="mt-1 text-sm text-foreground/65">
              Si ya hablaron por teléfono o WhatsApp, confirmá para desbloquear sus datos.
            </p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                onClick={handleNo}
                className="flex flex-col items-center gap-1 rounded-2xl border border-foreground/10 bg-white p-4 text-sm font-semibold text-foreground transition active:scale-[0.98]"
              >
                <MessageCircle size={20} className="text-emerald-500" />
                Aún no
                <span className="text-[11px] font-normal text-foreground/55">
                  Escribinos por WhatsApp
                </span>
              </button>
              <button
                onClick={handleYes}
                disabled={busy}
                className="flex flex-col items-center gap-1 rounded-2xl bg-[#101927] p-4 text-sm font-semibold text-white transition active:scale-[0.98] disabled:opacity-60"
              >
                <CheckCircle2 size={20} />
                Sí, ya hablamos
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
