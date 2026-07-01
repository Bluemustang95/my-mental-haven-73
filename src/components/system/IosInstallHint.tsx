import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Share, Plus, X } from "lucide-react";

const STORAGE_KEY = "resma:ios-install-hint";

function isIos(): boolean {
  if (typeof navigator === "undefined") return false;
  return /iP(hone|ad|od)/.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false;
  const mm = window.matchMedia?.("(display-mode: standalone)").matches;
  const legacy = (window.navigator as any).standalone === true;
  return !!(mm || legacy);
}

export function IosInstallHint() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!isIos() || isStandalone()) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {}
    const t = setTimeout(() => setOpen(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const dismiss = (remember: boolean) => {
    if (remember) {
      try { localStorage.setItem(STORAGE_KEY, "1"); } catch {}
    }
    setOpen(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[120] bg-black/40 backdrop-blur-sm"
            onClick={() => dismiss(false)}
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[121] rounded-t-[32px] bg-white p-6 shadow-[0_-16px_48px_-12px_rgba(15,23,42,0.35)]"
            style={{ paddingBottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <button
              onClick={() => dismiss(false)}
              aria-label="Cerrar"
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500"
            >
              <X size={16} />
            </button>
            <h2 className="font-display text-[18px] font-bold text-slate-900">
              Instalá RESMA en tu iPhone
            </h2>
            <p className="mt-1 text-[12.5px] text-slate-500">
              Para usarla como app nativa y recibir notificaciones, agregala a tu pantalla de inicio.
            </p>

            <ol className="mt-5 space-y-3">
              <li className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-display text-[13px] font-bold text-[#0e8a92] shadow-sm">1</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-900">Tocá el ícono Compartir</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-500">
                    En la barra inferior de Safari <Share size={12} className="text-blue-500" />
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-display text-[13px] font-bold text-[#0e8a92] shadow-sm">2</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-900">Elegí "Agregar a pantalla de inicio"</p>
                  <p className="mt-0.5 flex items-center gap-1 text-[11.5px] text-slate-500">
                    Bajá en el menú hasta ver <Plus size={12} />
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3 rounded-2xl bg-slate-50 p-3.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white font-display text-[13px] font-bold text-[#0e8a92] shadow-sm">3</span>
                <div className="flex-1">
                  <p className="text-[13px] font-semibold text-slate-900">Tocá "Agregar"</p>
                  <p className="mt-0.5 text-[11.5px] text-slate-500">
                    RESMA aparecerá en tu home como cualquier app.
                  </p>
                </div>
              </li>
            </ol>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
              <button
                onClick={() => dismiss(false)}
                className="rounded-2xl border border-slate-200 bg-white py-3 text-[13px] font-semibold text-slate-600 active:scale-[0.98]"
              >
                Más tarde
              </button>
              <button
                onClick={() => dismiss(true)}
                className="rounded-2xl bg-[#101927] py-3 text-[13px] font-bold text-white active:scale-[0.98]"
              >
                Ya lo hice
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
