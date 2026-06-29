import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Phone, User, MessageSquare, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

interface TherapySyncModalProps {
  open: boolean;
  onClose: () => void;
  onSynced: (data: { lastName: string; phone: string }) => void;
}

type View = "sync" | "intake";

export function TherapySyncModal({ open, onClose, onSynced }: TherapySyncModalProps) {
  const { user } = useAuth();
  const [view, setView] = useState<View>("sync");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Intake form
  const [fullName, setFullName] = useState("");
  const [intakePhone, setIntakePhone] = useState("");
  const [intakeEmail, setIntakeEmail] = useState("");
  const [modality, setModality] = useState<"online" | "presencial">("online");
  const [reason, setReason] = useState("");

  const reset = () => {
    setView("sync");
    setLastName("");
    setPhone("");
    setFullName("");
    setIntakePhone("");
    setIntakeEmail("");
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
    try {
      const { data, error } = await supabase.functions.invoke("bridge-proxy", {
        body: { action: "status", payload: { phone: phone.trim(), last_name: lastName.trim() } },
      });
      if (error) throw error;

      if (user) {
        await supabase
          .from("patient_app_profiles")
          .upsert(
            {
              user_id: user.id,
              linked_last_name: lastName.trim(),
              linked_phone: phone.trim(),
              in_therapy: true,
              bridge_last_state: data?.state ?? "searching",
            },
            { onConflict: "user_id" },
          );
      }

      if (data?.found) {
        toast.success("¡Te encontramos! Mirá el seguimiento.");
        onSynced({ lastName: lastName.trim(), phone: phone.trim() });
        reset();
        onClose();
      } else {
        toast.message("No encontramos una derivación con ese teléfono.", {
          description: "Iniciá una solicitud nueva.",
        });
        setIntakePhone(phone.trim());
        setView("intake");
        setSubmitting(false);
      }
    } catch (e: any) {
      toast.error("No pudimos conectar. Intentá de nuevo.");
      setSubmitting(false);
      return;
    }
    setSubmitting(false);
  };

  const handleIntake = async () => {
    if (!fullName.trim() || !intakePhone.trim() || !reason.trim()) {
      toast.error("Completá nombre, teléfono y motivo.");
      return;
    }
    setSubmitting(true);
    try {
      const parts = fullName.trim().split(/\s+/);
      const first = parts.shift() ?? fullName.trim();
      const last = parts.join(" ") || "—";

      const { error } = await supabase.functions.invoke("bridge-proxy", {
        body: {
          action: "intake",
          payload: {
            first_name: first,
            last_name: last,
            phone: intakePhone.trim(),
            email: intakeEmail.trim() || user?.email || null,
            country: "AR",
            modality,
            reason: reason.trim(),
            source: "resma_app",
          },
        },
      });
      if (error) throw error;

      if (user) {
        await supabase
          .from("patient_app_profiles")
          .upsert(
            {
              user_id: user.id,
              linked_last_name: last,
              linked_phone: intakePhone.trim(),
              in_therapy: true,
              bridge_last_state: "searching",
            },
            { onConflict: "user_id" },
          );
      }

      toast.success("Solicitud enviada. Estamos buscando un profesional para vos.");
      onSynced({ lastName: last, phone: intakePhone.trim() });
      reset();
      onClose();
    } catch (e: any) {
      toast.error("No pudimos enviar la solicitud. Intentá de nuevo.");
    } finally {
      setSubmitting(false);
    }
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
            className="relative w-full max-w-md max-h-[92vh] overflow-y-auto rounded-t-[32px] border border-white/60 bg-white/90 p-6 shadow-[0_24px_60px_-20px_rgba(16,25,39,0.35)] backdrop-blur-2xl sm:rounded-[32px]"
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
                  Te buscamos en el sistema de derivaciones.
                </p>

                <div className="mt-5 space-y-3">
                  <PillInput placeholder="Apellido" value={lastName} onChange={setLastName} autoFocus />
                  <PillInput placeholder="Número de teléfono" value={phone} onChange={setPhone} type="tel" />
                </div>

                <button
                  onClick={handleSync}
                  disabled={submitting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-[#101927] py-4 text-base font-bold text-white shadow-[0_10px_24px_-8px_rgba(16,25,39,0.4)] transition active:scale-[0.98] disabled:opacity-60"
                >
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : <>Verificar <ArrowRight size={18} /></>}
                </button>

                <button
                  onClick={() => setView("intake")}
                  className="mt-5 w-full rounded-2xl border border-[#7cc2c8]/40 bg-[#7cc2c8]/10 px-4 py-4 text-left transition active:scale-[0.99]"
                >
                  <p className="font-display text-sm font-bold text-foreground">
                    ¿Aún no empezaste tratamiento con nosotros?
                  </p>
                  <p className="mt-0.5 text-xs font-semibold text-[#0e8a92]">
                    Empezar acá →
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
                  <PillInput placeholder="Email (opcional)" value={intakeEmail} onChange={setIntakeEmail} type="email" icon={<Mail size={16} />} />
                  <div className="flex gap-2">
                    {(["online", "presencial"] as const).map((m) => (
                      <button
                        key={m}
                        onClick={() => setModality(m)}
                        className={`flex-1 rounded-full py-3 text-sm font-semibold capitalize transition ${
                          modality === m
                            ? "bg-[#101927] text-white"
                            : "border border-foreground/15 bg-white/60 text-foreground/70"
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
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
                  {submitting ? <Loader2 size={18} className="animate-spin" /> : "Enviar solicitud"}
                </button>

                <button
                  onClick={() => setView("sync")}
                  className="mt-3 w-full text-center text-xs font-semibold text-foreground/55"
                >
                  ← Volver
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
  placeholder, value, onChange, type = "text", icon, autoFocus,
}: {
  placeholder: string; value: string; onChange: (v: string) => void;
  type?: string; icon?: React.ReactNode; autoFocus?: boolean;
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
  placeholder, value, onChange, icon,
}: {
  placeholder: string; value: string; onChange: (v: string) => void; icon?: React.ReactNode;
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
