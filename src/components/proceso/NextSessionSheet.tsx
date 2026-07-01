import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Video, X } from "lucide-react";
import { toast } from "sonner";
import { useHideBottomNav } from "@/hooks/useUiChrome";

export type SessionModality = "presencial" | "virtual";

export interface NextSessionData {
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  modality: SessionModality;
  location: string;
}

interface Props {
  open: boolean;
  initial: NextSessionData | null;
  onClose: () => void;
  onSave: (data: NextSessionData) => void;
}

const empty: NextSessionData = { date: "", time: "", modality: "presencial", location: "" };

export function NextSessionSheet({ open, initial, onClose, onSave }: Props) {
  const [form, setForm] = useState<NextSessionData>(initial ?? empty);
  useHideBottomNav(open);

  useEffect(() => {
    if (open) setForm(initial ?? empty);
  }, [open, initial]);

  const setModality = (m: SessionModality) => setForm((f) => ({ ...f, modality: m }));

  const handleSave = () => {
    if (!form.date || !form.time) {
      toast.error("Completá fecha y hora");
      return;
    }
    onSave(form);
    toast.success("✓ Sesión actualizada correctamente", { duration: 3000, position: "top-center" });
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[70] bg-slate-900/40 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            className="fixed inset-x-0 bottom-0 z-[71] rounded-t-[32px] bg-white p-6 pb-8 shadow-[0_-16px_48px_-12px_rgba(15,23,42,0.25)]"
            style={{ paddingBottom: "calc(2rem + env(safe-area-inset-bottom))" }}
          >
            <div className="mx-auto mb-4 h-1.5 w-10 rounded-full bg-slate-200" />
            <button
              onClick={onClose}
              className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition active:scale-95"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>

            <h2 className="font-display text-[18px] font-bold text-slate-900">Próxima sesión</h2>
            <p className="mt-0.5 text-[12px] text-slate-500">Configurá los datos de tu próximo encuentro.</p>

            {/* Segmented control */}
            <div className="mt-5 flex gap-1.5 rounded-[16px] bg-slate-50 p-1.5">
              {(["presencial", "virtual"] as const).map((m) => {
                const active = form.modality === m;
                const Icon = m === "presencial" ? MapPin : Video;
                return (
                  <button
                    key={m}
                    onClick={() => setModality(m)}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-[12px] py-2.5 text-[12.5px] font-semibold transition ${
                      active ? "bg-white text-blue-600 shadow-sm" : "text-slate-500"
                    }`}
                  >
                    <Icon size={14} />
                    {m === "presencial" ? "Presencial" : "Virtual"}
                  </button>
                );
              })}
            </div>

            {/* Date + time */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <label className="flex flex-col gap-1.5">
                <span className="pl-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Día</span>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  className="rounded-2xl bg-slate-50 p-3.5 text-[13px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="pl-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">Hora</span>
                <input
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                  className="rounded-2xl bg-slate-50 p-3.5 text-[13px] font-medium text-slate-900 outline-none focus:ring-2 focus:ring-blue-200"
                />
              </label>
            </div>

            {/* Conditional location */}
            <label className="mt-4 flex flex-col gap-1.5">
              <span className="pl-1 text-[10.5px] font-semibold uppercase tracking-wide text-slate-500">
                {form.modality === "presencial" ? "Dirección del consultorio" : "Link de la videollamada"}
              </span>
              <textarea
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                rows={form.modality === "presencial" ? 3 : 2}
                placeholder={
                  form.modality === "presencial"
                    ? "Av. Cabildo 1500, Consultorio 4B"
                    : "https://meet.google.com/..."
                }
                className="resize-none rounded-2xl bg-slate-50 p-3.5 text-[13px] text-slate-900 outline-none placeholder:text-slate-400 focus:ring-2 focus:ring-blue-200"
              />
            </label>

            <button
              onClick={handleSave}
              className="mt-6 w-full rounded-2xl bg-[#101927] py-4 font-display text-[14px] font-bold text-white transition active:scale-[0.98]"
            >
              Guardar Cambios
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
