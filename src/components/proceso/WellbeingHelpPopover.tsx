import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function WellbeingHelpPopover() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] transition active:scale-95"
        aria-label="Ayuda del índice de bienestar"
      >
        <HelpCircle size={15} />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setOpen(false)} className="fixed inset-0 z-[95] bg-black/45" />
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
              transition={{ duration: 0.28, ease: [0.32, 1, 0.28, 1] }}
              className="fixed inset-x-3 bottom-4 z-[96] mx-auto max-w-md rounded-3xl bg-white p-5 shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h4 className="font-serif text-[17px] font-medium text-[#0f172a]">Cómo se calcula tu índice</h4>
                <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"><X size={15} /></button>
              </div>
              <div className="mt-3 space-y-3 text-[12.5px] leading-relaxed text-[#334155]">
                <p>
                  Es un número de <b>0 a 100</b> que combina lo que registrás cada semana: ánimo, sueño, hábitos, uso clínico (pensamientos, DBT, diario, mindfulness, pack, reflexiones) y — si aplica — resultados de tests y adherencia a medicación.
                </p>
                <div className="rounded-2xl bg-[#f8fafc] p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">Peso base</p>
                  <ul className="mt-1.5 space-y-0.5 text-[12px]">
                    <li>Ánimo · <b>25%</b></li>
                    <li>Sueño · <b>20%</b></li>
                    <li>Hábitos · <b>15%</b></li>
                    <li>Uso clínico · <b>15%</b></li>
                    <li>Evaluaciones · <b>15%</b></li>
                    <li>Medicación · <b>10%</b> (solo si registrás)</li>
                  </ul>
                </div>
                <p>
                  <b>No te penaliza lo que no hacés.</b> Si un área no tiene datos, el sistema la ignora y reparte los pesos entre las demás.
                </p>
                <p>
                  <b>Los hábitos cuentan por completación</b>, no por creación: armar un hábito no suma; cumplirlo sí.
                </p>
                <p className="text-[11.5px] text-[#64748b]">
                  A veces baja aunque estés bien: el índice mira registros, no cómo te sentís por dentro. Es una foto del <i>proceso</i>.
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
