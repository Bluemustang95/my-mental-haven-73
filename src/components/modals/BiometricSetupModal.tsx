import { motion, AnimatePresence } from "framer-motion";
import { Fingerprint, X } from "lucide-react";
import { useState } from "react";
import { enrollBiometric } from "@/lib/biometricAuth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  userId: string;
  displayName: string;
  onClose: (result: "enrolled" | "later" | "never") => void;
}

export function BiometricSetupModal({ open, userId, displayName, onClose }: Props) {
  const [busy, setBusy] = useState(false);

  const enable = async () => {
    setBusy(true);
    const ok = await enrollBiometric(userId, displayName);
    setBusy(false);
    if (ok) {
      toast.success("Acceso biométrico activado");
      onClose("enrolled");
    } else {
      toast.error("No se pudo activar. Probá desde Configuración.");
      onClose("later");
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/55 p-4 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: 30, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 30, opacity: 0 }}
            className="relative w-full max-w-sm rounded-3xl bg-white p-6 text-center shadow-2xl"
          >
            <button
              onClick={() => onClose("later")}
              className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full text-foreground/50 hover:bg-black/5"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>

            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-3xl bg-[#7cc2c8]/15 text-[#0f172a]">
              <Fingerprint size={30} weight="bold" />
            </div>

            <h2 className="font-display text-xl font-bold text-foreground">
              Desbloqueá RESMA con Face ID / huella
            </h2>
            <p className="mx-auto mt-1.5 max-w-[280px] text-[12.5px] leading-relaxed text-foreground/60">
              Más rápido y privado. Tu dispositivo guarda la huella localmente, RESMA nunca la ve.
            </p>

            <div className="mt-6 space-y-2">
              <button
                onClick={enable}
                disabled={busy}
                className="w-full rounded-2xl bg-[#101927] py-3.5 text-sm font-bold text-white transition active:scale-[0.98] disabled:opacity-50"
              >
                {busy ? "Activando…" : "Activar ahora"}
              </button>
              <button
                onClick={() => onClose("later")}
                className="w-full rounded-2xl py-2.5 text-[13px] font-semibold text-foreground/55"
              >
                Ahora no
              </button>
              <button
                onClick={() => onClose("never")}
                className="w-full text-[11px] text-foreground/40 underline"
              >
                No volver a preguntar
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
