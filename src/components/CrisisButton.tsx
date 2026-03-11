import { useState } from "react";
import { Phone, X, Lifebuoy } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";

const emergencyLines = [
  { label: "Centro de Asistencia al Suicida", number: "135" },
  { label: "Línea contra la Violencia", number: "137" },
];

export function CrisisButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed right-4 bottom-20 z-50 flex h-11 w-11 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-lg transition-transform active:scale-95"
        aria-label="Línea de crisis"
      >
        <Lifebuoy size={22} weight="bold" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-t-3xl bg-card p-6 pb-10"
            >
              <div className="mb-6 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  ¿Necesitás ayuda ahora?
                </h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              <p className="mb-6 text-sm text-muted-foreground font-body">
                Si estás en crisis o conocés a alguien que lo está, estas líneas son gratuitas, confidenciales y funcionan las 24 horas.
              </p>

              <div className="space-y-3">
                {emergencyLines.map((line) => (
                  <a
                    key={line.number}
                    href={`tel:${line.number}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors active:bg-muted"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <Phone size={20} weight="fill" />
                    </div>
                    <div>
                      <p className="font-display text-sm font-medium">{line.label}</p>
                      <p className="font-display text-lg font-bold">{line.number}</p>
                    </div>
                  </a>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
