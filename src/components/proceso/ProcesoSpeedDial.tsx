import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Sparkles,
  X,
  Pill,
  NotebookPen,
  LineChart,
  FileText,
  type LucideIcon,
} from "lucide-react";

type Action = {
  label: string;
  Icon: LucideIcon;
  color: string;
  to: string;
};

/**
 * Speed dial glassmorphic para "Mi Proceso".
 * Se abre desde un botón Sparkles y despliega accesos rápidos verticales.
 */
export function ProcesoSpeedDial({ inTherapy = false }: { inTherapy?: boolean }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const actions: Action[] = [
    { label: "Medicación", Icon: Pill, color: "#7cc2c8", to: "/mi-proceso/medicacion" },
    { label: "Espejo semanal", Icon: LineChart, color: "#facb60", to: "/mi-proceso/espejo" },
    { label: "Resumen clínico", Icon: FileText, color: "#c98a5e", to: "/mi-proceso/resumen" },
    ...(inTherapy
      ? [
          {
            label: "Notas de terapia",
            Icon: NotebookPen,
            color: "#9b72cf",
            to: "/mi-proceso/terapia",
          } as Action,
        ]
      : []),
  ];

  const go = (to: string) => {
    setOpen(false);
    setTimeout(() => navigate(to), 120);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.button
            aria-label="Cerrar accesos rápidos"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-[9998] bg-black/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      <div
        className="fixed z-[9999] flex flex-col items-end gap-2.5"
        style={{
          right: "max(1rem, env(safe-area-inset-right))",
          bottom: "max(5.5rem, calc(env(safe-area-inset-bottom) + 4.75rem))",
        }}
      >
        <AnimatePresence>
          {open &&
            actions.map((a, i) => (
              <motion.button
                key={a.label}
                initial={{ opacity: 0, y: 12, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: i * 0.04 } }}
                exit={{ opacity: 0, y: 8, scale: 0.9, transition: { delay: (actions.length - i) * 0.02 } }}
                onClick={() => go(a.to)}
                className="pressable flex items-center gap-2.5 rounded-full border border-white/60 py-2 pl-3.5 pr-2 shadow-[0_12px_28px_-18px_rgba(15,23,42,0.55)] active:scale-95"
                style={{
                  background: "rgba(255,255,255,0.72)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                }}
              >
                <span className="font-display text-[12.5px] font-medium text-[#0f172a]">
                  {a.label}
                </span>
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{ background: `${a.color}26` }}
                >
                  <a.Icon size={16} strokeWidth={1.4} style={{ color: a.color }} />
                </span>
              </motion.button>
            ))}
        </AnimatePresence>

        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar accesos rápidos" : "Abrir accesos rápidos"}
          className="pressable flex h-12 w-12 items-center justify-center rounded-full border border-white/50 shadow-[0_14px_30px_-14px_rgba(124,194,200,0.8)] active:scale-95"
          style={{
            background: "linear-gradient(155deg, #7cc2c8 0%, #5aa7ae 100%)",
          }}
        >
          <motion.span animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.2 }}>
            {open ? (
              <X size={20} strokeWidth={1.6} color="#ffffff" />
            ) : (
              <Sparkles size={20} strokeWidth={1.5} color="#ffffff" />
            )}
          </motion.span>
        </button>
      </div>
    </>
  );
}
