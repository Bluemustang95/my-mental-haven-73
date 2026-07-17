import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, MessageCircle, X, PartyPopper } from "lucide-react";
import { useState } from "react";
import { useHideBottomNav } from "@/hooks/useUiChrome";
import { RESMA_SUPPORT_WHATSAPP } from "@/lib/constants";

interface Props {
  open: boolean;
  /** Kept for API compatibility; not used to modify remote state. */
  phone?: string;
  onClose: () => void;
  /** Called after user acknowledges the "Sí" flow (UI-only). */
  onAcknowledged?: () => void;
}

type Feedback = null | "yes" | "no";

export function ContactConfirmDialog({ open, onClose, onAcknowledged }: Props) {
  const [feedback, setFeedback] = useState<Feedback>(null);
  useHideBottomNav(open);

  const handleYes = () => {
    setFeedback("yes");
    onAcknowledged?.();
  };

  const handleNo = () => {
    const msg = encodeURIComponent(
      "Hola RESMA, el profesional aún no me contactó. ¿Pueden ayudarme?",
    );
    window.open(`https://wa.me/${RESMA_SUPPORT_WHATSAPP}?text=${msg}`, "_blank");
    setFeedback("no");
  };

  const handleClose = () => {
    setFeedback(null);
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
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md rounded-t-[32px] border border-white/60 bg-white/95 p-6 backdrop-blur-2xl sm:rounded-[32px]"
          >
            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-foreground/5 text-foreground/60"
            >
              <X size={18} />
            </button>

            {feedback === null && (
              <>
                <h3 className="font-display text-xl font-bold text-foreground">
                  ¿Ya te contactó el profesional?
                </h3>
                <p className="mt-1 text-sm text-foreground/65">
                  Es una pregunta informativa. Tu respuesta no cambia el estado de la derivación.
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
                    className="flex flex-col items-center gap-1 rounded-2xl bg-[#101927] p-4 text-sm font-semibold text-white transition active:scale-[0.98]"
                  >
                    <CheckCircle2 size={20} />
                    Sí, ya hablamos
                  </button>
                </div>
              </>
            )}

            {feedback === "yes" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <PartyPopper size={26} />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">¡Bien!</h3>
                <p className="text-sm text-foreground/70">
                  Ya podés coordinar una sesión con el profesional.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 w-full rounded-xl bg-[#101927] py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  Entendido
                </button>
              </div>
            )}

            {feedback === "no" && (
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <MessageCircle size={26} />
                </div>
                <h3 className="font-display text-xl font-bold text-foreground">Estamos para ayudarte</h3>
                <p className="text-sm text-foreground/70">
                  Podés comunicarte con nosotros por WhatsApp y te asistimos.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-2 w-full rounded-xl bg-[#101927] py-2.5 text-sm font-bold text-white transition active:scale-[0.98]"
                >
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
