import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, ShieldCheck, X, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { loadHotlines, detectUserCountry, type Hotline } from "@/lib/crisisHotlines";

/**
 * Modal de crisis activado al detectar ideación suicida (p.ej. PHQ-9 Q9 ≥ 1).
 * No se cierra con backdrop ni con ESC: requiere acción explícita.
 */
export function CrisisModal({ open, onAcknowledge }: { open: boolean; onAcknowledge: () => void }) {
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    (async () => {
      const c = (await detectUserCountry()) ?? "AR";
      setHotlines(await loadHotlines(c));
    })();
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 p-5 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.96, y: 8 }}
            animate={{ scale: 1, y: 0 }}
            className="w-full max-w-sm rounded-3xl bg-card p-6 shadow-2xl"
          >
            <div className="mb-3 flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-destructive/15 text-destructive">
                <Heart size={22} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-destructive">
                  Estamos con vos
                </p>
                <h2 className="font-display text-lg font-bold">Querés hablar con alguien ahora.</h2>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted-foreground">
              Notamos en tus respuestas que estás pasando por un momento muy difícil. No estás solo/a.
              Estas líneas son gratuitas y confidenciales, atienden las 24 horas.
            </p>

            <div className="mt-4 space-y-2">
              {hotlines.map((h) => (
                <a
                  key={h.id}
                  href={`tel:${h.phone.replace(/\s+/g, "")}`}
                  className="flex items-center gap-3 rounded-2xl border border-destructive/20 bg-destructive/5 p-3 active:scale-[0.99]"
                >
                  <Phone size={18} className="text-destructive" />
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{h.label}</p>
                    <p className="font-display text-lg font-bold text-destructive">{h.phone}</p>
                  </div>
                </a>
              ))}
            </div>

            <button
              onClick={() => navigate("/herramientas/plan-seguridad")}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border border-border py-2.5 text-sm font-medium"
            >
              <ShieldCheck size={16} /> Activar mi plan de seguridad
            </button>

            <button
              onClick={onAcknowledge}
              className="mt-3 w-full rounded-2xl bg-foreground py-3 text-sm font-semibold text-background"
            >
              Entendido, continuar
            </button>

            <p className="mt-3 text-center text-[10px] text-muted-foreground">
              Si estás en peligro inmediato, llamá al servicio de emergencias local.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
