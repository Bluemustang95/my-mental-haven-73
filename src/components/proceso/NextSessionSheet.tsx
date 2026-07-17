import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MapPin, Video, X, Repeat } from "lucide-react";
import { toast } from "sonner";
import { useHideBottomNav } from "@/hooks/useUiChrome";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type SessionModality = "presencial" | "virtual";

export interface NextSessionData {
  date: string; // YYYY-MM-DD (local)
  time: string; // HH:MM (24h)
  modality: SessionModality;
  location: string;
  weeklyRecurring: boolean;
}

interface Props {
  open: boolean;
  initial: NextSessionData | null;
  onClose: () => void;
  onSave: (data: NextSessionData) => void;
}

const empty: NextSessionData = {
  date: "", time: "", modality: "presencial", location: "", weeklyRecurring: true,
};

const LOCAL_META_KEY = "resma:next-session:meta"; // keeps modality + location (not stored in DB yet)

export function NextSessionSheet({ open, initial, onClose, onSave }: Props) {
  const { user } = useAuth();
  const [form, setForm] = useState<NextSessionData>(initial ?? empty);
  const [saving, setSaving] = useState(false);
  useHideBottomNav(open);

  useEffect(() => {
    if (open) setForm(initial ?? empty);
  }, [open, initial]);

  const setModality = (m: SessionModality) => setForm((f) => ({ ...f, modality: m }));

  const handleSave = async () => {
    if (!form.date || !form.time) {
      toast.error("Completá fecha y hora");
      return;
    }
    if (!user) {
      toast.error("Sesión no iniciada");
      return;
    }
    setSaving(true);

    // Build UTC timestamp from local date+time
    const localIso = `${form.date}T${form.time}:00`;
    const dt = new Date(localIso);
    if (isNaN(dt.getTime())) {
      toast.error("Fecha u hora inválida");
      setSaving(false);
      return;
    }
    const nextIso = dt.toISOString();
    const dow = dt.getDay(); // 0-6 local

    const { error } = await supabase
      .from("patient_app_profiles")
      .update({
        next_session_at: nextIso,
        session_weekly_recurring: form.weeklyRecurring,
        session_day_of_week: dow,
        session_time: form.time + ":00",
        last_session_notification_at: null,
      })
      .eq("user_id", user.id);

    if (error) {
      console.error("save next_session_at:", error);
      toast.error("No se pudo guardar la sesión");
      setSaving(false);
      return;
    }

    // Local-only metadata (modality + location) — not persisted upstream.
    try {
      localStorage.setItem(LOCAL_META_KEY, JSON.stringify({
        modality: form.modality, location: form.location,
      }));
    } catch { /* noop */ }

    onSave(form);
    toast.success("✓ Sesión guardada. Te avisamos 24 hs antes.", {
      duration: 3200, position: "top-center",
    });
    setSaving(false);
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

            {/* Modality segmented */}
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

            {/* Weekly recurring toggle */}
            <button
              type="button"
              onClick={() => setForm((f) => ({ ...f, weeklyRecurring: !f.weeklyRecurring }))}
              className={`mt-4 flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                form.weeklyRecurring
                  ? "border-[#7cc2c8]/40 bg-[#7cc2c8]/10"
                  : "border-slate-100 bg-slate-50"
              }`}
            >
              <span className={`flex h-9 w-9 items-center justify-center rounded-xl ${form.weeklyRecurring ? "bg-[#7cc2c8]/25 text-[#0e7c8a]" : "bg-white text-slate-400"}`}>
                <Repeat size={16} />
              </span>
              <div className="flex-1">
                <p className="text-[13px] font-semibold text-slate-800">Repetir cada semana</p>
                <p className="text-[11px] text-slate-500">
                  Se agenda automáticamente cada 7 días.
                </p>
              </div>
              <span className={`h-5 w-9 rounded-full transition ${form.weeklyRecurring ? "bg-[#7cc2c8]" : "bg-slate-200"} relative`}>
                <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition ${form.weeklyRecurring ? "left-4" : "left-0.5"}`} />
              </span>
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="mt-6 w-full rounded-2xl bg-[#101927] py-4 font-display text-[14px] font-bold text-white transition active:scale-[0.98] disabled:opacity-60"
            >
              {saving ? "Guardando…" : "Guardar Cambios"}
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function loadLocalMeta(): { modality: SessionModality; location: string } {
  try {
    const raw = localStorage.getItem(LOCAL_META_KEY);
    if (!raw) return { modality: "presencial", location: "" };
    const parsed = JSON.parse(raw);
    return {
      modality: parsed.modality === "virtual" ? "virtual" : "presencial",
      location: typeof parsed.location === "string" ? parsed.location : "",
    };
  } catch {
    return { modality: "presencial", location: "" };
  }
}
