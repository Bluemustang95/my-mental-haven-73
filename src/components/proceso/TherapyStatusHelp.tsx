import { useState } from "react";
import { HelpCircle, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export function TherapyStatusHelp() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Cómo funcionan los estados"
        className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b] transition active:scale-95"
      >
        <HelpCircle size={13} />
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
                <h4 className="font-serif text-[17px] font-medium text-[#0f172a]">Estados de sincronización</h4>
                <button onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full bg-[#f1f5f9] text-[#64748b]"><X size={15} /></button>
              </div>
              <ul className="mt-3 space-y-2.5 text-[12.5px] leading-relaxed text-[#334155]">
                <li><b>Buscando</b> · estamos identificando un profesional que se ajuste a tu perfil.</li>
                <li><b>Asignado</b> · un profesional aceptó tu caso y va a contactarte dentro de 24&nbsp;hs hábiles.</li>
                <li><b>En coordinación</b> · confirmaste el contacto y están definiendo día y horario.</li>
                <li><b>Concretado</b> · sesión agendada; podés ver notas, resumen y medicación acá.</li>
              </ul>
              <p className="mt-3 text-[11.5px] text-[#64748b]">
                Te avisamos automáticamente cuando cambia tu estado.
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
