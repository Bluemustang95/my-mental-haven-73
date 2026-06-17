import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Phone, User, MessageSquare, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TherapySyncModalProps {
  open: boolean;
  onClose: () => void;
  onSynced: (data: { lastName: string; phone: string }) => void;
}

type View = "sync" | "intake" | "success";

export function TherapySyncModal({ open, onClose, onSynced }: TherapySyncModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<View>("sync");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Intake form
  const [fullName, setFullName] = useState("");
  const [intakePhone, setIntakePhone] = useState("");
  const [reason, setReason] = useState("");

  const reset = () => {
    setView("sync");
    setLastName("");
    setPhone("");
    setFullName("");
    setIntakePhone("");
    setReason("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSync = async () => {
    if (!lastName.trim() || !phone.trim()) {
      toast.error("Completá apellido y teléfono.");
      return;
    }
    setSubmitting(true);
    if (user) {
      await supabase
        .from("patient_app_profiles")
        .upsert(
          {
            user_id: user.id,
            linked_last_name: lastName.trim(),
            linked_phone: phone.trim(),
            in_therapy: true,
          },
          { onConflict: "user_id" }
        );
    }
    setSubmitting(false);
    onSynced({ lastName: lastName.trim(), phone: phone.trim() });
    handleClose();
  };

  const handleIntake = async () => {
    if (!fullName.trim() || !intakePhone.trim() || !reason.trim()) {
      toast.error("Completá todos los campos.");
      return;
    }
    setSubmitting(true);
    if (user) {
      await supabase.from("patients_intake").insert({
        user_id: user.id,
        full_name: fullName.trim(),
        contact_phone: intakePhone.trim(),
        consultation_reason: reason.trim(),
      } as any);
    }
    setSubmitting(false);
    setView("success");
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/45 backdrop-blur-sm sm:items-center"
          onClick={handleClose}
        >
          <motion.div
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 60, opacity: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-md overflow-hidden rounded-t-[32px] border border-white/60 bg-white/85 p-6 shadow-[0_24px_60px_-20px_rgba(16,25,39,0.35)] backdrop-blur-2xl sm:rounded-[32px]"
          >
            <div className="pointer-events-none absolute -top-20 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-[#7cc2c8]/30 blur-3xl" />

            <button
              onClick={handleClose}
              aria-label="Cerrar"
              className="absolute right-4 top-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-foreground/60 backdrop-blur"
            >
              <X size={18} />
            </button>

            {view === "sync" && (
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-foreground">Conectá con RESMA</h2>
                <p className="mt-1 text-sm text-foreground/65">
                  Verificamos tu cuenta de paciente para sincronizar tu seguimiento.
                </p>

                <div className="mt-5 space-y-3">
                  <PillInput
                    placeholder="Apellido"
                    value={lastName}
                    onChange={setLastName}
                    autoFocus
                  />
                  <PillInput
                    placeholder="Número de teléfono"
                    value={phone}
                    onChange={setPhone}
                    type="tel"
                  />
                </div>

                <button
                  onClick={handleSync}
                  disabled={submitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  Verificar y sincronizar <ArrowRight size={18} />
                </button>

                {/* CTA admisión */}
                <button
                  onClick={() => setView("intake")}
                  className="mt-5 w-full rounded-2xl border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 px-4 py-4 text-left transition active:scale-[0.99]"
                >
                  <p className="font-display text-sm font-bold text-foreground">
                    ¿Aún no empezaste tratamiento con nosotros?
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0e8a92]">
                    ¡Hacelo Aquí! →
                  </p>
                </button>
              </div>
            )}

            {view === "intake" && (
              <div className="relative">
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Solicitud de admisión
                </h2>
                <p className="mt-1 text-sm text-foreground/65">
                  Contanos lo esencial. Un coordinador clínico te llama.
                </p>

                <div className="mt-5 space-y-3">
                  <PillInput placeholder="Nombre completo" value={fullName} onChange={setFullName} icon={<User size={16} />} />
                  <PillInput placeholder="Teléfono de contacto" value={intakePhone} onChange={setIntakePhone} type="tel" icon={<Phone size={16} />} />
                  <PillTextarea
                    placeholder="Motivo de consulta"
                    value={reason}
                    onChange={setReason}
                    icon={<MessageSquare size={16} />}
                  />
                </div>

                <button
                  onClick={handleIntake}
                  disabled={submitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  Enviar solicitud
                </button>

                <button
                  onClick={() => setView("sync")}
                  className="mt-3 w-full text-center text-xs font-semibold text-foreground/55"
                >
                  ← Volver
                </button>
              </div>
            )}

            {view === "success" && (
              <div className="relative py-4 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 size={36} strokeWidth={2.2} />
                </div>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  Solicitud enviada
                </h2>
                <p className="mt-2 px-4 text-sm leading-relaxed text-foreground/65">
                  Un coordinador clínico de RESMA te contactará por teléfono a la brevedad.
                </p>
                <button
                  onClick={handleClose}
                  className="mt-6 w-full rounded-2xl bg-[#101927] py-4 text-base font-bold text-white transition active:scale-[0.98]"
                >
                  Entendido
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function PillInput({
  placeholder,
  value,
  onChange,
  type = "text",
  icon,
  autoFocus,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  icon?: React.ReactNode;
  autoFocus?: boolean;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40">
          {icon}
        </span>
      )}
      <input
        autoFocus={autoFocus}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full rounded-full border border-white/70 bg-white/70 py-4 ${icon ? "pl-11 pr-4" : "px-5"} text-[15px] text-foreground placeholder:text-foreground/40 shadow-[inset_0_2px_6px_rgba(16,25,39,0.06)] outline-none backdrop-blur transition focus:border-[#7cc2c8] focus:bg-white`}
      />
    </div>
  );
}

function PillTextarea({
  placeholder,
  value,
  onChange,
  icon,
}: {
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
}) {
  return (
    <div className="relative">
      {icon && (
        <span className="pointer-events-none absolute left-4 top-4 text-foreground/40">{icon}</span>
      )}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={3}
        className={`w-full resize-none rounded-3xl border border-white/70 bg-white/70 py-4 ${icon ? "pl-11 pr-4" : "px-5"} text-[15px] text-foreground placeholder:text-foreground/40 shadow-[inset_0_2px_6px_rgba(16,25,39,0.06)] outline-none backdrop-blur transition focus:border-[#7cc2c8] focus:bg-white`}
      />
    </div>
  );
}
