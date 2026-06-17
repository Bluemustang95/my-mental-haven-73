import { motion, AnimatePresence } from "framer-motion";
import { X, ExternalLink, Apple } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  variant?: "manage" | "restore";
}

export function ManageSubscriptionModal({ open, onClose, variant = "manage" }: Props) {
  const isManage = variant === "manage";
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/45 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.92, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.92, opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-white/70 bg-white/90 p-6 text-center shadow-[0_24px_60px_-20px_rgba(16,25,39,0.35)] backdrop-blur-2xl"
          >
            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground/55"
            >
              <X size={18} />
            </button>

            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-foreground/[0.06] text-foreground">
              {isManage ? <ExternalLink size={24} /> : <Apple size={24} />}
            </div>

            <h3 className="font-display text-lg font-bold text-foreground">
              {isManage ? "Abriendo gestión de suscripción" : "Restaurando compras"}
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-foreground/65">
              {isManage
                ? "Te redirigimos al panel oficial de App Store o Google Play para gestionar tu plan."
                : "Verificando compras previas vinculadas a tu ID de Apple o Google."}
            </p>

            <div className="mt-5 flex gap-2">
              <div className="flex-1 rounded-2xl border border-foreground/10 bg-white py-3 text-xs font-semibold text-foreground/70">
                App Store
              </div>
              <div className="flex-1 rounded-2xl border border-foreground/10 bg-white py-3 text-xs font-semibold text-foreground/70">
                Google Play
              </div>
            </div>

            <button
              onClick={onClose}
              className="mt-5 w-full rounded-2xl bg-[#101927] py-3.5 text-sm font-bold text-white transition active:scale-[0.98]"
            >
              Cerrar
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
