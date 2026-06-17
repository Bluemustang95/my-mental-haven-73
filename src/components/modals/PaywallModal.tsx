import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Check, Lock } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { toast } from "sonner";

interface PaywallModalProps {
  open: boolean;
  onClose: () => void;
  featureName?: string;
}

const benefits = [
  "Acceso ilimitado a todos los recursos",
  "Mindfulness, regulación, tolerancia y más",
  "Pack de actividades guiadas",
  "Sin avisos, sin límites",
];

export function PaywallModal({ open, onClose, featureName }: PaywallModalProps) {
  const { setPlan } = usePlan();

  const handleSubscribe = async () => {
    // Simulación de pasarela del sistema operativo
    toast.success("Suscripción activada — Premium Semanal");
    await setPlan("premium");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm sm:items-center"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-t-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_60px_-20px_rgba(16,25,39,0.35)] backdrop-blur-2xl sm:rounded-[32px]"
          >
            {/* Glow */}
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#7cc2c8]/30 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-16 right-0 h-40 w-40 rounded-full bg-[#facb60]/25 blur-3xl" />

            <button
              onClick={onClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-foreground/60 backdrop-blur transition hover:bg-white"
            >
              <X size={18} />
            </button>

            <div className="relative">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#facb60]/30 text-[#101927]">
                <Lock size={24} strokeWidth={2.2} />
              </div>

              <h2 className="text-center font-display text-2xl font-bold text-foreground">
                {featureName ? `${featureName} es Premium` : "Función Premium"}
              </h2>
              <p className="mt-1.5 text-center text-sm text-foreground/65">
                Desbloqueá todo el catálogo de recursos clínicos de RESMA.
              </p>

              {/* Price card */}
              <div className="mt-5 rounded-2xl border border-white/70 bg-white/70 p-5 shadow-[0_8px_24px_-12px_rgba(16,25,39,0.12)] backdrop-blur-xl">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="font-display text-4xl font-bold text-foreground">USD 0.99</span>
                  <span className="text-sm font-medium text-foreground/55">/ semana</span>
                </div>
                <p className="mt-1 text-center text-[11px] uppercase tracking-widest text-foreground/50">
                  Premium Autoguiado
                </p>
              </div>

              {/* Benefits */}
              <ul className="mt-5 space-y-2.5">
                {benefits.map((b) => (
                  <li key={b} className="flex items-start gap-2.5 text-sm text-foreground/85">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#7cc2c8]/25 text-[#101927]">
                      <Check size={12} strokeWidth={3} />
                    </span>
                    {b}
                  </li>
                ))}
              </ul>

              <button
                onClick={handleSubscribe}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98]"
              >
                <Sparkles size={18} />
                Suscribirme — USD 0.99/sem
              </button>

              <p className="mt-3 text-center text-[11px] leading-relaxed text-foreground/45">
                Tu suscripción se gestiona de forma segura a través de App Store o Google Play.
                Podés cancelarla en cualquier momento.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
