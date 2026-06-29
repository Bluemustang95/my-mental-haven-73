import { useEffect, useState } from "react";
import { Phone, X, Lifebuoy, ShieldCheck } from "@phosphor-icons/react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { loadHotlines, detectUserCountry, type Hotline } from "@/lib/crisisHotlines";

export function CrisisButton() {
  const [open, setOpen] = useState(false);
  const [hotlines, setHotlines] = useState<Hotline[]>([]);
  const [country, setCountry] = useState<string>("AR");
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      const c = (await detectUserCountry()) ?? "AR";
      setCountry(c);
      const hl = await loadHotlines(c);
      setHotlines(hl);
    })();
  }, []);

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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-lg font-semibold">
                  ¿Necesitás ayuda ahora?
                </h2>
                <button onClick={() => setOpen(false)} className="text-muted-foreground">
                  <X size={20} />
                </button>
              </div>

              <p className="mb-4 text-sm text-muted-foreground font-body">
                Líneas gratuitas y confidenciales en <strong>{country}</strong>. Atienden 24h.
              </p>

              <div className="space-y-3">
                {hotlines.map((line) => (
                  <a
                    key={line.id}
                    href={`tel:${line.phone.replace(/\s+/g, "")}`}
                    className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4 transition-colors active:bg-muted"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <Phone size={20} weight="fill" />
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-sm font-medium">{line.label}</p>
                      <p className="font-display text-lg font-bold">{line.phone}</p>
                    </div>
                  </a>
                ))}
                {hotlines.length === 0 && (
                  <p className="text-xs text-muted-foreground">Cargando líneas…</p>
                )}
              </div>

              <button
                onClick={() => { setOpen(false); navigate("/herramientas/plan-seguridad"); }}
                className="mt-4 flex w-full items-center justify-center gap-2 rounded-2xl border border-border bg-muted/40 py-3 text-sm font-medium"
              >
                <ShieldCheck size={16} /> Ver mi plan de seguridad
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
